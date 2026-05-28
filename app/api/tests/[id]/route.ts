import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const test = await db.test.findUnique({
    where: { id, isActive: true },
    include: {
      sections: {
        orderBy: { orderNum: "asc" },
        include: {
          questions: {
            include: {
              question: {
                select: {
                  id: true,
                  questionType: true,
                  questionData: true,
                  points: true,
                  audioUrl: true,
                  imageUrl: true,
                  // correctAnswer excluded — sent only after attempt
                },
              },
            },
            orderBy: { orderNum: "asc" },
          },
        },
      },
      attempts: {
        where: { userId: session.user.id },
        orderBy: { startedAt: "desc" },
        take: 1,
        include: { result: true },
      },
    },
  });

  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attemptCount = await db.testAttempt.count({
    where: { testId: id, userId: session.user.id, status: "completed" },
  });

  return NextResponse.json({
    ...test,
    attemptsUsed: attemptCount,
    canAttempt: attemptCount < test.maxAttempts,
  });
}
