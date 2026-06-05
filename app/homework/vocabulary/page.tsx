import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateDailyVocabulary } from "@/lib/daily-vocabulary";
import { redirect } from "next/navigation";
import Link from "next/link";
import DailyVocabularyPractice from "@/components/homework/DailyVocabularyPractice";

export default async function DailyVocabularyHomeworkPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <Link href="/homework" className="text-sm text-gray-400 hover:text-gray-700">← กลับการบ้าน</Link>
      <DailyVocabularyPractice key={`${today?.id ?? "empty"}-${today?.status ?? "none"}-${history.length}`} today={today as never} history={history as never} />
    </div>
  );
}
