import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExportPdfButton from "@/components/reports/ExportPdfButton";

export default async function WeeklyReportPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { week } = await searchParams;
  const weeksBack = parseInt(week ?? "0");

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() - weeksBack * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [lessons, homeworkDone, tests, vocab, streak] = await Promise.all([
    db.userLessonProgress.count({
      where: { userId: session.user.id, status: "COMPLETED", updatedAt: { gte: weekStart, lt: weekEnd } },
    }),
    db.homeworkAssignment.count({
      where: { userId: session.user.id, status: "COMPLETED", updatedAt: { gte: weekStart, lt: weekEnd } },
    }),
    db.testAttempt.findMany({
      where: { userId: session.user.id, startedAt: { gte: weekStart, lt: weekEnd } },
      include: {
        test: { select: { nameTh: true } },
        result: { select: { passed: true, totalScore: true } },
      },
    }),
    db.vocabularyProgress.count({
      where: { userId: session.user.id, updatedAt: { gte: weekStart, lt: weekEnd } },
    }),
    db.learningStreak.findUnique({
      where: { userId: session.user.id },
      select: { currentStreak: true, longestStreak: true },
    }),
  ]);

  const testsPassed = tests.filter((t) => t.result?.passed).length;

  const weekLabel = weeksBack === 0 ? "สัปดาห์นี้" : weeksBack === 1 ? "สัปดาห์ที่แล้ว" : `${weeksBack} สัปดาห์ก่อน`;
  const dateLabel = `${weekStart.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`;

  const stats = [
    { label: "บทเรียนที่เรียน", value: lessons, icon: "📚" },
    { label: "การบ้านที่ส่ง", value: homeworkDone, icon: "📝" },
    { label: "ข้อสอบที่ทำ", value: tests.length, icon: "📋" },
    { label: "ผ่านการสอบ", value: testsPassed, icon: "✅" },
    { label: "คำศัพท์ที่ทบทวน", value: vocab, icon: "🔤" },
    { label: "Streak", value: streak?.currentStreak ?? 0, icon: "🔥", unit: " วัน" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">รายงานรายสัปดาห์</h1>
          <p className="text-sm text-gray-400">{weekLabel} · {dateLabel}</p>
        </div>
        <div className="flex gap-2">
          <ExportPdfButton />
          {weeksBack > 0 && (
            <Link href={`/reports/weekly?week=${weeksBack - 1}`} className="px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              →
            </Link>
          )}
          <Link href={`/reports/weekly?week=${weeksBack + 1}`} className="px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            ←
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value}{s.unit ?? ""}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {tests.length > 0 && (
        <div className="bg-white rounded-xl border p-4 space-y-2">
          <h2 className="font-semibold text-gray-700">ผลการสอบ</h2>
          {tests.map((t, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <span className="text-gray-700">{t.test?.nameTh ?? "–"}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.result?.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {t.result?.passed ? "ผ่าน" : "ไม่ผ่าน"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/reports/monthly" className="flex-1 py-2.5 border rounded-xl text-sm text-center text-gray-600 hover:bg-gray-50">
          ดูรายงานรายเดือน
        </Link>
        <Link href="/dashboard" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm text-center">
          กลับ Dashboard
        </Link>
      </div>
    </div>
  );
}
