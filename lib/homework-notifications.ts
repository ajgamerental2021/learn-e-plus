import { db } from "@/lib/db";

type HomeworkNotificationInput = {
  studentId: string;
  titleTh?: string;
  bodyTh: string;
  href: string;
  data?: Record<string, unknown>;
};

export async function notifyHomeworkSubmitted({
  studentId,
  titleTh = "มีการส่งการบ้านใหม่",
  bodyTh,
  href,
  data,
}: HomeworkNotificationInput) {
  const [staff, guardians] = await Promise.all([
    db.user.findMany({
      where: {
        id: { not: studentId },
        role: { in: ["ADMIN", "TEACHER"] },
        isActive: true,
        OR: [
          { notificationPrefs: { is: null } },
          { notificationPrefs: { is: { inAppEnabled: true } } },
        ],
      },
      select: { id: true },
    }),
    db.guardianStudent.findMany({
      where: {
        studentId,
        guardian: {
          isActive: true,
          role: "PARENT",
          OR: [
            { notificationPrefs: { is: null } },
            { notificationPrefs: { is: { inAppEnabled: true } } },
          ],
        },
      },
      select: { guardianId: true },
    }),
  ]);

  const recipientIds = Array.from(new Set([
    ...staff.map((user) => user.id),
    ...guardians.map((link) => link.guardianId),
  ])).filter((userId) => userId !== studentId);

  if (recipientIds.length === 0) return;

  await db.notification.createMany({
    data: recipientIds.map((userId) => ({
      userId,
      type: "HOMEWORK_DUE_TODAY",
      titleTh,
      bodyTh,
      data: {
        href,
        studentId,
        ...data,
      },
    })),
  });
}
