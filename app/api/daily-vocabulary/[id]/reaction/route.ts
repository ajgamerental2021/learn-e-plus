import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPushToUsers } from "@/lib/push-notifications";

const schema = z.object({
  emoji: z.enum(["👍", "❤️", "⭐", "👏"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });

  const assignment = await db.dailyVocabularyAssignment.findUnique({
    where: { id },
    include: {
      user: { include: { profile: { select: { displayName: true } }, notificationPrefs: true } },
      vocabulary: { select: { word: true } },
    },
  });
  if (!assignment || !assignment.submittedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (session.user as { role?: string }).role;
  const isStaff = role === "ADMIN" || role === "TEACHER";
  const isOwner = assignment.userId === session.user.id;
  const guardianLink = role === "PARENT"
    ? await db.guardianStudent.findUnique({
        where: { guardianId_studentId: { guardianId: session.user.id, studentId: assignment.userId } },
        select: { id: true },
      })
    : null;
  if (!isStaff && !guardianLink && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reaction = await db.dailyVocabularyReaction.upsert({
    where: { assignmentId_userId: { assignmentId: assignment.id, userId: session.user.id } },
    update: { emoji: parsed.data.emoji },
    create: {
      assignmentId: assignment.id,
      userId: session.user.id,
      emoji: parsed.data.emoji,
    },
  });

  const grouped = await db.dailyVocabularyReaction.groupBy({
    by: ["emoji"],
    where: { assignmentId: assignment.id },
    _count: { emoji: true },
  });
  const counts = grouped.map((item) => ({ emoji: item.emoji, count: item._count.emoji }));

  if (!isOwner && assignment.user.notificationPrefs?.inAppEnabled !== false) {
    const actor = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, profile: { select: { displayName: true } } },
    });
    const actorName = actor?.profile?.displayName ?? actor?.email ?? "มีคน";
    const href = `/homework/vocabulary/submissions/${assignment.userId}`;
    const title = "มีคนถูกใจการบ้านของคุณ";
    const body = `${actorName} ส่ง ${reaction.emoji} ให้การบ้านคำว่า "${assignment.vocabulary.word}"`;

    await db.notification.create({
      data: {
        userId: assignment.userId,
        type: "HOMEWORK_REACTION",
        titleTh: title,
        bodyTh: body,
        data: {
          href,
          assignmentId: assignment.id,
          reactionId: reaction.id,
          emoji: reaction.emoji,
        },
      },
    });
    await sendPushToUsers([assignment.userId], { title, body, href });
  }

  return NextResponse.json({ ok: true, myReaction: reaction.emoji, counts });
}
