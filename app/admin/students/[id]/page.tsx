import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (!["ADMIN", "TEACHER"].includes((session.user as any).role)) redirect("/dashboard");

  const student = await db.user.findUnique({
    where: { id },
    include: {
      profile: { include: { currentLevel: true } },
      streak: true,
      skillScores: { orderBy: { updatedAt: "desc" } },
      lessonProgress: {
        where: { completedAt: { not: null } },
        include: { lesson: { select: { nameTh: true } } },
        orderBy: { completedAt: "desc" },
        take: 10,
      },
      homeworkAssignments: {
        include: {
          submissions: { include: { feedback: true } },
          homework: { select: { nameTh: true } },
        },
        orderBy: { assignedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) notFound();

  const SKILL_LABEL: Record<string, string> = {
    VOCABULARY: "คำศัพท์", GRAMMAR: "ไวยากรณ์",
    LISTENING: "การฟัง", READING: "การอ่าน",
    WRITING: "การเขียน", SPEAKING: "การพูด",
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/students" className="text-gray-400 hover:text-white text-sm">← กลับ</Link>
        <h1 className="text-xl font-bold text-white">{student.profile?.displayName ?? student.email}</h1>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "ระดับ", value: student.profile?.currentLevel?.nameTh ?? "—" },
          { label: "Streak", value: `${student.streak?.currentStreak ?? 0} วัน 🔥` },
          { label: "บทเรียน", value: student.lessonProgress.length },
          { label: "Streak สูงสุด", value: `${student.streak?.longestStreak ?? 0} วัน` },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className="font-bold text-gray-800 dark:text-gray-100 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Skill scores */}
      {student.skillScores.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200">ทักษะ</h2>
          {student.skillScores.map((s) => (
            <div key={s.id}>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{SKILL_LABEL[s.skillType] ?? s.skillType}</span>
                <span>{s.score}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <div
                  className={`h-2 rounded-full ${s.score >= 70 ? "bg-green-500" : s.score >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                  style={{ width: `${s.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent lessons */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 space-y-2">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">บทเรียนล่าสุด</h2>
        {student.lessonProgress.length === 0 ? (
          <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>
        ) : (
          student.lessonProgress.map((lp) => (
            <div key={lp.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-200">{lp.lesson.nameTh}</span>
              <span className="text-gray-400 text-xs">
                {lp.completedAt ? new Date(lp.completedAt).toLocaleDateString("th-TH") : "—"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Homework */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 space-y-2">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">การบ้าน</h2>
        {student.homeworkAssignments.length === 0 ? (
          <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>
        ) : (
          student.homeworkAssignments.map((hw) => (
            <div key={hw.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-200">{hw.homework.nameTh}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                hw.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                hw.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-500"
              }`}>
                {hw.status === "COMPLETED" ? "เสร็จ" : hw.status === "SUBMITTED" ? "รอตรวจ" : "กำลังทำ"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
