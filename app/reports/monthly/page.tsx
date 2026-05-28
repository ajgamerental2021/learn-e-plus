import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MonthlyReportPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { month } = await searchParams;
  const monthsBack = parseInt(month ?? "0");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

  const [lessons, homeworkDone, tests, vocab, skillScores] = await Promise.all([
    db.userLessonProgress.count({
      where: { userId: session.user.id, status: "COMPLETED", updatedAt: { gte: monthStart, lt: monthEnd } },
    }),
    db.homeworkAssignment.count({
      where: { userId: session.user.id, status: "COMPLETED", updatedAt: { gte: monthStart, lt: monthEnd } },
    }),
    db.testAttempt.findMany({
      where: { userId: session.user.id, startedAt: { gte: monthStart, lt: monthEnd } },
      include: { result: { select: { passed: true, totalScore: true } } },
    }),
    db.vocabularyProgress.count({
      where: { userId: session.user.id, updatedAt: { gte: monthStart, lt: monthEnd } },
    }),
    db.skillScore.findMany({ where: { userId: session.user.id } }),
  ]);

  const testsPassed = tests.filter((t) => t.result?.passed).length;
  const monthLabel = monthStart.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  const skillLabels: Record<string, string> = {
    GRAMMAR: "Grammar",
    VOCABULARY: "Vocabulary",
    READING: "Reading",
    LISTENING: "Listening",
    SPEAKING: "Speaking",
    WRITING: "Writing",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">รายงานรายเดือน</h1>
          <p className="text-sm text-gray-400">{monthLabel}</p>
        </div>
        <div className="flex gap-2">
          {monthsBack > 0 && (
            <Link href={`/reports/monthly?month=${monthsBack - 1}`} className="px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              →
            </Link>
          )}
          <Link href={`/reports/monthly?month=${monthsBack + 1}`} className="px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            ←
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "บทเรียนที่เรียน", value: lessons, icon: "📚" },
          { label: "การบ้านที่ส่ง", value: homeworkDone, icon: "📝" },
          { label: "ข้อสอบที่ทำ", value: tests.length, icon: "📋" },
          { label: "ผ่านการสอบ", value: testsPassed, icon: "✅" },
          { label: "คำศัพท์ที่ทบทวน", value: vocab, icon: "🔤" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {skillScores.length > 0 && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">ทักษะ</h2>
          {skillScores.map((s) => (
            <div key={s.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{skillLabels[s.skillType] ?? s.skillType}</span>
                <span className="text-gray-500">{s.score}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.score >= 70 ? "bg-green-500" : s.score >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                  style={{ width: `${Math.min(100, s.score)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/reports/weekly" className="flex-1 py-2.5 border rounded-xl text-sm text-center text-gray-600 hover:bg-gray-50">
          ดูรายงานรายสัปดาห์
        </Link>
        <Link href="/dashboard" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm text-center">
          กลับ Dashboard
        </Link>
      </div>
    </div>
  );
}
