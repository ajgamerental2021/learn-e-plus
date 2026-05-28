import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  answers: z.record(z.string(), z.unknown()),
  timeSpentSecs: z.number().int().min(0).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: testId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { answers, timeSpentSecs } = parsed.data;

  // Check attempt limit
  const test = await db.test.findUnique({
    where: { id: testId, isActive: true },
    include: {
      sections: {
        include: {
          questions: {
            include: { question: true },
          },
        },
      },
    },
  });
  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  const usedAttempts = await db.testAttempt.count({
    where: { testId, userId: session.user.id, status: "completed" },
  });
  if (usedAttempts >= test.maxAttempts) {
    return NextResponse.json({ error: "ใช้ครบจำนวนครั้งที่อนุญาตแล้ว" }, { status: 403 });
  }

  // Flatten all questions
  const allQuestions = test.sections.flatMap((s) => s.questions.map((sq) => sq.question));

  // Score answers
  let totalScore = 0;
  const skillScores: Record<string, { score: number; max: number }> = {};
  const testAnswerData = allQuestions.map((q) => {
    const ua = answers[q.id];
    const correct = q.correctAnswer;
    const isCorrect = checkAnswer(ua, correct);
    const pts = isCorrect ? q.points : 0;
    totalScore += pts;

    const skill = q.skillType;
    if (!skillScores[skill]) skillScores[skill] = { score: 0, max: 0 };
    skillScores[skill].max += q.points;
    if (isCorrect) skillScores[skill].score += q.points;

    return {
      questionId: q.id,
      userAnswer: ua as object,
      isCorrect,
      score: pts,
    };
  });

  const maxScore = allQuestions.reduce((s, q) => s + q.points, 0);
  const passed = maxScore > 0 && (totalScore / maxScore) * 100 >= test.passingScore;

  const attempt = await db.testAttempt.create({
    data: {
      testId,
      userId: session.user.id,
      completedAt: new Date(),
      status: "completed",
      totalScore,
      timeTakenSecs: timeSpentSecs,
      answers: {
        create: testAnswerData,
      },
    },
  });

  const result = await db.testResult.create({
    data: {
      attemptId: attempt.id,
      userId: session.user.id,
      testId,
      totalScore,
      skillScores,
      passed,
    },
  });

  // Update skill scores for user
  for (const [skill, { score, max }] of Object.entries(skillScores)) {
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    await db.skillScore.upsert({
      where: { userId_skillType: { userId: session.user.id, skillType: skill as never } },
      update: { score: pct },
      create: { userId: session.user.id, skillType: skill as never, score: pct },
    });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    totalScore,
    maxScore,
    passed,
    skillScores,
    passingScore: test.passingScore,
    answersWithCorrect: allQuestions.map((q, i) => ({
      questionId: q.id,
      isCorrect: testAnswerData[i].isCorrect,
      correctAnswer: q.correctAnswer,
      explanationTh: q.explanationTh,
    })),
  });
}

function checkAnswer(userAnswer: unknown, correctAnswer: unknown): boolean {
  if (userAnswer === null || userAnswer === undefined) return false;
  const ua = String(userAnswer).trim().toLowerCase();
  const ca = String(correctAnswer).trim().toLowerCase();
  return ua === ca;
}
