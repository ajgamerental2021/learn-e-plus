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

  const lesson = await db.lesson.findUnique({
    where: { id, isPublished: true },
    include: {
      contents: { orderBy: { orderNum: "asc" } },
      unit: {
        include: {
          course: { include: { level: true } },
          lessons: {
            where: { isPublished: true },
            orderBy: { orderNum: "asc" },
            select: { id: true, nameTh: true, orderNum: true },
          },
        },
      },
      progress: { where: { userId: session.user.id }, take: 1 },
    },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Find prev/next lesson
  const siblings = lesson.unit.lessons;
  const idx = siblings.findIndex((l) => l.id === id);
  const prevLesson = idx > 0 ? siblings[idx - 1] : null;
  const nextLesson = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return NextResponse.json({ ...lesson, prevLesson, nextLesson });
}
