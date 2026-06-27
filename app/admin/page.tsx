import { db } from "@/lib/db";
import Link from "next/link";
import { connection } from "next/server";

export default async function AdminDashboard() {
  await connection();

  const [users, lessons, vocab, homeworkPending, testsToday] = await Promise.all([
    db.user.count(),
    db.lesson.count({ where: { isPublished: true } }),
    db.vocabularyItem.count({ where: { isActive: true } }),
    db.homeworkAssignment.count({ where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } } }),
    db.testAttempt.count({
      where: { startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
  ]);

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      email: true,
      createdAt: true,
      role: true,
      profile: { select: { displayName: true } },
    },
  });

  const stats = [
    { label: "Total Users", value: users, icon: "👥", href: "/admin/users" },
    { label: "Active Lessons", value: lessons, icon: "📚", href: "/admin/content" },
    { label: "Vocabulary Items", value: vocab, icon: "🔤", href: "/admin/content" },
    { label: "Pending Homework", value: homeworkPending, icon: "📝", href: "/admin/homework" },
    { label: "Tests Today", value: testsToday, icon: "📋", href: "/admin/reports" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border p-4 hover:border-blue-200 transition-colors">
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Recent Users</h2>
          <Link href="/admin/users" className="text-sm text-blue-500 hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{u.profile?.displayName ?? u.email}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{u.role}</span>
                <span className="text-xs text-gray-400">
                  {u.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
