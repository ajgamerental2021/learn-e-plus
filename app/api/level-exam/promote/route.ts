import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { attemptId, passed, totalScore, skillScores } = await req.json() as {
    attemptId: string;
    passed: boolean;
    totalScore: number;
    skillScores: Record<string, number>;
  };

  const profile = await db.userProfile.findUnique({
    where: { userId },
    include: {
      currentLevel: { select: { id: true, code: true, orderNum: true } },
    },
  });

  if (!profile?.currentLevelId || !profile.currentLevel) {
    return NextResponse.json({ error: "No current level" }, { status: 400 });
  }

  // Record exam result
  const examResult = await db.levelExamResult.create({
    data: {
      userId,
      levelId: profile.currentLevelId,
      attemptId,
      fromLevel: profile.currentLevel.code,
      toLevel: null,
      passed,
      totalScore,
      skillScores,
    },
  });

  if (!passed) {
    return NextResponse.json({ promoted: false, examResult });
  }

  // Find next level
  const nextLevel = await db.level.findFirst({
    where: { orderNum: profile.currentLevel.orderNum + 1, isActive: true },
  });

  if (!nextLevel) {
    return NextResponse.json({ promoted: false, reason: "อยู่ระดับสูงสุดแล้ว", examResult });
  }

  // Update exam result with toLevel
  await db.levelExamResult.update({
    where: { id: examResult.id },
    data: { toLevel: nextLevel.code },
  });

  // Promote user
  await db.userProfile.update({
    where: { userId },
    data: { currentLevelId: nextLevel.id },
  });

  // Create promotion notification
  await db.notification.create({
    data: {
      userId,
      type: "LEVEL_UP",
      titleTh: "เลื่อนระดับแล้ว! 🎉",
      bodyTh: `ยินดีด้วย! คุณผ่านการสอบและเลื่อนระดับเป็น ${nextLevel.nameTh}`,
    },
  });

  // Award achievement if available
  const levelAchievement = await db.achievement.findFirst({
    where: { code: `LEVEL_${nextLevel.code}` },
  });
  if (levelAchievement) {
    await db.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: levelAchievement.id } },
      create: { userId, achievementId: levelAchievement.id },
      update: {},
    });
  }

  return NextResponse.json({
    promoted: true,
    fromLevel: profile.currentLevel.code,
    toLevel: nextLevel.code,
    toLevelName: nextLevel.nameTh,
    examResult,
  });
}
