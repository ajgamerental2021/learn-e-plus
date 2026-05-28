import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { submissionText } = body as { submissionText: string };

  const assignment = await db.homeworkAssignment.findFirst({
    where: { id, userId: session.user.id },
    include: {
      homework: { select: { maxAttempts: true } },
      submissions: { select: { id: true } },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assignment.status === "COMPLETED") return NextResponse.json({ error: "Already completed" }, { status: 400 });

  const maxAttempts = assignment.homework.maxAttempts ?? 3;
  if (assignment.submissions.length >= maxAttempts) {
    return NextResponse.json({ error: "Max attempts reached" }, { status: 400 });
  }

  const attemptNumber = assignment.submissions.length + 1;

  const submission = await db.homeworkSubmission.create({
    data: {
      assignmentId: id,
      attemptNumber,
      submissionData: { text: submissionText },
    },
  });

  await db.homeworkAssignment.update({
    where: { id },
    data: { status: "IN_PROGRESS" },
  });

  return NextResponse.json({ submission, attemptNumber, remaining: maxAttempts - attemptNumber });
}
