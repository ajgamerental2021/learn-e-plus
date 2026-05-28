import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import LearnerNav from "@/components/layout/LearnerNav";
import Link from "next/link";
import { checkAndAwardAchievements } from "@/lib/achievements";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  await checkAndAwardAchievements(session.user.id);

  const [earned, all] = await Promise.all([
    db.userAchievement.findMany({
      where: { userId: session.user.id },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    db.achievement.findMany({ orderBy: { requirementValue: "asc" } }),
  ]);

  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const locked = all.filter((a) => !earnedIds.has(a.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <LearnerNav />
      <main className="pb-20 md:pb-0 md:pl-56">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
            <h1 className="text-xl font-bold text-gray-800">Badges & Achievements</h1>
          </div>

          <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
            <p className="text-3xl font-bold text-gray-800">{earned.length}</p>
            <div>
              <p className="text-sm font-medium text-gray-700">Badges ที่ได้รับ</p>
              <p className="text-xs text-gray-400">จาก {all.length} ทั้งหมด</p>
            </div>
            <div className="ml-auto">
              <div className="h-2 bg-gray-100 rounded-full w-24 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${all.length > 0 ? Math.round((earned.length / all.length) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {earned.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">ได้รับแล้ว</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {earned.map((e) => (
                  <div key={e.id} className="bg-white rounded-xl border p-4 text-center">
                    <p className="text-3xl mb-2">{e.achievement.iconUrl ?? "🏆"}</p>
                    <p className="text-sm font-semibold text-gray-800">{e.achievement.nameTh}</p>
                    <p className="text-xs text-gray-400 mt-1">{e.achievement.descriptionTh}</p>
                    <p className="text-xs text-gray-300 mt-2">
                      {new Date(e.earnedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {locked.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">ยังไม่ได้รับ</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {locked.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-dashed p-4 text-center opacity-50">
                    <p className="text-3xl mb-2 grayscale">{a.iconUrl ?? "🔒"}</p>
                    <p className="text-sm font-semibold text-gray-700">{a.nameTh}</p>
                    <p className="text-xs text-gray-400 mt-1">{a.descriptionTh}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
