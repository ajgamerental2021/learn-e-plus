import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeNextReview } from "@/lib/spaced-repetition";

const schema = z.object({ wasCorrect: z.boolean() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: vocabularyId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { wasCorrect } = parsed.data;

  const existing = await db.vocabularyProgress.findUnique({
    where: { userId_vocabularyId: { userId: session.user.id, vocabularyId } },
  });

  const correctCount = existing?.correctCount ?? 0;
  const incorrectCount = existing?.incorrectCount ?? 0;
  const { nextReviewAt, status } = computeNextReview(correctCount, incorrectCount, wasCorrect);

  await db.vocabularyProgress.upsert({
    where: { userId_vocabularyId: { userId: session.user.id, vocabularyId } },
    update: {
      status,
      correctCount: wasCorrect ? correctCount + 1 : correctCount,
      incorrectCount: wasCorrect ? incorrectCount : incorrectCount + 1,
      nextReviewAt,
    },
    create: {
      userId: session.user.id,
      vocabularyId,
      status,
      correctCount: wasCorrect ? 1 : 0,
      incorrectCount: wasCorrect ? 0 : 1,
      nextReviewAt,
    },
  });

  return NextResponse.json({ status, nextReviewAt });
}
