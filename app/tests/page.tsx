import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { currentLevelId: true },
  });

  const tests = await db.test.findMany({
    where: {
      isActive: true,
      ...(profile?.currentLevelId ? { levelId: profile.currentLevelId } : {}),
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    include: {
      level: { select: { code: true, nameTh: true } },
      _count: { select: { sections: true } },
    },
  });

  const attempts = await db.testAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    select: { testId: true, result: { select: { passed: true, totalScore: true } } },
  });

  const bestByTest = attempts.reduce<Record<string, { passed: boolean; totalScore: number }>>((acc, a) => {
    if (!a.result) return acc;
    const existing = acc[a.testId];
    if (!existing || a.result.totalScore > existing.totalScore) {
      acc[a.testId] = a.result;
    }
    return acc;
  }, {});

  const unitTests = tests.filter((t) => t.type === "UNIT_TEST");
  const otherTests = tests.filter((t) => t.type !== "UNIT_TEST");

  function TestCard({ t }: { t: typeof tests[0] }) {
    const best = bestByTest[t.id];
    return (
      <Link
        href={`/tests/${t.id}`}
        className="block bg-white rounded-xl border p-4 hover:border-blue-200 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-800">{t.nameTh}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.level?.nameTh} · {t._count.sections} sections</p>
            {t.durationMins && (
              <p className="text-xs text-gray-400 mt-0.5">เวลา {t.durationMins} นาที</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            {best ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${best.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {best.passed ? "ผ่าน" : "ไม่ผ่าน"}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">ยังไม่ทำ</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">แบบทดสอบ</h1>

      {unitTests.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-600 text-sm uppercase tracking-wide">Unit Tests</h2>
          {unitTests.map((t) => <TestCard key={t.id} t={t} />)}
        </section>
      )}

      {otherTests.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gray-600 text-sm uppercase tracking-wide">แบบทดสอบอื่น</h2>
          {otherTests.map((t) => <TestCard key={t.id} t={t} />)}
        </section>
      )}

      {tests.length === 0 && (
        <div className="bg-white rounded-xl border p-10 text-center">
          <p className="text-gray-400">ยังไม่มีแบบทดสอบสำหรับระดับนี้</p>
        </div>
      )}
    </div>
  );
}
