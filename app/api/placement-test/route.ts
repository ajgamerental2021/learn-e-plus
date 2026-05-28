import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLACEMENT_QUESTIONS, calculatePlacementResult } from "@/lib/placement-questions";

// GET — fetch questions (strip correct answers)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const questions = PLACEMENT_QUESTIONS.map(({ id, type, skill, level, question, options, points }) => ({
    id, type, skill, level, question, options, points,
  }));

  return NextResponse.json({ questions, totalQuestions: questions.length });
}

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

// POST — submit answers, save result, update user level
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid answers" }, { status: 400 });

  const result = calculatePlacementResult(parsed.data.answers);

  const recommendedLevel = await db.level.findUnique({
    where: { code: result.recommendedLevel },
  });

  if (!recommendedLevel) return NextResponse.json({ error: "Level not found" }, { status: 500 });

  // Upsert placement result (user can retake once)
  await db.placementTestResult.upsert({
    where: { userId: session.user.id },
    update: {
      recommendedLevel: result.recommendedLevel,
      skillBreakdown: result.skillBreakdown,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      attemptId: `placement-${session.user.id}-${Date.now()}`,
    },
    create: {
      userId: session.user.id,
      attemptId: `placement-${session.user.id}-${Date.now()}`,
      recommendedLevel: result.recommendedLevel,
      skillBreakdown: result.skillBreakdown,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
    },
  });

  // Update user's current level
  await db.userProfile.update({
    where: { userId: session.user.id },
    data: { currentLevelId: recommendedLevel.id },
  });

  return NextResponse.json({
    ...result,
    recommendedLevelName: recommendedLevel.nameTh,
  });
}
