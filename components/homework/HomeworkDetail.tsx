"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  attemptNumber: number;
  submittedAt: string;
  feedback: { feedbackText: string | null; score: number | null } | null;
}

interface Assignment {
  id: string;
  status: string;
  dueDate: string | null;
  homework: {
    nameTh: string;
    descriptionTh: string | null;
    skillType: string;
    maxScore: number;
    maxAttempts: number | null;
    lesson: { id: string; nameTh: string } | null;
  };
  submissions: Submission[];
}

const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  LATE: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังทำ",
  COMPLETED: "เสร็จแล้ว",
  LATE: "เกินกำหนด",
};

export default function HomeworkDetail({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const maxAttempts = assignment.homework.maxAttempts ?? 3;
  const attemptsUsed = assignment.submissions.length;
  const canSubmit = assignment.status !== "COMPLETED" && attemptsUsed < maxAttempts;
  const latestSub = assignment.submissions[0];

  async function handleSubmit() {
    if (!text.trim()) { setError("กรุณาเขียนคำตอบ"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/homework/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionText: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
      setSubmitted(true);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center space-y-4">
        <p className="text-4xl">📬</p>
        <h2 className="text-xl font-bold text-gray-800">ส่งการบ้านแล้ว!</h2>
        <p className="text-sm text-gray-400">ครูจะตรวจและให้คะแนนเร็วๆ นี้</p>
        <button
          onClick={() => router.push("/homework")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          กลับรายการการบ้าน
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="bg-white rounded-xl border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[assignment.status]}`}>
            {STATUS_LABEL[assignment.status]}
          </span>
          <span className="text-xs text-gray-400">{assignment.homework.skillType}</span>
        </div>
        {assignment.homework.descriptionTh && (
          <p className="text-sm text-gray-600">{assignment.homework.descriptionTh}</p>
        )}
        <div className="flex gap-4 text-xs text-gray-400">
          <span>คะแนนเต็ม {assignment.homework.maxScore}</span>
          <span>ส่งได้ {maxAttempts} ครั้ง (ใช้ไป {attemptsUsed} ครั้ง)</span>
          {assignment.dueDate && (
            <span>
              ครบกำหนด{" "}
              {new Date(assignment.dueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
        {assignment.homework.lesson && (
          <p className="text-xs text-gray-400">บทเรียน: {assignment.homework.lesson.nameTh}</p>
        )}
      </div>

      {/* Latest feedback */}
      {latestSub?.feedback && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800">
            Feedback (ครั้งที่ {latestSub.attemptNumber})
            {latestSub.feedback.score != null && ` — ${latestSub.feedback.score}/${assignment.homework.maxScore} คะแนน`}
          </p>
          {latestSub.feedback.feedbackText && (
            <p className="text-sm text-blue-700 mt-1">{latestSub.feedback.feedbackText}</p>
          )}
        </div>
      )}

      {/* Submit form */}
      {canSubmit ? (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <p className="font-medium text-gray-800">เขียนคำตอบ / ส่งงาน</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="พิมพ์คำตอบหรือคำอธิบายงานที่ทำ..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {submitting ? "กำลังส่ง..." : "ส่งการบ้าน"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-500 text-sm">
            {assignment.status === "COMPLETED"
              ? "ส่งการบ้านแล้ว รอครูตรวจ"
              : "ใช้จำนวนครั้งที่อนุญาตแล้ว"}
          </p>
        </div>
      )}

      {/* Submission history */}
      {assignment.submissions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">ประวัติการส่ง</p>
          {assignment.submissions.map((s) => (
            <div key={s.id} className="bg-white rounded-lg border p-3 text-xs text-gray-500">
              ครั้งที่ {s.attemptNumber} — {new Date(s.submittedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              {s.feedback?.score != null && <span className="ml-2 text-green-600 font-medium">{s.feedback.score} คะแนน</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
