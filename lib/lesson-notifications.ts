import { db } from "@/lib/db";

export async function notifyLessonCompleted(studentId: string, lessonId: string) {
  const [student, lesson, staff, guardians] = await Promise.all([
    db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        email: true,
        profile: { select: { displayName: true } },
      },
    }),
    db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        nameTh: true,
        unit: {
          select: {
            nameTh: true,
            course: { select: { nameTh: true } },
          },
        },
      },
    }),
    db.user.findMany({
      where: { id: { not: studentId }, role: { in: ["ADMIN", "TEACHER"] }, isActive: true },
      select: { id: true },
    }),
    db.guardianStudent.findMany({
      where: { studentId, guardian: { isActive: true, role: "PARENT" } },
      select: { guardianId: true },
    }),
  ]);

  if (!student || !lesson) return;

  const studentName = student.profile?.displayName ?? student.email;
  const baseData = {
    lessonId: lesson.id,
    lessonName: lesson.nameTh,
    unitName: lesson.unit.nameTh,
    courseName: lesson.unit.course.nameTh,
    studentId,
    studentName,
  };

  const notifications = [
    {
      userId: studentId,
      type: "LESSON_COMPLETED" as const,
      titleTh: "เรียนจบบทแล้ว",
      bodyTh: `คุณเรียนจบบท "${lesson.nameTh}" แล้ว การบ้านของบทนี้ถูกเตรียมไว้ให้ถ้ามี`,
      data: { ...baseData, audience: "student" },
    },
    ...guardians.map((item) => ({
      userId: item.guardianId,
      type: "LESSON_COMPLETED" as const,
      titleTh: `${studentName} เรียนจบบทใหม่`,
      bodyTh: `นักเรียนเรียนจบบท "${lesson.nameTh}" ในหน่วย "${lesson.unit.nameTh}" แล้ว`,
      data: { ...baseData, audience: "parent" },
    })),
    ...staff.map((item) => ({
      userId: item.id,
      type: "LESSON_COMPLETED" as const,
      titleTh: `${studentName} เรียนจบบทใหม่`,
      bodyTh: `จบบท "${lesson.nameTh}" ในคอร์ส "${lesson.unit.course.nameTh}"`,
      data: { ...baseData, audience: "staff" },
    })),
  ];

  await db.notification.createMany({ data: notifications });
}
