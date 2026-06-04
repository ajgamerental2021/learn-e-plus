"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

interface QuestionData {
  text: string;
  options?: string[];
}

interface FlatQuestion {
  sectionQuestionId: string;
  questionId: string;
  questionData: QuestionData;
  questionType: string;
  skillType: string;
  points: number;
  explanationTh: string | null;
}

interface TestSection {
  id: string;
  nameTh: string | null;
  questions: Array<{
    id: string;
    question: {
      id: string;
      questionData: unknown;
      questionType: string;
      skillType: string;
      points: number;
      explanationTh: string | null;
    };
  }>;
}

interface Test {
  id: string;
  nameTh: string;
  durationMins: number | null;
  passingScore: number;
  sections: TestSection[];
}

export default function TestRunner({ test }: { test: Test }) {
  const router = useRouter();

  const allQuestions: FlatQuestion[] = test.sections.flatMap((s) =>
    s.questions.map((sq) => ({
      sectionQuestionId: sq.id,
      questionId: sq.question.id,
      questionData: sq.question.questionData as QuestionData,
      questionType: sq.question.questionType,
      skillType: sq.question.skillType,
      points: sq.question.points,
      explanationTh: sq.question.explanationTh,
    }))
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [qIdx, setQIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(test.durationMins ? test.durationMins * 60 : null);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0;
    const res = await fetch(`/api/tests/${test.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, timeSpentSecs: timeTaken }),
    });
    const data = await res.json();
    if (res.ok && data.attemptId) {
      router.push(`/tests/${test.id}/result/${data.attemptId}`);
    }
  }, [submitting, startTime, test.id, answers, router]);

  useEffect(() => {
    if (!started || timeLeft === null) return;
    if (timeLeft <= 0) {
      const t = setTimeout(() => handleSubmit(), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTimeLeft((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [started, timeLeft, handleSubmit]);

  if (!started) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-gray-800">{test.nameTh}</h2>
        <div className="text-sm text-gray-500 space-y-1">
          <p>จำนวนข้อ: {allQuestions.length} ข้อ</p>
          {test.durationMins && <p>เวลา: {test.durationMins} นาที</p>}
          <p>คะแนนผ่าน: {test.passingScore}%</p>
        </div>
        <button
          onClick={() => { setStarted(true); setStartTime(new Date()); }}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm"
        >
          เริ่มทำข้อสอบ
        </button>
      </div>
    );
  }

  const q = allQuestions[qIdx];
  const answered = answers[q.questionId] !== undefined;
  const progress = ((qIdx + 1) / allQuestions.length) * 100;
  const mins = timeLeft !== null ? Math.floor(timeLeft / 60) : null;
  const secs = timeLeft !== null ? timeLeft % 60 : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-gray-400 shrink-0">{qIdx + 1}/{allQuestions.length}</span>
        </div>
        {timeLeft !== null && (
          <span className={`ml-3 text-sm font-mono font-bold ${timeLeft < 60 ? "text-red-500" : "text-gray-500"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <span className="text-xs text-blue-600 font-medium">{q.skillType}</span>
        <p className="font-semibold text-gray-800">{q.questionData.text}</p>

        {q.questionType === "MCQ" && q.questionData.options ? (
          <div className="space-y-2">
            {q.questionData.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => { if (!showExplanation) setAnswers((a) => ({ ...a, [q.questionId]: opt })); }}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  answers[q.questionId] === opt
                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm"
                    : "border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50/40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : q.questionType === "TRUE_FALSE" ? (
          <div className="flex gap-3">
            {["True", "False"].map((opt) => (
              <button
                key={opt}
                onClick={() => { if (!showExplanation) setAnswers((a) => ({ ...a, [q.questionId]: opt })); }}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  answers[q.questionId] === opt ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 hover:border-blue-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={answers[q.questionId] ?? ""}
            onChange={(e) => setAnswers((a) => ({ ...a, [q.questionId]: e.target.value }))}
            placeholder="พิมพ์คำตอบ..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        )}

        {answered && q.explanationTh && (
          <div>
            <button onClick={() => setShowExplanation((s) => !s)} className="text-xs text-blue-500 underline">
              {showExplanation ? "ซ่อนคำอธิบาย" : "ดูคำอธิบาย"}
            </button>
            {showExplanation && (
              <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{q.explanationTh}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {qIdx > 0 && (
          <button
            onClick={() => { setQIdx((i) => i - 1); setShowExplanation(false); }}
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            ← ก่อนหน้า
          </button>
        )}
        {qIdx < allQuestions.length - 1 ? (
          <button
            onClick={() => { setQIdx((i) => i + 1); setShowExplanation(false); }}
            disabled={!answered}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
          >
            ถัดไป →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < allQuestions.length}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
          >
            {submitting ? "กำลังส่ง..." : "ส่งข้อสอบ"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {allQuestions.map((qq, i) => (
          <button
            key={qq.questionId}
            onClick={() => { setQIdx(i); setShowExplanation(false); }}
            className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
              i === qIdx ? "bg-blue-600 text-white" : answers[qq.questionId] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
