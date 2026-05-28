import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";

export default async function VocabularyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { currentLevelId: true },
  });

  const [total, mastered, learning, dueNow] = await Promise.all([
    db.vocabularyItem.count({
      where: { isActive: true, ...(profile?.currentLevelId ? { levelId: profile.currentLevelId } : {}) },
    }),
    db.vocabularyProgress.count({ where: { userId: session.user.id, status: "MASTERED" } }),
    db.vocabularyProgress.count({ where: { userId: session.user.id, status: "LEARNING" } }),
    db.vocabularyProgress.count({
      where: {
        userId: session.user.id,
        status: { in: ["NEW", "LEARNING"] },
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: new Date() } }],
      },
    }),
  ]);

  const categories = await db.vocabularyItem.groupBy({
    by: ["category"],
    where: { isActive: true, ...(profile?.currentLevelId ? { levelId: profile.currentLevelId } : {}) },
    _count: true,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">คำศัพท์</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "ทั้งหมด", value: total, color: "bg-gray-50 border-gray-100" },
          { label: "ถึงกำหนดทบทวน", value: dueNow, color: dueNow > 0 ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100" },
          { label: "กำลังเรียน", value: learning, color: "bg-blue-50 border-blue-100" },
          { label: "จำได้แล้ว", value: mastered, color: "bg-green-50 border-green-100" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Review CTA */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-700 mb-1">ทบทวนวันนี้</h2>
        <p className="text-sm text-gray-400 mb-4">
          {dueNow > 0 ? `มี ${dueNow} คำที่ถึงกำหนดทบทวน` : "ไม่มีคำที่ต้องทบทวนตอนนี้"}
        </p>
        <LinkButton href="/vocabulary/review" className="w-full justify-center">
          {dueNow > 0 ? `เริ่มทบทวน ${dueNow} คำ` : "ทบทวนคำศัพท์ใหม่"}
        </LinkButton>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-3">หมวดหมู่คำศัพท์</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.category ?? "other"}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
              >
                {c.category ?? "ทั่วไป"} ({c._count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
