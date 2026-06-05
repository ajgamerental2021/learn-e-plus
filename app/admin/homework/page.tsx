import { db } from "@/lib/db";
import Link from "next/link";
import { connection } from "next/server";

export default async function AdminHomeworkPage() {
  await connection();

  const [submitted, dailyVocabulary, byStatus] = await Promise.all([
    db.homeworkAssignment.findMany({
      where: { status: "IN_PROGRESS" },
      orderBy: { dueDate: "asc" },
      take: 20,
      include: {
        user: { select: { email: true, profile: { select: { displayName: true } } } },
        homework: { select: { nameTh: true } },
        submissions: {
          orderBy: { submittedAt: "desc" },
          take: 1,
          select: { submittedAt: true, attemptNumber: true },
        },
      },
    }),
    db.dailyVocabularyAssignment.findMany({
      where: { submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        vocabulary: { select: { word: true, translationTh: true } },
      },
    }),
    db.homeworkAssignment.groupBy({ by: ["status"], _count: true }),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
  const withSubs = submitted.filter((a) => a.submissions.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Homework Management</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "LATE"].map((s) => (
          <div key={s} className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{statusMap[s] ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">{s.replace("_", " ")}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Submitted — Awaiting Review</h2>
          <span className="text-xs text-gray-400">{withSubs.length} items</span>
        </div>
        <div className="divide-y">
          {withSubs.map((a) => (
            <div key={a.id} className="px-5 py-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{a.homework.nameTh}</p>
                <p className="text-xs text-gray-400">{a.user.profile?.displayName ?? a.user.email}</p>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(a.submissions[0].submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </div>
          ))}
          {withSubs.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">No submissions awaiting review</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Daily Vocabulary Submissions</h2>
          <span className="text-xs text-gray-400">{dailyVocabulary.length} items</span>
        </div>
        <div className="divide-y">
          {dailyVocabulary.map((item) => (
            <Link
              key={item.id}
              href={`/homework/vocabulary/submissions/${item.user.id}`}
              className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-blue-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {item.user.profile?.displayName ?? item.user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {item.vocabulary.word} · {item.vocabulary.translationTh}
                </p>
              </div>
              <p className="shrink-0 text-xs text-gray-400">
                {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-"}
              </p>
            </Link>
          ))}
          {dailyVocabulary.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">No daily vocabulary submissions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
