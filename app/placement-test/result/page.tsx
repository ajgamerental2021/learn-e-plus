import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";

const SKILL_LABEL: Record<string, string> = {
  VOCABULARY: "คำศัพท์",
  GRAMMAR: "ไวยากรณ์",
  READING: "การอ่าน",
};

export default async function PlacementResultPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const result = await db.placementTestResult.findUnique({
    where: { userId: session.user.id },
  });
  if (!result) redirect("/placement-test");

  const level = await db.level.findUnique({
    where: { code: result.recommendedLevel },
  });

  const skillBreakdown = result.skillBreakdown as Record<string, { score: number; max: number }>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-gray-800">ผลการวัดระดับ</h1>
        </div>

        {/* Level result */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
          <p className="text-gray-500 text-sm mb-2">ระดับที่แนะนำสำหรับคุณ</p>
          <div className="text-4xl font-bold text-blue-700 mb-1">{result.recommendedLevel.replace("_", "-")}</div>
          <div className="text-lg font-medium text-gray-700">{level?.nameTh}</div>
        </div>

        {/* Skill breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-700 mb-4">คะแนนแยกตามทักษะ</h2>
          <div className="space-y-3">
            {Object.entries(skillBreakdown).map(([skill, { score, max }]) => {
              const pct = max > 0 ? Math.round((score / max) * 100) : 0;
              return (
                <div key={skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{SKILL_LABEL[skill] ?? skill}</span>
                    <span className="font-medium">{score}/{max} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths / Weaknesses */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-green-700 mb-2">จุดแข็ง</p>
              {result.strengths.length > 0
                ? result.strengths.map((s) => (
                    <Badge key={s} className="mr-1 mb-1 bg-green-100 text-green-700">
                      {SKILL_LABEL[s] ?? s}
                    </Badge>
                  ))
                : <p className="text-sm text-gray-400">—</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-red-700 mb-2">ควรพัฒนา</p>
              {result.weaknesses.length > 0
                ? result.weaknesses.map((s) => (
                    <Badge key={s} className="mr-1 mb-1 bg-red-100 text-red-700">
                      {SKILL_LABEL[s] ?? s}
                    </Badge>
                  ))
                : <p className="text-sm text-gray-400">—</p>}
            </div>
          </div>
        </div>

        <LinkButton href="/dashboard" className="w-full" size="lg">เริ่มเรียนเลย →</LinkButton>
      </div>
    </div>
  );
}
