import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [profile, streak, skillScores, lessonCount, vocabStats, recentLessons] = await Promise.all([
    db.userProfile.findUnique({
      where: { userId },
      include: { currentLevel: true },
    }),
    db.learningStreak.findUnique({ where: { userId } }),
    db.skillScore.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    db.userLessonProgress.count({ where: { userId, completedAt: { not: null } } }),
    db.vocabularyProgress.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    }),
    db.userLessonProgress.findMany({
      where: { userId, completedAt: { not: null } },
      include: { lesson: { select: { nameTh: true, nameEn: true } } },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
  ]);

  const SKILL_LABEL: Record<string, string> = {
    VOCABULARY: "คำศัพท์", GRAMMAR: "ไวยากรณ์",
    LISTENING: "การฟัง", READING: "การอ่าน",
    WRITING: "การเขียน", SPEAKING: "การพูด",
  };

  const masteredVocab = vocabStats.find((v) => v.status === "MASTERED")?._count.id ?? 0;
  const totalVocab = vocabStats.reduce((sum, v) => sum + v._count.id, 0);

  // Return JSON data — client will render to PDF
  return NextResponse.json({
    name: profile?.displayName ?? "ผู้เรียน",
    level: profile?.currentLevel?.nameTh ?? "ยังไม่ระบุ",
    generatedAt: new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }),
    stats: {
      lessonsCompleted: lessonCount,
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      masteredVocab,
      totalVocab,
    },
    skills: skillScores.map((s) => ({
      name: SKILL_LABEL[s.skillType] ?? s.skillType,
      score: s.score,
    })),
    recentLessons: recentLessons.map((lp) => ({
      name: lp.lesson.nameTh,
      date: lp.completedAt ? new Date(lp.completedAt).toLocaleDateString("th-TH") : "",
    })),
  });
}
