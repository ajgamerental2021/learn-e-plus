import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monthsBack = parseInt(req.nextUrl.searchParams.get("month") ?? "0");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

  const [lessons, homework, tests, vocab, skillScores] = await Promise.all([
    db.userLessonProgress.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        updatedAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    db.homeworkAssignment.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        updatedAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    db.testAttempt.findMany({
      where: {
        userId: session.user.id,
        startedAt: { gte: monthStart, lt: monthEnd },
      },
      include: { result: { select: { passed: true, totalScore: true } } },
    }),
    db.vocabularyProgress.count({
      where: {
        userId: session.user.id,
        updatedAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    db.skillScore.findMany({ where: { userId: session.user.id } }),
  ]);

  const testsPassed = tests.filter((t) => t.result?.passed).length;

  return NextResponse.json({
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    summary: {
      lessonsCompleted: lessons,
      homeworkCompleted: homework,
      testsAttempted: tests.length,
      testsPassed,
      vocabReviewed: vocab,
    },
    skillScores,
  });
}
