import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const levelId = req.nextUrl.searchParams.get("levelId");
  const category = req.nextUrl.searchParams.get("category");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { currentLevelId: true },
  });

  const vocab = await db.vocabularyItem.findMany({
    where: {
      isActive: true,
      ...(levelId ? { levelId } : { levelId: profile?.currentLevelId ?? undefined }),
      ...(category ? { category } : {}),
    },
    take: limit,
    orderBy: { word: "asc" },
    include: {
      progress: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
  });

  const stats = {
    total: vocab.length,
    new: vocab.filter((v) => !v.progress[0] || v.progress[0].status === "NEW").length,
    learning: vocab.filter((v) => v.progress[0]?.status === "LEARNING").length,
    mastered: vocab.filter((v) => v.progress[0]?.status === "MASTERED").length,
  };

  return NextResponse.json({ vocab, stats });
}
