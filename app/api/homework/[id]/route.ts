import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const assignment = await db.homeworkAssignment.findFirst({
    where: { id, userId: session.user.id },
    include: {
      homework: {
        select: {
          id: true,
          nameTh: true,
          descriptionTh: true,
          skillType: true,
          maxScore: true,
          maxAttempts: true,
          dueOffsetDays: true,
          lesson: { select: { id: true, nameTh: true } },
          unit: { select: { id: true, nameTh: true } },
        },
      },
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: { feedback: true },
      },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(assignment);
}
