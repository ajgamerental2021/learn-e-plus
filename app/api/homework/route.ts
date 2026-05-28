import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const statusFilter = req.nextUrl.searchParams.get("status");
  const now = new Date();

  // Auto-update overdue homework
  await db.homeworkAssignment.updateMany({
    where: {
      userId: session.user.id,
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      dueDate: { lt: now },
    },
    data: { status: "LATE" },
  });

  const assignments = await db.homeworkAssignment.findMany({
    where: {
      userId: session.user.id,
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { assignedAt: "desc" }],
    include: {
      homework: {
        select: {
          id: true,
          nameTh: true,
          descriptionTh: true,
          skillType: true,
          maxScore: true,
          dueOffsetDays: true,
          lesson: { select: { id: true, nameTh: true } },
          unit: { select: { id: true, nameTh: true } },
        },
      },
      submissions: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        include: { feedback: true },
      },
    },
  });

  return NextResponse.json(assignments);
}
