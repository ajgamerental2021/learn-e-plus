import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import HomeworkGrader from "@/components/admin/HomeworkGrader";

export default async function GradeHomeworkPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") redirect("/dashboard");

  const { submissionId } = await params;

  const submission = await db.homeworkSubmission.findUnique({
    where: { id: submissionId },
    include: {
      feedback: true,
      assignment: {
        include: {
          user: { select: { email: true, profile: { select: { displayName: true } } } },
          homework: { select: { nameTh: true, descriptionTh: true, maxScore: true } },
        },
      },
    },
  });

  if (!submission) notFound();

  const submissionText =
    typeof submission.submissionData === "object" && submission.submissionData !== null
      ? (submission.submissionData as { text?: string }).text ?? ""
      : String(submission.submissionData);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/homework" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-lg font-bold text-gray-800">ตรวจการบ้าน</h1>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-2">
        <h2 className="font-semibold text-gray-800">{submission.assignment.homework.nameTh}</h2>
        {submission.assignment.homework.descriptionTh && (
          <p className="text-sm text-gray-500">{submission.assignment.homework.descriptionTh}</p>
        )}
        <div className="flex gap-4 text-xs text-gray-400">
          <span>นักเรียน: {submission.assignment.user.profile?.displayName ?? submission.assignment.user.email}</span>
          <span>ครั้งที่: {submission.attemptNumber}</span>
          <span>คะแนนเต็ม: {submission.assignment.homework.maxScore}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border p-5">
        <h3 className="text-sm font-medium text-gray-600 mb-2">คำตอบของนักเรียน</h3>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{submissionText || "(ไม่มีข้อความ)"}</p>
      </div>

      <HomeworkGrader
        submissionId={submissionId}
        maxScore={submission.assignment.homework.maxScore}
        existingFeedback={submission.feedback ? { feedbackText: submission.feedback.feedbackText ?? "", score: submission.feedback.score } : null}
      />
    </div>
  );
}
