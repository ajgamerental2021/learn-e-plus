import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import TestRunner from "@/components/quiz/TestRunner";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const test = await db.test.findUnique({
    where: { id, isActive: true },
    include: {
      level: { select: { code: true, nameTh: true } },
      sections: {
        orderBy: { orderNum: "asc" },
        include: {
          questions: {
            orderBy: { orderNum: "asc" },
            include: {
              question: {
                select: {
                  id: true,
                  questionData: true,
                  correctAnswer: true,
                  explanationTh: true,
                  questionType: true,
                  skillType: true,
                  points: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!test) notFound();

  const totalQuestions = test.sections.reduce((s, sec) => s + sec.questions.length, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tests" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{test.nameTh}</h1>
          <p className="text-xs text-gray-400">{test.level?.nameTh} · {totalQuestions} ข้อ{test.durationMins ? ` · ${test.durationMins} นาที` : ""}</p>
        </div>
      </div>
      <TestRunner test={test as never} />
    </div>
  );
}
