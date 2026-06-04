import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
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
  const userRole = (session.user as { role?: string }).role;
  const canOpenAdmin = userRole === "ADMIN" || userRole === "TEACHER";
  if (userRole === "PARENT") {
    const links = await db.guardianStudent.findMany({
      where: { guardianId: userId },
      include: {
        student: {
          include: {
            profile: { include: { currentLevel: { select: { nameTh: true, code: true } } } },
            streak: { select: { currentStreak: true, longestStreak: true } },
            lessonProgress: {
              where: { status: "COMPLETED" },
              orderBy: { completedAt: "desc" },
              take: 1,
              include: { lesson: { select: { nameTh: true } } },
            },
            _count: {
              select: {
                lessonProgress: { where: { status: "COMPLETED" } },
                homeworkAssignments: { where: { status: { in: ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW"] } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">หน้าผู้ปกครอง</h1>
            <p className="mt-1 text-sm text-gray-500">ติดตามบทเรียน การบ้าน และ notification ของนักเรียนที่ผูกกับบัญชีนี้</p>
          </div>
          <LinkButton href="/notifications" variant="outline">ดูแจ้งเตือน</LinkButton>
        </div>

        {links.length === 0 ? (
          <div className="rounded-xl border bg-white p-5 text-center">
            <p className="font-medium text-gray-800">ยังไม่ได้ผูกนักเรียน</p>
            <p className="mt-1 text-sm text-gray-500">ให้ Admin ผูกบัญชีผู้ปกครองกับนักเรียนที่หน้า Admin Users</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {links.map(({ student }) => {
              const latest = student.lessonProgress[0];
              return (
                <div key={student.id} className="rounded-xl border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-gray-800">{student.profile?.displayName ?? student.email}</h2>
                      <p className="mt-1 text-xs text-gray-400">
                        {student.profile?.currentLevel?.nameTh ?? "ยังไม่ได้กำหนดระดับ"} · streak {student.streak?.currentStreak ?? 0} วัน
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      นักเรียน
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-blue-50 p-3">
                      <p className="text-xl font-bold text-blue-800">{student._count.lessonProgress}</p>
                      <p className="text-xs text-blue-600">บทเรียนที่จบ</p>
                    </div>
                    <div className="rounded-lg border bg-amber-50 p-3">
                      <p className="text-xl font-bold text-amber-800">{student._count.homeworkAssignments}</p>
                      <p className="text-xs text-amber-600">การบ้านค้าง/รอตรวจ</p>
                    </div>
                    <div className="rounded-lg border bg-gray-50 p-3">
                      <p className="text-sm font-semibold text-gray-800">{latest?.lesson.nameTh ?? "ยังไม่มี"}</p>
                      <p className="mt-1 text-xs text-gray-500">บทล่าสุด</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const dueSoonAt = new Date();
  dueSoonAt.setDate(dueSoonAt.getDate() + 2);

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
        dueDate: { lte: dueSoonAt },
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
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { orderNum: "asc" },
                include: { progress: { where: { userId }, take: 1 } },
              },
            },
          },
        },
      })
    : null;

  let nextLesson: {
    id: string;
    nameTh: string;
    skillType: string;
    durationMinutes: number;
    unitName: string;
    courseId: string;
    courseName: string;
    completedBefore: number;
    totalLessons: number;
  } | null = null;
  if (currentCourse) {
    let completedBefore = 0;
    const totalLessons = currentCourse.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
    outer: for (const unit of currentCourse.units) {
      for (const lesson of unit.lessons) {
        if (lesson.progress[0]?.status !== "COMPLETED") {
          nextLesson = {
            id: lesson.id,
            nameTh: lesson.nameTh,
            skillType: lesson.skillType,
            durationMinutes: lesson.durationMinutes,
            unitName: unit.nameTh,
            courseId: currentCourse.id,
            courseName: currentCourse.nameTh,
            completedBefore,
            totalLessons,
          };
          break outer;
        }
        completedBefore++;
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

      {canOpenAdmin && (
        <div className="rounded-xl border border-gray-900 bg-gray-950 p-4 text-white">
          <p className="text-xs font-medium text-blue-200">Admin Panel</p>
          <h2 className="mt-1 font-semibold">จัดการผู้ใช้และระบบ</h2>
          <p className="mt-1 text-xs text-gray-300">ไปที่รายการ Users เพื่อเพิ่ม แก้ไข ปิดใช้งาน หรือเปลี่ยนประเภท Member</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <LinkButton href="/admin/users" className="justify-center bg-white text-gray-950 hover:bg-gray-100">Users</LinkButton>
            <LinkButton href="/admin" variant="outline" className="justify-center border-white/30 text-white hover:bg-white/10">Dashboard</LinkButton>
          </div>
        </div>
      )}

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
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">แผนวันนี้</p>
              <h2 className="font-semibold text-gray-800">{nextLesson.nameTh}</h2>
              <p className="text-xs text-gray-400 mt-1">
                {nextLesson.courseName} · {nextLesson.unitName}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {SKILL_LABEL[nextLesson.skillType] ?? nextLesson.skillType}
            </Badge>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>ความคืบหน้าในคอร์ส</span>
              <span>{nextLesson.completedBefore}/{nextLesson.totalLessons} บท</span>
            </div>
            <Progress value={(nextLesson.completedBefore / Math.max(nextLesson.totalLessons, 1)) * 100} className="h-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <p className="text-blue-700 font-medium">{nextLesson.durationMinutes} นาที</p>
              <p className="text-blue-500 mt-0.5">เป้าหมายวันนี้</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <p className="text-gray-700 font-medium">{homeworkPending} งาน</p>
              <p className="text-gray-400 mt-0.5">การบ้านใกล้ครบกำหนด</p>
            </div>
          </div>

          <div className="flex gap-3">
            <LinkButton href={`/learn/lesson/${nextLesson.id}`} className="flex-1 justify-center">เรียนบทนี้</LinkButton>
            <LinkButton href={`/learn/${nextLesson.courseId}`} variant="outline" className="flex-1 justify-center">ดูคอร์ส</LinkButton>
          </div>
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
