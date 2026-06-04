"use client";

import { useState } from "react";

type ContentBlock = {
  id: string;
  contentType: string;
  data: Record<string, unknown>;
  orderNum: number;
};

export default function ContentRenderer({ block }: { block: ContentBlock }) {
  switch (block.contentType) {
    case "TEXT":
      return <TextBlock data={block.data} />;
    case "FLASHCARD":
      return <FlashcardBlock data={block.data} />;
    case "CONVERSATION":
      return <ConversationBlock data={block.data} />;
    case "EXERCISE":
      return <ExerciseBlock data={block.data} />;
    case "AUDIO":
      return <AudioBlock data={block.data} />;
    case "IMAGE":
      return <ImageBlock data={block.data} />;
    default:
      return null;
  }
}

// ── TEXT ─────────────────────────────────────────────────────────────────────

function TextBlock({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string | undefined;
  const body = (data.body as string) ?? "";

  return (
    <div className="bg-white rounded-xl border p-6">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>}
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  );
}

// ── FLASHCARD ────────────────────────────────────────────────────────────────

interface FlashCard {
  front: string;
  back: string;
  pronunciation?: string;
  exampleWord?: string;
}

function FlashcardBlock({ data }: { data: Record<string, unknown> }) {
  const cards = (data.cards as FlashCard[]) ?? [];
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const card = cards[idx];

  function next() {
    setFlipped(false);
    setIdx((i) => (i + 1) % cards.length);
  }

  function prev() {
    setFlipped(false);
    setIdx((i) => (i - 1 + cards.length) % cards.length);
  }

  function markKnown() {
    setKnown((prev) => new Set(prev).add(idx));
    next();
  }

  if (!card) return null;

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">Flashcards</h3>
        <span className="text-sm text-gray-400">{idx + 1} / {cards.length}</span>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped((f) => !f)}
        className={`cursor-pointer rounded-xl border-2 p-8 text-center min-h-[140px] flex flex-col items-center justify-center transition-all select-none ${
          known.has(idx)
            ? "border-green-300 bg-green-50"
            : flipped
            ? "border-blue-300 bg-blue-50"
            : "border-gray-200 bg-gray-50 hover:border-blue-200"
        }`}
      >
        {flipped ? (
          <>
            <p className="text-2xl font-bold text-gray-800">{card.back}</p>
            {card.pronunciation && (
              <p className="text-sm text-blue-500 mt-1">อ่านว่า: {card.pronunciation}</p>
            )}
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-800">{card.front}</p>
            <p className="text-sm text-gray-400 mt-2">แตะเพื่อดูคำตอบ</p>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={prev}
          className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
        >
          ← ก่อนหน้า
        </button>
        {flipped && (
          <button
            onClick={markKnown}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
          >
            จำได้ ✓
          </button>
        )}
        <button
          onClick={next}
          className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
        >
          ถัดไป →
        </button>
      </div>

      {known.size > 0 && (
        <p className="text-center text-sm text-green-600 mt-2">จำได้แล้ว {known.size}/{cards.length} คำ</p>
      )}
    </div>
  );
}

// ── CONVERSATION ─────────────────────────────────────────────────────────────

interface ConversationLine {
  speaker: string;
  text: string;
  translationTh: string;
}

function ConversationBlock({ data }: { data: Record<string, unknown> }) {
  const lines = (data.lines as ConversationLine[]) ?? [];
  const [showTranslation, setShowTranslation] = useState(true);

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">บทสนทนา</h3>
        <button
          onClick={() => setShowTranslation((v) => !v)}
          className="text-xs text-blue-600 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-50"
        >
          {showTranslation ? "ซ่อนคำแปล" : "แสดงคำแปล"}
        </button>
      </div>
      <div className="space-y-4">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
              {line.speaker[0]}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1 font-medium">{line.speaker}</p>
              <p className="text-gray-800 font-medium">{line.text}</p>
              {showTranslation && (
                <p className="text-sm text-gray-500 mt-0.5">{line.translationTh}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EXERCISE ─────────────────────────────────────────────────────────────────

interface ExerciseQuestion {
  sentence: string;
  answer: string;
  hint?: string;
}

function ExerciseBlock({ data }: { data: Record<string, unknown> }) {
  const instruction = data.instruction as string | undefined;
  const questions = (data.questions as ExerciseQuestion[]) ?? [];
  const [userAnswers, setUserAnswers] = useState<string[]>(questions.map(() => ""));
  const [checked, setChecked] = useState(false);

  function check() {
    setChecked(true);
  }

  function isCorrect(idx: number) {
    return userAnswers[idx].trim().toLowerCase() === questions[idx].answer.toLowerCase();
  }

  const score = checked ? questions.filter((_, i) => isCorrect(i)).length : 0;

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold text-gray-700 mb-1">แบบฝึกหัด</h3>
      {instruction && <p className="text-sm text-gray-500 mb-4">{instruction}</p>}

      <div className="space-y-4">
        {questions.map((q, i) => {
          const parts = q.sentence.split("_____");
          return (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                <span className="text-gray-700 leading-7">{parts[0]}</span>
                <input
                  type="text"
                  value={userAnswers[i]}
                  onChange={(e) => {
                    const a = [...userAnswers];
                    a[i] = e.target.value;
                    setUserAnswers(a);
                  }}
                  disabled={checked}
                  placeholder="พิมพ์คำตอบ"
                  className={`min-h-10 w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 shadow-sm transition-colors focus:outline-none sm:w-44 ${
                    checked
                      ? isCorrect(i)
                        ? "border-green-500 text-green-700"
                        : "border-red-400 text-red-600"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                {parts[1] && <span className="text-gray-700 leading-7">{parts[1]}</span>}
              </div>
              {q.hint && !checked && (
                <p className="mt-2 text-xs text-gray-400">คำใบ้: {q.hint}</p>
              )}
              {checked && !isCorrect(i) && (
                <span className="mt-2 inline-flex text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                  เฉลย: {q.answer}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!checked ? (
        <button
          onClick={check}
          disabled={userAnswers.some((a) => !a.trim())}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          ตรวจคำตอบ
        </button>
      ) : (
        <p className={`mt-4 text-sm font-medium ${score === questions.length ? "text-green-600" : "text-orange-500"}`}>
          ✓ {score}/{questions.length} ข้อถูก
        </p>
      )}
    </div>
  );
}

// ── AUDIO ────────────────────────────────────────────────────────────────────

function AudioBlock({ data }: { data: Record<string, unknown> }) {
  const url = data.url as string | undefined;
  const label = data.label as string | undefined;
  if (!url) return null;
  return (
    <div className="bg-white rounded-xl border p-4">
      {label && <p className="text-sm text-gray-600 mb-2">{label}</p>}
      <audio controls src={url} className="w-full" />
    </div>
  );
}

// ── IMAGE ─────────────────────────────────────────────────────────────────────

function ImageBlock({ data }: { data: Record<string, unknown> }) {
  const url = data.url as string | undefined;
  const alt = (data.alt as string) ?? "";
  if (!url) return null;
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="w-full object-cover" />
      {alt && <p className="text-xs text-gray-400 text-center py-2">{alt}</p>}
    </div>
  );
}
