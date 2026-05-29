"use client";

import { useEffect, useState } from "react";

interface Challenge {
  id: string;
  word: string;
  translationTh: string;
  pronunciationTh: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
}

export default function DailyChallenge() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completed, setCompleted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily-challenge")
      .then((r) => r.json())
      .then((d) => {
        setChallenge(d.challenge);
        setCompleted(d.completedToday);
        setLoading(false);
      });
  }, []);

  async function markDone() {
    await fetch("/api/daily-challenge", { method: "POST" });
    setCompleted(true);
  }

  if (loading) return null;
  if (!challenge) return null;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${completed ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800"}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
          {completed ? "✅ Daily Challenge วันนี้เสร็จแล้ว!" : "⚡ Daily Challenge"}
        </h3>
        {!completed && <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">คำวันนี้</span>}
      </div>

      <div
        onClick={() => !completed && setRevealed(true)}
        className={`rounded-lg p-4 text-center cursor-pointer transition-all ${
          revealed || completed
            ? "bg-white dark:bg-gray-900"
            : "bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800"
        }`}
      >
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{challenge.word}</p>
        {challenge.pronunciationTh && (
          <p className="text-xs text-gray-400 mt-0.5">({challenge.pronunciationTh})</p>
        )}
        {revealed || completed ? (
          <div className="mt-2">
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">{challenge.translationTh}</p>
            {challenge.exampleSentence && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">&ldquo;{challenge.exampleSentence}&rdquo;</p>
            )}
            {challenge.exampleTranslation && (
              <p className="text-xs text-gray-400 mt-0.5">{challenge.exampleTranslation}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">แตะเพื่อดูความหมาย</p>
        )}
      </div>

      {revealed && !completed && (
        <button
          onClick={markDone}
          className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          จำได้แล้ว ✓
        </button>
      )}
    </div>
  );
}
