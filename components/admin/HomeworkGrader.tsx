"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  submissionId: string;
  maxScore: number;
  existingFeedback: { feedbackText: string; score: number | null } | null;
}

export default function HomeworkGrader({ submissionId, maxScore, existingFeedback }: Props) {
  const router = useRouter();
  const [feedbackText, setFeedbackText] = useState(existingFeedback?.feedbackText ?? "");
  const [score, setScore] = useState<number | "">(existingFeedback?.score ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/homework/${submissionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackText, score: score !== "" ? Number(score) : undefined }),
    });
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <h3 className="font-semibold text-gray-700">ให้คะแนน + Feedback</h3>

      {existingFeedback && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-700">
          ✓ ตรวจแล้ว — {existingFeedback.score !== null ? `${existingFeedback.score}/${maxScore} คะแนน` : "ยังไม่ได้ให้คะแนน"}
        </div>
      )}

      <div>
        <label className="text-xs text-gray-500 mb-1 block">คะแนน (จาก {maxScore})</label>
        <input
          type="number"
          min={0}
          max={maxScore}
          value={score}
          onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          placeholder={`0–${maxScore}`}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Feedback (ส่งให้นักเรียน)</label>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          rows={4}
          placeholder="เขียน feedback..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {saved ? "✓ บันทึกแล้ว" : saving ? "กำลังบันทึก..." : "บันทึก Feedback"}
      </button>
    </div>
  );
}
