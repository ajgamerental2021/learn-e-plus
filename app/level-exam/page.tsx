import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import LevelExamGate from "@/components/level-exam/LevelExamGate";

export default async function LevelExamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    include: { currentLevel: { select: { id: true, code: true, nameTh: true, orderNum: true } } },
  });

  if (!profile?.currentLevelId) redirect("/onboarding");

  const setting = await db.levelExamSetting.findUnique({
    where: { levelId: profile.currentLevelId },
  });

  // Find level exam test
  const levelExamTest = await db.test.findFirst({
    where: {
      levelId: profile.currentLevelId,
      type: "UNIT_TEST",
    },
    select: { id: true, nameTh: true, durationMins: true, passingScore: true },
  });

  const nextLevel = await db.level.findFirst({
    where: { orderNum: (profile.currentLevel?.orderNum ?? 0) + 1, isActive: true },
    select: { code: true, nameTh: true },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-lg font-bold text-gray-800">สอบเลื่อนระดับ</h1>
      </div>
      <LevelExamGate
        currentLevel={profile.currentLevel!}
        nextLevel={nextLevel}
        examTest={levelExamTest}
        setting={setting ? { minLevelExamScore: setting.minLevelExamScore } : null}
      />
    </div>
  );
}
