import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [profile, streak, skillScores, lessonsDone, homeworkPending, notifications] = await Promise.all([
    db.userProfile.findUnique({
      where: { userId },
      include: {
        currentLevel: { select: { code: true, nameTh: true } },
      },
    }),
    db.learningStreak.findUnique({ where: { userId } }),
    db.skillScore.findMany({ where: { userId } }),
    db.userLessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.homeworkAssignment.count({
      where: {
        userId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        dueDate: { lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      },
    }),
    db.notification.count({ where: { userId, isRead: false } }),
  ]);

  // Get current course
  const currentCourse = profile?.currentLevelId
    ? await db.course.findFirst({
        where: { levelId: profile.currentLevelId, isPublished: true },
        orderBy: { orderNum: "asc" },
        include: {
          units: {
            where: { isPublished: true },
            orderBy: { orderNum: "asc" },
            take: 1,
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { orderNum: "asc" },
                take: 5,
                include: {
                  progress: { where: { userId }, take: 1 },
                },
              },
            },
          },
        },
      })
    : null;

  // Find next incomplete lesson
  let nextLesson = null;
  if (currentCourse) {
    for (const unit of currentCourse.units) {
      for (const lesson of unit.lessons) {
        if (lesson.progress[0]?.status !== "COMPLETED") {
          nextLesson = { id: lesson.id, nameTh: lesson.nameTh, courseId: currentCourse.id };
          break;
        }
      }
      if (nextLesson) break;
    }
  }

  return NextResponse.json({
    profile,
    streak,
    skillScores,
    lessonsDone,
    homeworkPending,
    unreadNotifications: notifications,
    nextLesson,
    currentCourse: currentCourse
      ? { id: currentCourse.id, nameTh: currentCourse.nameTh }
      : null,
  });
}
