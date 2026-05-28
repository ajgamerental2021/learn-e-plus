import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const course = await db.course.findUnique({
    where: { id, isPublished: true },
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
              progress: {
                where: { userId: session.user.id },
                take: 1,
              },
            },
          },
          progress: {
            where: { userId: session.user.id },
            take: 1,
          },
        },
      },
      progress: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
  });

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Attach unlock status: first lesson of first unit is always unlocked,
  // subsequent lessons unlock when previous is COMPLETED
  const enriched = {
    ...course,
    units: course.units.map((unit, unitIdx) => ({
      ...unit,
      isUnlocked: unitIdx === 0 || (course.units[unitIdx - 1].progress[0]?.status === "COMPLETED"),
      lessons: unit.lessons.map((lesson, lessonIdx) => {
        let isUnlocked = false;
        if (unitIdx === 0 && lessonIdx === 0) {
          isUnlocked = true;
        } else if (lessonIdx === 0) {
          // First lesson of a unit unlocks when previous unit is done
          isUnlocked = course.units[unitIdx - 1]?.progress[0]?.status === "COMPLETED";
        } else {
          isUnlocked = unit.lessons[lessonIdx - 1].progress[0]?.status === "COMPLETED";
        }
        return {
          ...lesson,
          isUnlocked,
          progressStatus: lesson.progress[0]?.status ?? "NOT_STARTED",
        };
      }),
    })),
  };

  return NextResponse.json(enriched);
}
