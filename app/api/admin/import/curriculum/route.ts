import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const contentSchema = z.object({
  type: z.enum(["TEXT", "FLASHCARD", "CONVERSATION", "EXERCISE"]),
  data: z.record(z.string(), z.unknown()),
});

const lessonSchema = z.object({
  id: z.string().optional(),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  descriptionTh: z.string().optional(),
  skillType: z.enum(["VOCABULARY", "GRAMMAR", "LISTENING", "SPEAKING", "READING", "WRITING"]),
  durationMinutes: z.number().int().min(1).max(120).optional(),
  contents: z.array(contentSchema).min(1),
  homeworkPrompt: z.string().optional(),
});

const unitSchema = z.object({
  id: z.string().optional(),
  nameTh: z.string().min(1),
  nameEn: z.string().min(1),
  descriptionTh: z.string().optional(),
  lessons: z.array(lessonSchema).min(1),
});

const schema = z.object({
  course: z.object({
    id: z.string().optional(),
    levelCode: z.enum(["PRE_A1", "A1", "A2", "B1", "B2", "C1", "C2"]),
    nameTh: z.string().min(1),
    nameEn: z.string().min(1),
    descriptionTh: z.string().optional(),
    orderNum: z.number().int().min(1).optional(),
  }),
  units: z.array(unitSchema).min(1),
});

function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const raw = await file.text();
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const pack = parsed.data;
  const level = await db.level.findUnique({ where: { code: pack.course.levelCode } });
  if (!level) return NextResponse.json({ error: `Unknown level: ${pack.course.levelCode}` }, { status: 400 });

  const courseId = pack.course.id ?? `course-import-${slug(pack.course.levelCode)}-${slug(pack.course.nameEn)}`;
  const course = await db.course.upsert({
    where: { id: courseId },
    update: {
      levelId: level.id,
      nameTh: pack.course.nameTh,
      nameEn: pack.course.nameEn,
      descriptionTh: pack.course.descriptionTh,
      orderNum: pack.course.orderNum ?? 99,
      isPublished: true,
    },
    create: {
      id: courseId,
      levelId: level.id,
      nameTh: pack.course.nameTh,
      nameEn: pack.course.nameEn,
      descriptionTh: pack.course.descriptionTh,
      orderNum: pack.course.orderNum ?? 99,
      isPublished: true,
    },
  });

  let units = 0;
  let lessons = 0;
  let contents = 0;
  let homework = 0;

  for (const [unitIndex, unitInput] of pack.units.entries()) {
    const unitId = unitInput.id ?? `${course.id}-unit-${unitIndex + 1}-${slug(unitInput.nameEn)}`;
    const unit = await db.unit.upsert({
      where: { id: unitId },
      update: {
        courseId: course.id,
        nameTh: unitInput.nameTh,
        nameEn: unitInput.nameEn,
        descriptionTh: unitInput.descriptionTh,
        orderNum: unitIndex + 1,
        isPublished: true,
      },
      create: {
        id: unitId,
        courseId: course.id,
        nameTh: unitInput.nameTh,
        nameEn: unitInput.nameEn,
        descriptionTh: unitInput.descriptionTh,
        orderNum: unitIndex + 1,
        isPublished: true,
      },
    });
    units++;

    for (const [lessonIndex, lessonInput] of unitInput.lessons.entries()) {
      const lessonId = lessonInput.id ?? `${unit.id}-lesson-${lessonIndex + 1}-${slug(lessonInput.nameEn)}`;
      const lesson = await db.lesson.upsert({
        where: { id: lessonId },
        update: {
          unitId: unit.id,
          nameTh: lessonInput.nameTh,
          nameEn: lessonInput.nameEn,
          descriptionTh: lessonInput.descriptionTh,
          skillType: lessonInput.skillType,
          orderNum: lessonIndex + 1,
          durationMinutes: lessonInput.durationMinutes ?? 12,
          isPublished: true,
        },
        create: {
          id: lessonId,
          unitId: unit.id,
          nameTh: lessonInput.nameTh,
          nameEn: lessonInput.nameEn,
          descriptionTh: lessonInput.descriptionTh,
          skillType: lessonInput.skillType,
          orderNum: lessonIndex + 1,
          durationMinutes: lessonInput.durationMinutes ?? 12,
          isPublished: true,
        },
      });
      lessons++;

      for (const [contentIndex, contentInput] of lessonInput.contents.entries()) {
        await db.lessonContent.upsert({
          where: { id: `${lesson.id}-content-${contentIndex + 1}` },
          update: {
            lessonId: lesson.id,
            contentType: contentInput.type,
            data: contentInput.data as Prisma.InputJsonValue,
            orderNum: contentIndex + 1,
          },
          create: {
            id: `${lesson.id}-content-${contentIndex + 1}`,
            lessonId: lesson.id,
            contentType: contentInput.type,
            data: contentInput.data as Prisma.InputJsonValue,
            orderNum: contentIndex + 1,
          },
        });
        contents++;
      }

      if (lessonInput.homeworkPrompt) {
        await db.homework.upsert({
          where: { id: `hw-${lesson.id}` },
          update: {
            lessonId: lesson.id,
            unitId: unit.id,
            nameTh: `การบ้าน: ${lesson.nameTh}`,
            descriptionTh: lessonInput.homeworkPrompt,
            skillType: lesson.skillType,
            isAutoGenerated: true,
            isActive: true,
          },
          create: {
            id: `hw-${lesson.id}`,
            lessonId: lesson.id,
            unitId: unit.id,
            nameTh: `การบ้าน: ${lesson.nameTh}`,
            descriptionTh: lessonInput.homeworkPrompt,
            skillType: lesson.skillType,
            isAutoGenerated: true,
            isActive: true,
          },
        });
        homework++;
      }
    }
  }

  return NextResponse.json({ created: lessons, skipped: 0, errors: [], courseId: course.id, units, lessons, contents, homework });
}
