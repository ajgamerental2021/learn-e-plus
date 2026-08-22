"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playTextToSpeech } from "@/lib/client-tts";

type ReactionCount = {
  emoji: string;
  count: number;
};

const REACTIONS = ["👍", "❤️", "⭐", "👏"];

export default function DailyVocabularySubmissionActions({
  assignmentId,
  word,
  initialCounts,
  initialReaction,
}: {
  assignmentId: string;
  word: string;
  initialCounts: ReactionCount[];
  initialReaction: string | null;
}) {
  const [counts, setCounts] = useState(initialCounts);
  const [myReaction, setMyReaction] = useState(initialReaction);
  const [savingEmoji, setSavingEmoji] = useState("");

  function listenWord() {
    void playTextToSpeech(word, { lang: "en-US" });
  }

  async function react(emoji: string) {
    setSavingEmoji(emoji);
    const res = await fetch(`/api/daily-vocabulary/${assignmentId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setMyReaction(data.myReaction ?? emoji);
      setCounts(data.counts ?? counts);
    }
    setSavingEmoji("");
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" onClick={listenWord} className="bg-blue-600 text-white hover:bg-blue-700">
        <Volume2 className="size-4" />
        ฟังเสียงคำศัพท์
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        {REACTIONS.map((emoji) => {
          const count = counts.find((item) => item.emoji === emoji)?.count ?? 0;
          const selected = myReaction === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => react(emoji)}
              disabled={savingEmoji === emoji}
              className={`h-10 rounded-full border px-3 text-sm font-semibold transition-colors ${
                selected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
              aria-label={`ส่ง ${emoji}`}
            >
              <span className="mr-1">{emoji}</span>
              {count > 0 ? count : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
