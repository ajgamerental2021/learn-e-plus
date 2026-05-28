import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weeksBack = parseInt(req.nextUrl.searchParams.get("week") ?? "0");
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() - weeksBack * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [lessons, homework, tests, vocab, streak] = await Promise.all([
    db.userLessonProgress.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        updatedAt: { gte: weekStart, lt: weekEnd },
      },
      include: { lesson: { select: { nameTh: true } } },
    }),
    db.homeworkAssignment.findMany({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        updatedAt: { gte: weekStart, lt: weekEnd },
      },
      include: { homework: { select: { nameTh: true, skillType: true } } },
    }),
    db.testAttempt.findMany({
      where: {
        userId: session.user.id,
        startedAt: { gte: weekStart, lt: weekEnd },
      },
      include: {
        test: { select: { nameTh: true, type: true } },
        result: { select: { passed: true, totalScore: true } },
      },
    }),
    db.vocabularyProgress.count({
      where: {
        userId: session.user.id,
        updatedAt: { gte: weekStart, lt: weekEnd },
      },
    }),
    db.learningStreak.findUnique({
      where: { userId: session.user.id },
      select: { currentStreak: true, longestStreak: true },
    }),
  ]);

  const dailyBreakdown: Record<string, { lessons: number }> = {};
  for (let d = 0; d < 7; d++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + d);
    const key = day.toISOString().split("T")[0];
    dailyBreakdown[key] = {
      lessons: lessons.filter((l) => l.updatedAt.toISOString().startsWith(key)).length,
    };
  }

  return NextResponse.json({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    summary: {
      lessonsCompleted: lessons.length,
      homeworkCompleted: homework.length,
      testsAttempted: tests.length,
      testsPassed: tests.filter((t) => t.result?.passed).length,
      vocabReviewed: vocab,
      streak: streak?.currentStreak ?? 0,
    },
    dailyBreakdown,
    lessons,
    homework,
    tests,
  });
}
