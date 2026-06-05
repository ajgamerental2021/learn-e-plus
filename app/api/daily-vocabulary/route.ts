import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateDailyVocabulary } from "@/lib/daily-vocabulary";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = await getOrCreateDailyVocabulary(session.user.id);
  const history = await db.dailyVocabularyAssignment.findMany({
    where: { userId: session.user.id, submittedAt: { not: null } },
    orderBy: { assignedDate: "desc" },
    take: 120,
    include: {
      vocabulary: {
        select: {
          id: true,
          word: true,
          translationTh: true,
          pronunciationTh: true,
          exampleSentence: true,
          exampleTranslation: true,
          cefrLevel: true,
        },
      },
    },
  });

  return NextResponse.json({ today, history });
}
