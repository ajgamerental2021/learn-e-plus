import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function LearnPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    include: { currentLevel: true },
  });

  const courses = await db.course.findMany({
    where: {
      isPublished: true,
      ...(profile?.currentLevelId ? { levelId: profile.currentLevelId } : {}),
    },
    include: {
      level: true,
      _count: { select: { units: { where: { isPublished: true } } } },
      progress: { where: { userId: session.user.id }, take: 1 },
    },
    orderBy: { orderNum: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">บทเรียน</h1>
        {profile?.currentLevel && (
          <p className="text-sm text-gray-500 mt-1">ระดับ {profile.currentLevel.nameTh}</p>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-400">ยังไม่มีบทเรียนสำหรับระดับนี้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const status = course.progress[0]?.status ?? "NOT_STARTED";
            const pct = course.progress[0]?.progressPct ?? 0;
            return (
              <Link
                key={course.id}
                href={`/learn/${course.id}`}
                className="block bg-white rounded-xl border hover:shadow-sm transition-all p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{course.nameTh}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{course.descriptionTh}</p>
                    <p className="text-xs text-gray-400 mt-1">{course._count.units} หน่วยการเรียน</p>
                  </div>
                  <Badge variant={status === "COMPLETED" ? "default" : "secondary"} className="text-xs shrink-0">
                    {status === "COMPLETED" ? "✓ จบแล้ว" : status === "IN_PROGRESS" ? "กำลังเรียน" : "ยังไม่เริ่ม"}
                  </Badge>
                </div>
                {status !== "NOT_STARTED" && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
