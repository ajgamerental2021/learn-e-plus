import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skillScores = await db.skillScore.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const lessonStats = await db.userLessonProgress.aggregate({
    where: { userId: session.user.id, status: "COMPLETED" },
    _count: true,
  });

  const streak = await db.learningStreak.findUnique({
    where: { userId: session.user.id },
    select: { currentStreak: true, longestStreak: true },
  });

  const vocabStats = await db.vocabularyProgress.groupBy({
    by: ["status"],
    where: { userId: session.user.id },
    _count: true,
  });

  const homeworkStats = await db.homeworkAssignment.groupBy({
    by: ["status"],
    where: { userId: session.user.id },
    _count: true,
  });

  const testResults = await db.testResult.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      passed: true,
      totalScore: true,
      createdAt: true,
      attempt: { select: { test: { select: { nameTh: true, type: true } } } },
    },
  });

  return NextResponse.json({
    skillScores,
    lessonsCompleted: lessonStats._count,
    streak: streak ?? { currentStreak: 0, longestStreak: 0 },
    vocabStats: Object.fromEntries(vocabStats.map((v) => [v.status, v._count])),
    homeworkStats: Object.fromEntries(homeworkStats.map((h) => [h.status, h._count])),
    recentTests: testResults,
  });
}
