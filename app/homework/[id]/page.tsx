import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import HomeworkDetail from "@/components/homework/HomeworkDetail";

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

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
          lesson: { select: { id: true, nameTh: true } },
        },
      },
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: { feedback: true },
      },
    },
  });

  if (!assignment) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/homework" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-lg font-bold text-gray-800">{assignment.homework.nameTh}</h1>
      </div>
      <HomeworkDetail assignment={assignment as never} />
    </div>
  );
}
