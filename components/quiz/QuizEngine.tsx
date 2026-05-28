"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export interface QuizQuestion {
  id: string;
  questionType: "MCQ" | "TRUE_FALSE" | "FILL_BLANK" | "MATCHING" | "SENTENCE_ORDER";
  questionData: {
    prompt: string;
    options?: string[];
    context?: string;
    words?: string[];
    pairs?: Array<{ left: string; right: string }>;
  };
  correctAnswer: string | string[] | Record<string, string>;
  explanationTh?: string;
  points: number;
}

interface QuizResult {
  totalScore: number;
  maxScore: number;
  answers: Array<{
    questionId: string;
    userAnswer: string | string[];
    isCorrect: boolean;
    explanationTh?: string;
    correctAnswer: string | string[] | Record<string, string>;
  }>;
}

interface QuizEngineProps {
  questions: QuizQuestion[];
  onComplete: (result: QuizResult) => void;
  title?: string;
}

export default function QuizEngine({ questions, onComplete, title = "แบบทดสอบ" }: QuizEngineProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [fillInput, setFillInput] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;
  const userAnswer = answers[q?.id];

  function submitAnswer(answer: string | string[]) {
    setAnswers((prev) => ({ ...prev, [q.id]: answer }));
    setShowExplanation(true);
  }

  function next() {
    setShowExplanation(false);
    setFillInput("");
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    const resultAnswers = questions.map((question) => {
      const ua = answers[question.id] ?? "";
      const correct = checkCorrect(question, ua);
      return {
        questionId: question.id,
        userAnswer: ua,
        isCorrect: correct,
        explanationTh: question.explanationTh,
        correctAnswer: question.correctAnswer,
      };
    });

    const totalScore = resultAnswers.reduce(
      (sum, a, i) => sum + (a.isCorrect ? questions[i].points : 0),
      0
    );
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

    onComplete({ totalScore, maxScore, answers: resultAnswers });
  }

  if (!q) return null;

  const isAnswered = userAnswer !== undefined;
  const isCurrentCorrect = isAnswered && checkCorrect(q, userAnswer);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">{title}</span>
          <span className="text-sm text-gray-400">{current + 1} / {questions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border p-6">
        {q.questionData.context && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600 border-l-4 border-blue-300">
            {q.questionData.context}
          </div>
        )}
        <p className="text-base font-semibold text-gray-800 mb-5 leading-relaxed">
          {q.questionData.prompt}
        </p>

        {/* MCQ */}
        {q.questionType === "MCQ" && q.questionData.options && (
          <div className="space-y-2">
            {q.questionData.options.map((opt) => {
              const isSelected = userAnswer === opt;
              const isCorrectOpt = opt === q.correctAnswer;
              let cls = "w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ";
              if (showExplanation && isSelected && isCorrectOpt) cls += "border-green-500 bg-green-50 text-green-700";
              else if (showExplanation && isSelected && !isCorrectOpt) cls += "border-red-400 bg-red-50 text-red-700";
              else if (showExplanation && isCorrectOpt) cls += "border-green-400 bg-green-50 text-green-700";
              else if (isSelected) cls += "border-blue-500 bg-blue-50 text-blue-700";
              else cls += "border-gray-200 bg-white hover:border-blue-300";

              return (
                <button
                  key={opt}
                  onClick={() => !showExplanation && submitAnswer(opt)}
                  className={cls}
                  disabled={showExplanation}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* TRUE/FALSE */}
        {q.questionType === "TRUE_FALSE" && (
          <div className="flex gap-3">
            {["True", "False"].map((opt) => {
              const isSelected = userAnswer === opt;
              const isCorrectOpt = opt === q.correctAnswer;
              let cls = "flex-1 py-4 rounded-xl border-2 font-semibold text-sm transition-all ";
              if (showExplanation && isSelected && isCorrectOpt) cls += "border-green-500 bg-green-50 text-green-700";
              else if (showExplanation && isSelected && !isCorrectOpt) cls += "border-red-400 bg-red-50 text-red-700";
              else if (showExplanation && isCorrectOpt) cls += "border-green-400 bg-green-50";
              else if (isSelected) cls += "border-blue-500 bg-blue-50";
              else cls += "border-gray-200 bg-white hover:border-blue-300";

              return (
                <button
                  key={opt}
                  onClick={() => !showExplanation && submitAnswer(opt)}
                  className={cls}
                  disabled={showExplanation}
                >
                  {opt === "True" ? "✓ True (ถูก)" : "✗ False (ผิด)"}
                </button>
              );
            })}
          </div>
        )}

        {/* FILL_BLANK */}
        {q.questionType === "FILL_BLANK" && !showExplanation && (
          <div className="space-y-3">
            <input
              type="text"
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fillInput.trim() && submitAnswer(fillInput.trim())}
              placeholder="พิมพ์คำตอบ..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <Button onClick={() => fillInput.trim() && submitAnswer(fillInput.trim())} disabled={!fillInput.trim()} className="w-full">
              ยืนยันคำตอบ
            </Button>
          </div>
        )}

        {q.questionType === "FILL_BLANK" && showExplanation && (
          <div className={`px-4 py-3 rounded-xl border-2 text-sm font-medium ${isCurrentCorrect ? "border-green-500 bg-green-50 text-green-700" : "border-red-400 bg-red-50 text-red-700"}`}>
            คำตอบของคุณ: &quot;{String(userAnswer)}&quot;
            {!isCurrentCorrect && (
              <span className="ml-2 text-gray-600">เฉลย: {String(q.correctAnswer)}</span>
            )}
          </div>
        )}

        {/* Explanation */}
        {showExplanation && q.explanationTh && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm text-blue-700">💡 {q.explanationTh}</p>
          </div>
        )}
      </div>

      {/* Next button */}
      {showExplanation && (
        <Button onClick={next} className="w-full" size="lg">
          {current < questions.length - 1 ? "ข้อถัดไป →" : "ดูผลคะแนน"}
        </Button>
      )}
    </div>
  );
}

function checkCorrect(q: QuizQuestion, ua: string | string[] | undefined): boolean {
  if (!ua) return false;
  const correct = q.correctAnswer;
  if (typeof correct === "string" && typeof ua === "string") {
    return ua.trim().toLowerCase() === correct.trim().toLowerCase();
  }
  return false;
}

// ── Quiz Result Screen ────────────────────────────────────────────────────────

export function QuizResultScreen({
  result,
  onRetry,
  onContinue,
}: {
  result: QuizResult;
  onRetry?: () => void;
  onContinue?: () => void;
}) {
  const pct = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
  const passed = pct >= 70;

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className={`bg-white rounded-2xl border-2 p-8 text-center ${passed ? "border-green-400" : "border-orange-400"}`}>
        <div className="text-5xl mb-3">{passed ? "🎯" : "📝"}</div>
        <p className="text-4xl font-bold text-gray-800">{pct}%</p>
        <p className="text-gray-500 mt-1">{result.totalScore} / {result.maxScore} คะแนน</p>
        <Badge className={`mt-3 ${passed ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
          {passed ? "ผ่าน ✓" : "ยังไม่ผ่าน — ลองใหม่ได้"}
        </Badge>
      </div>

      {/* Answer review */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">ทบทวนคำตอบ</h3>
        <div className="space-y-2">
          {result.answers.map((a, i) => (
            <div
              key={a.questionId}
              className={`flex items-start gap-2 text-sm p-2 rounded-lg ${a.isCorrect ? "bg-green-50" : "bg-red-50"}`}
            >
              <span>{a.isCorrect ? "✅" : "❌"}</span>
              <div>
                <span className="text-gray-500">ข้อ {i + 1}:</span>
                {!a.isCorrect && (
                  <span className="text-gray-600 ml-1">เฉลย: {String(a.correctAnswer)}</span>
                )}
                {a.explanationTh && (
                  <p className="text-gray-400 text-xs mt-0.5">{a.explanationTh}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="flex-1">
            ลองใหม่
          </Button>
        )}
        {onContinue && (
          <Button onClick={onContinue} className="flex-1">
            ดำเนินการต่อ
          </Button>
        )}
      </div>
    </div>
  );
}
