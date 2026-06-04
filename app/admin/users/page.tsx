import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserManager from "@/components/admin/UserManager";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { page, q } = await searchParams;
  const pageNum = parseInt(page ?? "1");
  const PAGE_SIZE = 20;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { username: { contains: q.toLowerCase(), mode: "insensitive" as const } },
          { profile: { displayName: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        profile: { select: { displayName: true, onboardingDone: true } },
        streak: { select: { currentStreak: true } },
        guardianStudents: { select: { studentId: true } },
        _count: {
          select: {
            lessonProgress: true,
            homeworkAssignments: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const learners = await db.user.findMany({
    where: { role: "LEARNER", isActive: true },
    orderBy: [{ profile: { displayName: "asc" } }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      username: true,
      profile: { select: { displayName: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">จัดการ Users ({total})</h1>
        <p className="mt-1 text-sm text-gray-500">เพิ่ม แก้ไข ปิดใช้งาน และเปลี่ยนประเภท Member ของผู้ใช้ทั้งระบบ</p>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="ค้นหา email, username หรือชื่อ..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">ค้นหา</button>
      </form>

      <UserManager
        users={users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }))}
        learnerOptions={learners}
        canManage={session.user.role === "ADMIN"}
      />

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/users?page=${p}${q ? `&q=${q}` : ""}`}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${p === pageNum ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
