import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DailyChallenge from "@/components/dashboard/DailyChallenge";

const SKILL_LABEL: Record<string, string> = {
  VOCABULARY: "คำศัพท์",
  GRAMMAR: "ไวยากรณ์",
  LISTENING: "การฟัง",
  READING: "การอ่าน",
  WRITING: "การเขียน",
  SPEAKING: "การพูด",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const userId = session.user.id;

  const [profile, streak, skillScores, lessonsDone, homeworkPending] = await Promise.all([
    db.userProfile.findUnique({
      where: { userId },
      include: {
        currentLevel: { select: { code: true, nameTh: true, nameEn: true } },
      },
    }),
    db.learningStreak.findUnique({ where: { userId } }),
    db.skillScore.findMany({ where: { userId } }),
    db.userLessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.homeworkAssignment.count({
      where: {
        userId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        dueDate: { lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  // Find next lesson
  const currentCourse = profile?.currentLevelId
    ? await db.course.findFirst({
        where: { levelId: profile.currentLevelId, isPublished: true },
        orderBy: { orderNum: "asc" },
        include: {
          units: {
            where: { isPublished: true },
            orderBy: { orderNum: "asc" },
            take: 3,
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { orderNum: "asc" },
                take: 5,
                include: { progress: { where: { userId }, take: 1 } },
              },
            },
          },
        },
      })
    : null;

  let nextLesson: { id: string; nameTh: string; courseId: string } | null = null;
  if (currentCourse) {
    outer: for (const unit of currentCourse.units) {
      for (const lesson of unit.lessons) {
        if (lesson.progress[0]?.status !== "COMPLETED") {
          nextLesson = { id: lesson.id, nameTh: lesson.nameTh, courseId: currentCourse.id };
          break outer;
        }
      }
    }
  }

  const placementDone = await db.placementTestResult.findUnique({ where: { userId } });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          สวัสดี {profile?.displayName ?? "คุณ"} 👋
        </h1>
        {profile?.currentLevel ? (
          <p className="text-gray-500 text-sm mt-1">
            ระดับปัจจุบัน: <span className="font-semibold text-blue-700">{profile.currentLevel.nameTh}</span>
          </p>
        ) : (
          <p className="text-gray-500 text-sm mt-1">ยังไม่ได้กำหนดระดับ</p>
        )}
      </div>

      {/* Placement test banner */}
      {!placementDone && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-blue-800 text-sm">แนะนำ: ทำแบบทดสอบวัดระดับ</p>
            <p className="text-xs text-blue-600 mt-0.5">ให้ระบบแนะนำระดับที่เหมาะกับคุณ (15 นาที)</p>
          </div>
          <LinkButton href="/placement-test" size="sm">เริ่มเลย</LinkButton>
        </div>
      )}

      {/* Daily Challenge */}
      <DailyChallenge />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="🔥" value={streak?.currentStreak ?? 0} label="วันต่อเนื่อง" color="orange" />
        <StatCard icon="📚" value={lessonsDone} label="บทเรียน" color="blue" />
        <StatCard icon="✏️" value={homeworkPending} label="การบ้านใกล้ครบ" color="red" />
      </div>

      {/* Next lesson */}
      {nextLesson && (
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-400 mb-1">บทเรียนถัดไป</p>
          <p className="font-semibold text-gray-800 mb-3">{nextLesson.nameTh}</p>
          <LinkButton href={`/learn/lesson/${nextLesson.id}`} className="w-full justify-center">เรียนต่อ →</LinkButton>
        </div>
      )}

      {!nextLesson && currentCourse && (
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500 mb-3">เรียนจบทุกบทในระดับนี้แล้ว! 🎉</p>
          <LinkButton href={`/learn/${currentCourse.id}`} variant="outline" className="w-full justify-center">ดู Course</LinkButton>
        </div>
      )}

      {!currentCourse && (
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-sm text-gray-500 mb-3">ยังไม่มี Course ที่กำหนดไว้</p>
          <LinkButton href="/placement-test" variant="outline">ทำ Placement Test</LinkButton>
        </div>
      )}

      {/* Skill scores */}
      {skillScores.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 mb-3">ทักษะของคุณ</h2>
          <div className="space-y-2.5">
            {skillScores.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{SKILL_LABEL[s.skillType] ?? s.skillType}</span>
                  <span>{s.score}%</span>
                </div>
                <Progress value={s.score} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: "orange" | "blue" | "red";
}) {
  const colorMap = {
    orange: "bg-orange-50 border-orange-100",
    blue: "bg-blue-50 border-blue-100",
    red: value > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color]}`}>
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
