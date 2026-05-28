"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  type: "MCQ" | "FILL_BLANK" | "TRUE_FALSE";
  skill: string;
  level: string;
  question: string;
  options?: string[];
  points: number;
}

const SKILL_LABEL: Record<string, string> = {
  VOCABULARY: "คำศัพท์",
  GRAMMAR: "ไวยากรณ์",
  READING: "การอ่าน",
};

export default function PlacementTest() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fillInput, setFillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/placement-test")
      .then((r) => r.json())
      .then((d) => { setQuestions(d.questions); setLoading(false); });
  }, []);

  const q = questions[current];
  const progress = questions.length > 0 ? ((current) / questions.length) * 100 : 0;

  const answer = useCallback((value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setFillInput("");
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent((c) => c + 1), 300);
    }
  }, [q, current, questions.length]);

  async function handleSubmit() {
    const finalAnswers = { ...answers };
    if (q && fillInput) finalAnswers[q.id] = fillInput;

    setSubmitting(true);
    const res = await fetch("/api/placement-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: finalAnswers }),
    });
    if (res.ok) {
      router.push("/placement-test/result");
      router.refresh();
    }
  }

  const isLastQuestion = current === questions.length - 1;
  const currentAnswer = q ? answers[q.id] : undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">กำลังโหลดข้อสอบ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              ข้อ {current + 1} / {questions.length}
            </span>
            <Badge variant="secondary">{q ? SKILL_LABEL[q.skill] : ""}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {q && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
              {q.question}
            </h2>

            {/* MCQ */}
            {q.type === "MCQ" && q.options && (
              <div className="space-y-3">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => answer(opt)}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium ${
                      currentAnswer === opt
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* TRUE/FALSE */}
            {q.type === "TRUE_FALSE" && (
              <div className="flex gap-4">
                {["True", "False"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => answer(opt)}
                    className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${
                      currentAnswer === opt
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    {opt === "True" ? "✓ True (ถูก)" : "✗ False (ผิด)"}
                  </button>
                ))}
              </div>
            )}

            {/* FILL_BLANK */}
            {q.type === "FILL_BLANK" && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && fillInput.trim()) {
                      answer(fillInput.trim());
                    }
                  }}
                  placeholder="พิมพ์คำตอบ..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                  autoFocus
                />
                <Button
                  onClick={() => fillInput.trim() && answer(fillInput.trim())}
                  disabled={!fillInput.trim()}
                  className="w-full"
                >
                  {isLastQuestion ? "ส่งข้อสุดท้าย" : "ถัดไป →"}
                </Button>
              </div>
            )}

            {/* Navigation for non-fill-blank */}
            {q.type !== "FILL_BLANK" && isLastQuestion && currentAnswer && (
              <div className="mt-6">
                <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
                  {submitting ? "กำลังประมวลผล..." : "ส่งแบบทดสอบ"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
