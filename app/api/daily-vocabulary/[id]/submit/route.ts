import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  spokenText: z.string().trim().max(200).optional(),
  spellingText: z.string().trim().min(1, "กรุณาพิมพ์สะกดคำ").max(120),
  audioDataUrl: z.string().startsWith("data:audio/").max(5_000_000).optional(),
  audioMimeType: z.string().max(80).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const assignment = await db.dailyVocabularyAssignment.findFirst({
    where: { id, userId: session.user.id },
    include: { vocabulary: true, user: { include: { profile: { select: { displayName: true } } } } },
  });
  if (!assignment) return NextResponse.json({ error: "ไม่พบการบ้านคำศัพท์วันนี้" }, { status: 404 });

  const submittedAt = new Date();
  const updated = await db.dailyVocabularyAssignment.update({
    where: { id },
    data: {
      spokenText: parsed.data.spokenText,
      spellingText: parsed.data.spellingText,
      audioDataUrl: parsed.data.audioDataUrl,
      audioMimeType: parsed.data.audioMimeType,
      status: "COMPLETED",
      submittedAt,
      completedAt: submittedAt,
    },
    include: { vocabulary: true },
  });

  await db.vocabularyProgress.upsert({
    where: { userId_vocabularyId: { userId: session.user.id, vocabularyId: assignment.vocabularyId } },
    update: {
      status: "LEARNING",
      correctCount: { increment: 1 },
      nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    create: {
      userId: session.user.id,
      vocabularyId: assignment.vocabularyId,
      status: "LEARNING",
      correctCount: 1,
      nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  const studentName = assignment.user.profile?.displayName ?? assignment.user.email;
  const reviewHref = `/homework/vocabulary/submissions/${assignment.userId}`;
  const [staff, guardians] = await Promise.all([
    db.user.findMany({
      where: { role: { in: ["ADMIN", "TEACHER"] }, isActive: true },
      select: { id: true },
    }),
    db.guardianStudent.findMany({
      where: { studentId: assignment.userId },
      select: { guardianId: true },
    }),
  ]);
  const recipientIds = Array.from(new Set([
    ...staff.map((user) => user.id),
    ...guardians.map((link) => link.guardianId),
  ])).filter((userId) => userId !== assignment.userId);

  if (recipientIds.length > 0) {
    await db.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type: "HOMEWORK_DUE_TODAY",
        titleTh: "มีการส่งการบ้านท่องศัพท์",
        bodyTh: `${studentName} ส่งคำว่า "${assignment.vocabulary.word}" แล้ว กดเพื่อฟังเสียงและดูประวัติ`,
        data: {
          href: reviewHref,
          assignmentId: updated.id,
          studentId: assignment.userId,
          homeworkType: "DAILY_VOCABULARY",
        },
      })),
    });
  }

  return NextResponse.json({ ok: true, assignment: updated });
}
