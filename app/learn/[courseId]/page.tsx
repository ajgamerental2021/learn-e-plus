import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const SKILL_LABEL: Record<string, string> = {
  VOCABULARY: "คำศัพท์",
  GRAMMAR: "ไวยากรณ์",
  LISTENING: "การฟัง",
  READING: "การอ่าน",
  WRITING: "การเขียน",
  SPEAKING: "การพูด",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId, isPublished: true },
    include: {
      level: true,
      units: {
        where: { isPublished: true },
        orderBy: { orderNum: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { orderNum: "asc" },
            include: {
              progress: { where: { userId: session.user.id }, take: 1 },
            },
          },
          progress: { where: { userId: session.user.id }, take: 1 },
        },
      },
    },
  });

  if (!course) notFound();

  // Compute unlock status
  const unitsWithUnlock = course.units.map((unit, unitIdx) => {
    const prevUnitDone = unitIdx === 0 || course.units[unitIdx - 1].progress[0]?.status === "COMPLETED";
    return {
      ...unit,
      isUnlocked: prevUnitDone,
      lessons: unit.lessons.map((lesson, lessonIdx) => {
        let isUnlocked = false;
        if (unitIdx === 0 && lessonIdx === 0) isUnlocked = true;
        else if (lessonIdx === 0) isUnlocked = prevUnitDone;
        else isUnlocked = unit.lessons[lessonIdx - 1].progress[0]?.status === "COMPLETED";
        return {
          ...lesson,
          isUnlocked,
          status: (lesson.progress[0]?.status ?? "NOT_STARTED") as string,
        };
      }),
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← แดชบอร์ด
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mt-1">{course.nameTh}</h1>
          <p className="text-sm text-gray-500">{course.level.nameTh} · {course.descriptionTh}</p>
        </div>
      </div>

      {/* Units */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {unitsWithUnlock.map((unit) => (
          <div key={unit.id}>
            <div className={`mb-3 flex items-center gap-2 ${!unit.isUnlocked ? "opacity-50" : ""}`}>
              <h2 className="font-semibold text-gray-700">{unit.nameTh}</h2>
              {!unit.isUnlocked && <span className="text-xs text-gray-400">🔒</span>}
              {unit.progress[0]?.status === "COMPLETED" && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ จบแล้ว</span>
              )}
            </div>

            <div className="space-y-2">
              {unit.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  courseId={course.id}
                  isUnlocked={unit.isUnlocked && lesson.isUnlocked}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  courseId,
  isUnlocked,
}: {
  lesson: { id: string; nameTh: string; skillType: string; durationMinutes: number; status: string };
  courseId: string;
  isUnlocked: boolean;
}) {
  const statusIcon =
    lesson.status === "COMPLETED" ? "✅" : lesson.status === "IN_PROGRESS" ? "📖" : "○";

  if (!isUnlocked) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 opacity-50">
        <span className="text-lg">🔒</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{lesson.nameTh}</p>
          <p className="text-xs text-gray-300">{lesson.durationMinutes} นาที</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/learn/lesson/${lesson.id}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-sm ${
        lesson.status === "COMPLETED"
          ? "bg-green-50 border-green-200"
          : lesson.status === "IN_PROGRESS"
          ? "bg-blue-50 border-blue-200"
          : "bg-white border-gray-200 hover:border-blue-200"
      }`}
    >
      <span className="text-lg">{statusIcon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{lesson.nameTh}</p>
        <p className="text-xs text-gray-400">{lesson.durationMinutes} นาที</p>
      </div>
      <Badge variant="secondary" className="text-xs">
        {SKILL_LABEL[lesson.skillType] ?? lesson.skillType}
      </Badge>
    </Link>
  );
}
