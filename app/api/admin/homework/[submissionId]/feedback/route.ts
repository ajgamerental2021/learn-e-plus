import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ submissionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { submissionId } = await params;
  const { feedbackText, score } = await req.json() as { feedbackText: string; score?: number };

  const submission = await db.homeworkSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: { select: { id: true, userId: true, homework: { select: { nameTh: true, maxScore: true } } } } },
  });

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const feedback = await db.homeworkFeedback.upsert({
    where: { submissionId },
    create: { submissionId, feedbackText, score: score ?? null },
    update: { feedbackText, score: score ?? null },
  });

  // Mark assignment as COMPLETED if teacher gives feedback with score
  if (score !== undefined) {
    await db.homeworkAssignment.update({
      where: { id: submission.assignment.id },
      data: { status: "COMPLETED" },
    });

    // Notify student
    await db.notification.create({
      data: {
        userId: submission.assignment.userId,
        type: "HOMEWORK_GRADED",
        titleTh: "การบ้านถูกตรวจแล้ว",
        bodyTh: `${submission.assignment.homework.nameTh} — ${score}/${submission.assignment.homework.maxScore} คะแนน`,
      },
    });
  }

  return NextResponse.json(feedback);
}
