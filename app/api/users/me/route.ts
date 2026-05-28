import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      profile: {
        include: {
          currentLevel: { select: { id: true, code: true, nameTh: true, nameEn: true } },
          targetLevel: { select: { id: true, code: true, nameTh: true, nameEn: true } },
        },
      },
      preferences: true,
      streak: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}

const updateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  ageGroup: z.enum(["CHILD", "TEEN", "YOUNG_ADULT", "ADULT", "SENIOR"]).optional(),
  learningGoal: z.string().optional(),
  learningPathCode: z.enum(["GENERAL", "DAILY_LIFE", "STUDENTS", "WORK", "TOEIC", "TOEFL", "IELTS"]).optional(),
  examTarget: z.string().optional(),
  dailyGoalMinutes: z.number().int().min(5).max(120).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await db.userProfile.update({
    where: { userId: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
