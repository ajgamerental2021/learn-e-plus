import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Pick today's challenge word based on date seed
function getTodayChallenge(words: { id: string; word: string; translationTh: string; pronunciationTh: string | null; exampleSentence: string | null; exampleTranslation: string | null }[]) {
  if (words.length === 0) return null;
  const day = Math.floor(Date.now() / 86400000);
  return words[day % words.length];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already completed today
  const existing = await db.dailyGoal.findFirst({
    where: { userId: session.user.id, date: today },
  });

  const words = await db.vocabularyItem.findMany({
    where: { isActive: true },
    select: { id: true, word: true, translationTh: true, pronunciationTh: true, exampleSentence: true, exampleTranslation: true },
    orderBy: { id: "asc" },
  });

  const challenge = getTodayChallenge(words);

  return NextResponse.json({
    challenge,
    completedToday: !!existing?.goalMinutes && existing.goalMinutes >= 5,
    date: today.toISOString().split("T")[0],
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.dailyGoal.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    update: { goalMinutes: 5, actualMinutes: 5 },
    create: { userId: session.user.id, date: today, goalMinutes: 5, actualMinutes: 5 },
  });

  // Update streak
  const streak = await db.learningStreak.findUnique({ where: { userId: session.user.id } });
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const wasYesterday = streak?.lastActiveDate && new Date(streak.lastActiveDate).toDateString() === yesterday.toDateString();
  const isToday = streak?.lastActiveDate && new Date(streak.lastActiveDate).toDateString() === today.toDateString();

  if (!isToday) {
    const newStreak = wasYesterday ? (streak?.currentStreak ?? 0) + 1 : 1;
    await db.learningStreak.upsert({
      where: { userId: session.user.id },
      update: { currentStreak: newStreak, longestStreak: { set: Math.max(newStreak, streak?.longestStreak ?? 0) }, lastActiveDate: today },
      create: { userId: session.user.id, currentStreak: 1, longestStreak: 1, lastActiveDate: today },
    });
  }

  return NextResponse.json({ ok: true });
}
