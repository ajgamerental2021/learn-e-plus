import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LEVEL_PROMPTS: Record<string, string> = {
  PRE_A1: "You are a friendly English tutor for absolute beginners. Use ONLY very simple words (hello, yes, no, thank you, numbers 1-10). Respond in Thai when the learner doesn't understand. Keep sentences under 5 words.",
  A1: "You are a friendly English tutor for beginners (A1 CEFR). Use simple present tense, basic vocabulary. Correct major errors gently. Respond in Thai only when necessary.",
  A2: "You are a friendly English tutor (A2 CEFR). Use simple past, present, and future tenses. Encourage the learner and gently correct grammar mistakes.",
  B1: "You are an English tutor (B1 CEFR). Engage in natural conversation. Correct errors tactfully. Use everyday vocabulary.",
  B2: "You are an English tutor (B2 CEFR). Have natural conversations on various topics. Point out subtle language mistakes. Use idiomatic expressions.",
  C1: "You are an English tutor (C1 CEFR). Have sophisticated conversations. Discuss complex topics. Give detailed feedback on grammar and style.",
  C2: "You are an English tutor (C2 CEFR). Engage as a near-native conversation partner. Focus on nuance, register, and style.",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI conversation not configured" }, { status: 503 });
  }

  const { messages, topic } = await req.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    topic?: string;
  };

  const profile = await db.userProfile.findUnique({
    where: { userId: session.user.id },
    include: { currentLevel: { select: { code: true } } },
  });

  const levelCode = profile?.currentLevel?.code ?? "A1";
  const systemPrompt = LEVEL_PROMPTS[levelCode] ?? LEVEL_PROMPTS.A1;
  const topicInstruction = topic ? ` Today's topic: "${topic}". Start by introducing the topic.` : "";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemPrompt + topicInstruction,
    messages,
  });

  const content = response.content[0];
  const text = content.type === "text" ? content.text : "";

  return NextResponse.json({ reply: text });
}
