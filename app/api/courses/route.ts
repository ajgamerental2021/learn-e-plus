import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const levelId = req.nextUrl.searchParams.get("levelId");

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { currentLevelId: true },
  });

  const courses = await db.course.findMany({
    where: {
      isPublished: true,
      ...(levelId ? { levelId } : { levelId: profile?.currentLevelId ?? undefined }),
    },
    include: {
      level: { select: { id: true, code: true, nameTh: true } },
      units: {
        where: { isPublished: true },
        orderBy: { orderNum: "asc" },
        include: {
          _count: { select: { lessons: { where: { isPublished: true } } } },
        },
      },
      progress: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
    orderBy: { orderNum: "asc" },
  });

  return NextResponse.json(courses);
}
