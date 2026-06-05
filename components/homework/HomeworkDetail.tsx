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
  const [azRound, setAzRound] = useState(false);
  const [letterPractice, setLetterPractice] = useState(false);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const maxAttempts = assignment.homework.maxAttempts ?? 3;
  const attemptsUsed = assignment.submissions.length;
  const canSubmit = assignment.status !== "COMPLETED" && attemptsUsed < maxAttempts;
  const latestSub = assignment.submissions[0];
  const isStarterAlphabetHomework =
    assignment.homework.nameTh.includes("A-Z") ||
    assignment.homework.descriptionTh?.includes("A-Z") ||
    assignment.homework.lesson?.nameTh.includes("A-Z") ||
    assignment.homework.lesson?.nameTh.includes("ตัวอักษร");
  const displayDescription = isStarterAlphabetHomework
    ? "Starter แบบง่าย: ท่อง A-Z 1 รอบ ชี้ตัวพิมพ์ใหญ่/เล็ก แล้วเลือกคำศัพท์ที่จำได้อย่างน้อย 3 คำ ไม่ต้องเขียนยาว"
    : assignment.homework.descriptionTh;
  const starterWords = ["apple", "book", "cat", "dog", "egg", "fish", "hat", "sun"];

  function toggleWord(word: string) {
    setSelectedWords((prev) => prev.includes(word) ? prev.filter((item) => item !== word) : [...prev, word]);
  }

  async function handleSubmit() {
    if (!text.trim()) { setError("กรุณาเขียนคำตอบ"); return; }
    await submitText(text);
  }

  async function handleStarterSubmit() {
    if (!azRound || !letterPractice || selectedWords.length < 3) {
      setError("ทำให้ครบ 3 ขั้นก่อนส่ง: ท่อง A-Z, ฝึก A/a-Z/z, และเลือกคำศัพท์อย่างน้อย 3 คำ");
      return;
    }
    await submitText([
      "Starter A-Z homework",
      "ท่อง A-Z แล้ว 1 รอบ",
      "ฝึกดูตัวพิมพ์ใหญ่/ตัวพิมพ์เล็กแล้ว",
      `คำศัพท์ที่เลือกท่อง: ${selectedWords.join(", ")}`,
    ].join("\n"));
  }

  async function submitText(submissionText: string) {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/homework/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionText }),
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
        {displayDescription && (
          <p className="text-sm text-gray-600">{displayDescription}</p>
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
        isStarterAlphabetHomework ? (
          <div className="bg-white rounded-xl border p-4 space-y-4">
            <div>
              <p className="font-semibold text-gray-800">การบ้าน Starter แบบง่าย</p>
              <p className="mt-1 text-sm text-gray-500">ไม่ต้องเขียนยาว ให้เด็กทำทีละขั้นแล้วกดส่งได้เลย</p>
            </div>

            <label className={`flex items-start gap-3 rounded-lg border-2 p-3 ${azRound ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}>
              <input type="checkbox" checked={azRound} onChange={(e) => setAzRound(e.target.checked)} className="mt-1 size-5" />
              <span>
                <span className="block font-medium text-gray-800">1. ท่อง A-Z 1 รอบ</span>
                <span className="text-sm text-gray-500">พูดตาม Chart จาก A ถึง Z ช้า ๆ</span>
              </span>
            </label>

            <label className={`flex items-start gap-3 rounded-lg border-2 p-3 ${letterPractice ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}>
              <input type="checkbox" checked={letterPractice} onChange={(e) => setLetterPractice(e.target.checked)} className="mt-1 size-5" />
              <span>
                <span className="block font-medium text-gray-800">2. ชี้ตัวพิมพ์ใหญ่/เล็ก</span>
                <span className="text-sm text-gray-500">เช่น A/a, B/b, C/c ไม่ต้องจำคำศัพท์ทุกคำในครั้งเดียว</span>
              </span>
            </label>

            <div className="rounded-lg border-2 border-gray-200 p-3">
              <p className="font-medium text-gray-800">3. เลือกคำศัพท์ที่ท่องได้อย่างน้อย 3 คำ</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {starterWords.map((word) => {
                  const active = selectedWords.includes(word);
                  return (
                    <button
                      key={word}
                      type="button"
                      onClick={() => toggleWord(word)}
                      className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"}`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-400">เลือกแล้ว {selectedWords.length}/3 คำ</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={handleStarterSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "กำลังส่ง..." : "ส่งการบ้าน Starter"}
            </button>
          </div>
        ) : (
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
        )
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
