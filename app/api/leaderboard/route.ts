import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const topUsers = await db.userLessonProgress.groupBy({
    by: ["userId"],
    where: { completedAt: { gte: weekAgo, not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  const userIds = topUsers.map((u) => u.userId);

  const [profiles, streaks] = await Promise.all([
    db.userProfile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, displayName: true },
    }),
    db.learningStreak.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, currentStreak: true },
    }),
  ]);

  const profileMap = Object.fromEntries(profiles.map((p) => [p.userId, p.displayName]));
  const streakMap = Object.fromEntries(streaks.map((s) => [s.userId, s.currentStreak]));

  const board = topUsers.map((u, i) => ({
    rank: i + 1,
    userId: u.userId,
    displayName: profileMap[u.userId] ?? "ผู้เรียน",
    lessonsThisWeek: u._count.id,
    streak: streakMap[u.userId] ?? 0,
    isMe: u.userId === session.user.id,
  }));

  // Current user's rank if not in top 20
  let myRank = null;
  if (!board.find((b) => b.isMe)) {
    const myCount = await db.userLessonProgress.count({
      where: { userId: session.user.id, completedAt: { gte: weekAgo, not: null } },
    });
    const higher = await db.userLessonProgress.groupBy({
      by: ["userId"],
      where: { completedAt: { gte: weekAgo, not: null } },
      _count: { id: true },
      having: { id: { _count: { gt: myCount } } },
    });
    myRank = { rank: higher.length + 1, lessonsThisWeek: myCount };
  }

  return NextResponse.json({ board, myRank });
}
