import { db } from "@/lib/db";

export default async function AdminReportsPage() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dau, wau, mau, lessonsToday, testsToday, homeworkDone, newUsers] = await Promise.all([
    // DAU — users who completed at least 1 lesson today
    db.userLessonProgress.groupBy({
      by: ["userId"],
      where: { status: "COMPLETED", updatedAt: { gte: todayStart } },
      _count: true,
    }),
    db.userLessonProgress.groupBy({
      by: ["userId"],
      where: { status: "COMPLETED", updatedAt: { gte: weekStart } },
      _count: true,
    }),
    db.userLessonProgress.groupBy({
      by: ["userId"],
      where: { status: "COMPLETED", updatedAt: { gte: monthStart } },
      _count: true,
    }),
    db.userLessonProgress.count({ where: { status: "COMPLETED", updatedAt: { gte: todayStart } } }),
    db.testAttempt.count({ where: { startedAt: { gte: todayStart } } }),
    db.homeworkAssignment.count({ where: { status: "COMPLETED", updatedAt: { gte: todayStart } } }),
    db.user.count({ where: { createdAt: { gte: weekStart } } }),
  ]);

  const metrics = [
    { label: "DAU (lessons)", value: dau.length, icon: "📅" },
    { label: "WAU", value: wau.length, icon: "📆" },
    { label: "MAU", value: mau.length, icon: "🗓️" },
    { label: "Lessons Today", value: lessonsToday, icon: "📚" },
    { label: "Tests Today", value: testsToday, icon: "📋" },
    { label: "Homework Done Today", value: homeworkDone, icon: "✅" },
    { label: "New Users (7d)", value: newUsers, icon: "🆕" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">Platform Reports</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl mb-1">{m.icon}</p>
            <p className="text-2xl font-bold text-gray-800">{m.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
