import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkAndAwardAchievements } from "@/lib/achievements";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check for newly earned achievements each time user views
  await checkAndAwardAchievements(session.user.id);

  const [earned, all] = await Promise.all([
    db.userAchievement.findMany({
      where: { userId: session.user.id },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    db.achievement.findMany({ orderBy: { requirementValue: "asc" } }),
  ]);

  const earnedIds = new Set(earned.map((e) => e.achievementId));

  return NextResponse.json({
    earned: earned.map((e) => ({ ...e.achievement, earnedAt: e.earnedAt })),
    locked: all.filter((a) => !earnedIds.has(a.id)),
  });
}
