import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const profile = await db.userProfile.findUnique({
    where: { userId },
    include: { currentLevel: { select: { id: true, code: true, nameTh: true, orderNum: true } } },
  });

  if (!profile?.currentLevelId) {
    return NextResponse.json({ eligible: false, reason: "ยังไม่มีระดับปัจจุบัน" });
  }

  const setting = await db.levelExamSetting.findUnique({
    where: { levelId: profile.currentLevelId },
  });

  if (!setting) {
    return NextResponse.json({ eligible: false, reason: "ไม่มีการตั้งค่าสอบเลื่อนระดับ" });
  }

  // Check last attempt cooldown
  const lastExam = await db.levelExamResult.findFirst({
    where: { userId, levelId: profile.currentLevelId },
    orderBy: { createdAt: "desc" },
  });

  if (lastExam && !lastExam.passed) {
    const cooldownEnd = new Date(lastExam.createdAt);
    cooldownEnd.setDate(cooldownEnd.getDate() + setting.retakeAfterDays);
    if (new Date() < cooldownEnd) {
      return NextResponse.json({
        eligible: false,
        reason: `ต้องรออีก ${Math.ceil((cooldownEnd.getTime() - Date.now()) / 86400000)} วัน`,
        cooldownEnd: cooldownEnd.toISOString(),
      });
    }
  }

  // Check course completion
  const courses = await db.course.findMany({
    where: { levelId: profile.currentLevelId },
    include: {
      units: {
        include: {
          lessons: {
            select: {
              id: true,
              progress: { where: { userId }, select: { status: true } },
            },
          },
        },
      },
    },
  });

  let totalLessons = 0;
  let completedLessons = 0;
  for (const course of courses) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        totalLessons++;
        if (lesson.progress[0]?.status === "COMPLETED") completedLessons++;
      }
    }
  }

  const coursePct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const courseOk = coursePct >= setting.minCourseCompletionPct;

  // Check homework submission
  const [totalHw, submittedHw] = await Promise.all([
    db.homeworkAssignment.count({ where: { userId, homework: { lesson: { unit: { course: { levelId: profile.currentLevelId } } } } } }),
    db.homeworkAssignment.count({
      where: { userId, status: { in: ["COMPLETED", "IN_PROGRESS"] }, homework: { lesson: { unit: { course: { levelId: profile.currentLevelId } } } } },
    }),
  ]);
  const hwPct = totalHw > 0 ? Math.round((submittedHw / totalHw) * 100) : 100;
  const hwOk = hwPct >= setting.minHomeworkSubmitPct;

  // Check skill scores
  const skillScores = await db.skillScore.findMany({ where: { userId } });
  const skillOk = skillScores.length === 0 || skillScores.every((s) => s.score >= setting.minSkillScore);

  const checks = [
    { label: "บทเรียน", value: coursePct, required: setting.minCourseCompletionPct, ok: courseOk, unit: "%" },
    { label: "การบ้าน", value: hwPct, required: setting.minHomeworkSubmitPct, ok: hwOk, unit: "%" },
    { label: "ทักษะ", value: skillScores.length > 0 ? Math.min(...skillScores.map((s) => s.score)) : 0, required: setting.minSkillScore, ok: skillOk, unit: "%" },
  ];

  const eligible = courseOk && hwOk && skillOk;

  return NextResponse.json({
    eligible,
    currentLevel: profile.currentLevel,
    checks,
    setting: { minLevelExamScore: setting.minLevelExamScore },
    alreadyPassed: lastExam?.passed ?? false,
  });
}
