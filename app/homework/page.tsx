import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังทำ",
  COMPLETED: "เสร็จแล้ว",
  LATE: "เกินกำหนด",
};

const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  LATE: "bg-red-100 text-red-700",
};

export default async function HomeworkPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { status } = await searchParams;
  const now = new Date();

  await db.homeworkAssignment.updateMany({
    where: {
      userId: session.user.id,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      dueDate: { lt: now },
    },
    data: { status: "LATE" },
  });

  const assignments = await db.homeworkAssignment.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { assignedAt: "desc" }],
    include: {
      homework: {
        select: {
          id: true,
          nameTh: true,
          skillType: true,
          maxScore: true,
          lesson: { select: { nameTh: true } },
        },
      },
    },
  });

  const tabs = [
    { key: "", label: "ทั้งหมด" },
    { key: "NOT_STARTED", label: "ยังไม่เริ่ม" },
    { key: "IN_PROGRESS", label: "กำลังทำ" },
    { key: "COMPLETED", label: "เสร็จ" },
    { key: "LATE", label: "เกินกำหนด" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">การบ้าน</h1>
        <p className="text-sm text-gray-500 mt-1">
          การบ้านจะถูกสร้างให้อัตโนมัติหลังจากเรียนจบบทเรียนที่มีงานฝึก
        </p>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-800">เริ่มยังไง?</p>
        <div className="mt-2 grid gap-2 text-sm text-blue-700 sm:grid-cols-3">
          <div className="rounded-lg bg-white/70 p-3">1. ไปที่เมนูบทเรียน</div>
          <div className="rounded-lg bg-white/70 p-3">2. เรียนให้จบบท</div>
          <div className="rounded-lg bg-white/70 p-3">3. กลับมาทำการบ้านที่นี่</div>
        </div>
        <Link href="/learn" className="mt-3 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          ไปเริ่มบทเรียน
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/homework?status=${t.key}` : "/homework"}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (status ?? "") === t.key
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center">
          <p className="font-medium text-gray-700">ยังไม่มีการบ้าน</p>
          <p className="text-sm text-gray-400 mt-1">เรียนจบบทแรกก่อน แล้วระบบจะเพิ่มการบ้านให้เอง</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const overdue = a.status === "LATE";
            const dueDate = a.dueDate ? new Date(a.dueDate) : null;
            return (
              <Link
                key={a.id}
                href={`/homework/${a.id}`}
                className="block bg-white rounded-xl border p-4 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{a.homework.nameTh}</p>
                    {a.homework.lesson && (
                      <p className="text-xs text-gray-400 mt-0.5">{a.homework.lesson.nameTh}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">{a.homework.skillType}</span>
                      {dueDate && (
                        <span className={`text-xs ${overdue ? "text-red-500" : "text-gray-400"}`}>
                          {overdue ? "เกินกำหนด " : "ครบกำหนด "}
                          {dueDate.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
