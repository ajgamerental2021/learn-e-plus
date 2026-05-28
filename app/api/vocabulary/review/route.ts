import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
  const now = new Date();

  const profile = await db.userProfile.findUnique({
    where: { userId: userId },
    select: { currentLevelId: true },
  });

  // Due for review: nextReviewAt <= now OR not yet started
  const dueProgress = await db.vocabularyProgress.findMany({
    where: {
      userId: userId,
      status: { in: ["NEW", "LEARNING"] },
      OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
    },
    take: limit,
    orderBy: [{ nextReviewAt: "asc" }, { updatedAt: "asc" }],
    include: {
      vocabulary: {
        include: { level: { select: { code: true } } },
      },
    },
  });

  // If not enough due, top up with unseen vocab from current level
  const seenIds = dueProgress.map((p) => p.vocabularyId);
  const needed = limit - dueProgress.length;

  let unseenVocab: typeof dueProgress = [];
  if (needed > 0 && profile?.currentLevelId) {
    const unseen = await db.vocabularyItem.findMany({
      where: {
        isActive: true,
        levelId: profile.currentLevelId,
        id: { notIn: seenIds },
      },
      take: needed,
      include: { level: { select: { code: true } } },
    });
    // Create NEW progress records and fake the shape
    unseenVocab = unseen.map((v) => ({
      id: `unseen-${v.id}`,
      userId: userId,
      vocabularyId: v.id,
      status: "NEW" as const,
      correctCount: 0,
      incorrectCount: 0,
      nextReviewAt: null,
      updatedAt: new Date(),
      vocabulary: v,
    }));
  }

  const cards = [...dueProgress, ...unseenVocab];
  return NextResponse.json({ cards, total: cards.length });
}
