import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function TestResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id, attemptId } = await params;

  const attempt = await db.testAttempt.findFirst({
    where: { id: attemptId, userId: session.user.id, testId: id },
    include: {
      test: { select: { nameTh: true, passingScore: true } },
      result: true,
      answers: {
        include: {
          question: {
            select: {
              questionData: true,
              correctAnswer: true,
              explanationTh: true,
              points: true,
            },
          },
        },
      },
    },
  });

  if (!attempt || !attempt.result) notFound();

  const { result } = attempt;
  const passed = result.passed;

  const maxPossible = attempt.answers.reduce((s, a) => s + a.question.points, 0);
  const scorePercent = maxPossible > 0 ? Math.round((result.totalScore / maxPossible) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tests" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-lg font-bold text-gray-800">ผลการสอบ</h1>
      </div>

      <div className={`rounded-2xl border-2 p-8 text-center ${passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <p className="text-5xl mb-3">{passed ? "🎉" : "📝"}</p>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{passed ? "ผ่านแล้ว!" : "ยังไม่ผ่าน"}</h2>
        <p className="text-4xl font-bold text-gray-800">{scorePercent}%</p>
        <p className="text-sm text-gray-500 mt-2">
          {result.totalScore}/{maxPossible} คะแนน · ต้องการ {attempt.test.passingScore}% เพื่อผ่าน
        </p>
        {attempt.timeTakenSecs && (
          <p className="text-xs text-gray-400 mt-1">
            ใช้เวลา {Math.floor(attempt.timeTakenSecs / 60)}:{String(attempt.timeTakenSecs % 60).padStart(2, "0")} นาที
          </p>
        )}
      </div>

      {attempt.answers.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">ทบทวนคำตอบ</h2>
          {attempt.answers.map((a, i) => {
            const qData = a.question.questionData as { text?: string };
            const correctAns = a.question.correctAnswer as { answer?: string } | string;
            const correctStr = typeof correctAns === "string" ? correctAns : (correctAns as { answer?: string })?.answer ?? "";
            const userAns = typeof a.userAnswer === "string" ? a.userAnswer : JSON.stringify(a.userAnswer);
            return (
              <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.isCorrect ? "border-green-100" : "border-red-100"}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-sm font-bold mt-0.5 ${a.isCorrect ? "text-green-600" : "text-red-500"}`}>
                    {a.isCorrect ? "✓" : "✗"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{i + 1}. {qData.text}</p>
                    <p className="text-sm text-gray-600 mt-1">คำตอบ: {userAns}</p>
                    {!a.isCorrect && correctStr && (
                      <p className="text-sm text-green-700 mt-0.5">เฉลย: {correctStr}</p>
                    )}
                    {a.question.explanationTh && (
                      <p className="text-xs text-gray-400 mt-1 italic">{a.question.explanationTh}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{a.score ?? 0}/{a.question.points}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/tests/${id}`} className="flex-1 py-2.5 border rounded-xl text-sm text-center text-gray-600 hover:bg-gray-50">
          ทำใหม่
        </Link>
        <Link href="/tests" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm text-center font-medium">
          กลับรายการ
        </Link>
      </div>
    </div>
  );
}
