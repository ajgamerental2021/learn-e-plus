import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (!["ADMIN", "TEACHER"].includes((session.user as any).role)) redirect("/dashboard");

  const students = await db.user.findMany({
    where: { role: "LEARNER", isActive: true },
    include: {
      profile: {
        include: { currentLevel: { select: { nameTh: true, code: true } } },
      },
      streak: { select: { currentStreak: true, longestStreak: true } },
      _count: {
        select: {
          lessonProgress: true,
          homeworkAssignments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">👨‍🎓 นักเรียนทั้งหมด</h1>
        <span className="text-gray-400 text-sm">{students.length} คน</span>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">ชื่อ</th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">ระดับ</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">บทเรียน</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Streak</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">การบ้าน</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{s.profile?.displayName ?? "—"}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {s.profile?.currentLevel?.nameTh ?? "ยังไม่ระบุ"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
                    {s._count.lessonProgress}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${(s.streak?.currentStreak ?? 0) >= 7 ? "text-orange-500" : "text-gray-600 dark:text-gray-300"}`}>
                      {s.streak?.currentStreak ?? 0} 🔥
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
                    {s._count.homeworkAssignments}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ดูรายละเอียด
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
