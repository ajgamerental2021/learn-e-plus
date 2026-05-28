import { db } from "@/lib/db";

export async function checkAndAwardAchievements(userId: string) {
  const [streak, lessonsCount, vocabMastered, testsPassed, existing] = await Promise.all([
    db.learningStreak.findUnique({ where: { userId }, select: { currentStreak: true, longestStreak: true } }),
    db.userLessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.vocabularyProgress.count({ where: { userId, status: "MASTERED" } }),
    db.testResult.count({ where: { userId, passed: true } }),
    db.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);

  const existingIds = new Set(existing.map((e) => e.achievementId));
  const allAchievements = await db.achievement.findMany();
  const awarded: string[] = [];

  for (const ach of allAchievements) {
    if (existingIds.has(ach.id)) continue;

    let earned = false;
    switch (ach.requirementType) {
      case "STREAK_DAYS":
        earned = (streak?.currentStreak ?? 0) >= ach.requirementValue;
        break;
      case "LESSONS_COMPLETED":
        earned = lessonsCount >= ach.requirementValue;
        break;
      case "VOCAB_MASTERED":
        earned = vocabMastered >= ach.requirementValue;
        break;
      case "TESTS_PASSED":
        earned = testsPassed >= ach.requirementValue;
        break;
    }

    if (earned) {
      await db.userAchievement.create({ data: { userId, achievementId: ach.id } });
      await db.notification.create({
        data: {
          userId,
          type: "ACHIEVEMENT_EARNED",
          titleTh: `ได้รับ Badge ใหม่: ${ach.nameTh}`,
          bodyTh: ach.descriptionTh,
        },
      });
      awarded.push(ach.code);
    }
  }

  return awarded;
}
