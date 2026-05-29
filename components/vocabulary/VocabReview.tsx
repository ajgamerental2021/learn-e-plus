"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

interface VocabCard {
  vocabularyId: string;
  vocabulary: {
    id: string;
    word: string;
    translationTh: string;
    pronunciationTh?: string | null;
    partOfSpeech: string;
    exampleSentence?: string | null;
    exampleTranslation?: string | null;
    audioUrl?: string | null;
  };
  status: string;
  correctCount: number;
  incorrectCount: number;
}

export default function VocabReview() {
  const router = useRouter();
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    fetch("/api/vocabulary/review?limit=20")
      .then((r) => r.json())
      .then((d) => { setCards(d.cards ?? []); setLoading(false); });
  }, []);

  const card = cards[idx];
  const progress = cards.length > 0 ? (idx / cards.length) * 100 : 0;

  async function answer(wasCorrect: boolean) {
    const vocabId = card.vocabularyId || card.vocabulary.id;
    await fetch(`/api/vocabulary/${vocabId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wasCorrect }),
    });

    setStats((s) => ({
      correct: wasCorrect ? s.correct + 1 : s.correct,
      incorrect: wasCorrect ? s.incorrect : s.incorrect + 1,
    }));

    if (idx < cards.length - 1) {
      setFlipped(false);
      setIdx((i) => i + 1);
    } else {
      setDone(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">กำลังโหลดคำศัพท์...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <p className="font-semibold text-gray-700">ไม่มีคำที่ต้องทบทวนตอนนี้</p>
        <p className="text-sm text-gray-400 mt-1">กลับมาใหม่ภายหลังเพื่อทบทวนคำที่ถึงกำหนด</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center space-y-4">
        <p className="text-4xl">✅</p>
        <h2 className="text-xl font-bold text-gray-800">ทบทวนเสร็จแล้ว!</h2>
        <div className="flex gap-6 justify-center text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
            <p className="text-gray-400">จำได้</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.incorrect}</p>
            <p className="text-gray-400">ยังไม่จำ</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setIdx(0); setFlipped(false); setDone(false); setStats({ correct: 0, incorrect: 0 }); }}
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            ทบทวนอีกรอบ
          </button>
          <button
            onClick={() => router.push("/vocabulary")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            กลับหน้าคำศัพท์
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1 h-2" />
        <span className="text-sm text-gray-400 shrink-0">{idx + 1}/{cards.length}</span>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped((f) => !f)}
        className={`cursor-pointer rounded-2xl border-2 p-8 text-center min-h-[220px] flex flex-col items-center justify-center gap-3 transition-all select-none ${
          flipped ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-200"
        }`}
      >
        {!flipped ? (
          <>
            <p className="text-3xl font-bold text-gray-800">{card.vocabulary.word}</p>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{card.vocabulary.partOfSpeech}</span>
            <p className="text-sm text-gray-400 mt-2">แตะเพื่อดูความหมาย</p>
          </>
        ) : (
          <>
            <p className="text-3xl font-bold text-gray-800">{card.vocabulary.word}</p>
            {card.vocabulary.pronunciationTh && (
              <p className="text-sm text-gray-500">อ่านว่า: <span className="text-blue-600 font-medium">{card.vocabulary.pronunciationTh}</span></p>
            )}
            <p className="text-xl text-blue-700 font-semibold">{card.vocabulary.translationTh}</p>
            {card.vocabulary.exampleSentence && (
              <div className="mt-2 text-center border-t pt-3 w-full">
                <p className="text-sm text-gray-600 italic">&ldquo;{card.vocabulary.exampleSentence}&rdquo;</p>
                {card.vocabulary.exampleTranslation && (
                  <p className="text-xs text-gray-400 mt-1">{card.vocabulary.exampleTranslation}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Answer buttons (show after flip) */}
      {flipped && (
        <div className="flex gap-3">
          <button
            onClick={() => answer(false)}
            className="flex-1 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition-colors"
          >
            ❌ ยังจำไม่ได้
          </button>
          <button
            onClick={() => answer(true)}
            className="flex-1 py-3 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 font-semibold text-sm hover:bg-green-100 transition-colors"
          >
            ✓ จำได้แล้ว
          </button>
        </div>
      )}
    </div>
  );
}
