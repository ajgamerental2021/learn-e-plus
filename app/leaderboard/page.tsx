"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BoardEntry {
  rank: number;
  userId: string;
  displayName: string;
  lessonsThisWeek: number;
  streak: number;
  isMe: boolean;
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<BoardEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; lessonsThisWeek: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { setBoard(d.board ?? []); setMyRank(d.myRank); setLoading(false); });
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">← กลับ</Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">🏆 Leaderboard</h1>
      </div>
      <p className="text-sm text-gray-400">อันดับบทเรียนสัปดาห์นี้</p>

      {loading ? (
        <div className="text-center py-10 text-gray-400 animate-pulse">กำลังโหลด...</div>
      ) : board.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-8 text-center">
          <p className="text-gray-400">ยังไม่มีข้อมูลสัปดาห์นี้ — เริ่มเรียนได้เลย!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 overflow-hidden">
          {board.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 px-4 py-3 border-b dark:border-gray-700 last:border-0 ${
                entry.isMe ? "bg-blue-50 dark:bg-blue-950" : ""
              }`}
            >
              <div className="w-8 text-center font-bold text-gray-500 dark:text-gray-400">
                {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${entry.isMe ? "text-blue-700 dark:text-blue-400" : "text-gray-800 dark:text-gray-100"}`}>
                  {entry.displayName}{entry.isMe && " (คุณ)"}
                </p>
                <p className="text-xs text-gray-400">{entry.lessonsThisWeek} บทเรียน · streak {entry.streak} วัน</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {myRank && (
        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          อันดับของคุณ: <strong>#{myRank.rank}</strong> · {myRank.lessonsThisWeek} บทเรียนสัปดาห์นี้
        </div>
      )}
    </div>
  );
}
