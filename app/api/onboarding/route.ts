import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  ageGroup: z.enum(["CHILD", "TEEN", "YOUNG_ADULT", "ADULT", "SENIOR"]),
  learningPathCode: z.enum(["GENERAL", "DAILY_LIFE", "STUDENTS", "WORK", "TOEIC", "TOEFL", "IELTS"]),
  dailyGoalMinutes: z.number().int().min(5).max(120),
  examTarget: z.string().optional(),
  startFromPlacement: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { ageGroup, learningPathCode, dailyGoalMinutes, examTarget, startFromPlacement } = parsed.data;

    // Get Pre-A1 level as default starting level
    const startingLevel = await db.level.findUnique({ where: { code: "PRE_A1" } });

    await db.userProfile.update({
      where: { userId: session.user.id },
      data: {
        ageGroup,
        learningPathCode,
        dailyGoalMinutes,
        examTarget: examTarget ?? null,
        currentLevelId: startFromPlacement ? null : (startingLevel?.id ?? null),
        onboardingDone: true,
      },
    });

    return NextResponse.json({
      redirectTo: startFromPlacement ? "/placement-test" : "/dashboard",
    });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
