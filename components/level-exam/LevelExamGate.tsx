"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Check {
  label: string;
  value: number;
  required: number;
  ok: boolean;
  unit: string;
}

interface EligibilityData {
  eligible: boolean;
  reason?: string;
  cooldownEnd?: string;
  checks: Check[];
  alreadyPassed: boolean;
  setting: { minLevelExamScore: number } | null;
}

interface Props {
  currentLevel: { code: string; nameTh: string };
  nextLevel: { code: string; nameTh: string } | null;
  examTest: { id: string; nameTh: string; durationMins: number | null; passingScore: number } | null;
  setting: { minLevelExamScore: number } | null;
}

export default function LevelExamGate({ currentLevel, nextLevel, examTest, setting }: Props) {
  const router = useRouter();
  const [data, setData] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/level-exam/eligibility")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center">
        <p className="text-gray-400 animate-pulse">กำลังตรวจสอบคุณสมบัติ...</p>
      </div>
    );
  }

  if (data?.alreadyPassed) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center space-y-4">
        <p className="text-4xl">🏆</p>
        <h2 className="text-xl font-bold text-gray-800">ผ่านการสอบเลื่อนระดับแล้ว</h2>
        <p className="text-sm text-gray-500">คุณได้เลื่อนระดับสำเร็จจาก {currentLevel.nameTh} แล้ว</p>
        <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current → Next level */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white text-center">
        <p className="text-sm opacity-80 mb-2">สอบเลื่อนระดับ</p>
        <div className="flex items-center justify-center gap-4 text-xl font-bold">
          <span>{currentLevel.nameTh}</span>
          <span className="opacity-60">→</span>
          <span>{nextLevel?.nameTh ?? "?"}</span>
        </div>
        {setting && (
          <p className="text-sm opacity-70 mt-2">ต้องได้ {setting.minLevelExamScore}% ขึ้นไปเพื่อผ่าน</p>
        )}
      </div>

      {/* Eligibility checks */}
      {data?.checks && data.checks.length > 0 && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">คุณสมบัติที่ต้องผ่าน</h2>
          {data.checks.map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={c.ok ? "text-green-500" : "text-red-400"}>{c.ok ? "✓" : "✗"}</span>
                <span className="text-sm text-gray-700">{c.label}</span>
              </div>
              <span className={`text-sm font-medium ${c.ok ? "text-green-600" : "text-red-500"}`}>
                {c.value}{c.unit} / {c.required}{c.unit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cooldown notice */}
      {!data?.eligible && data?.cooldownEnd && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-sm text-orange-700 font-medium">⏱ {data.reason}</p>
          <p className="text-xs text-orange-500 mt-1">
            สอบได้อีกครั้งหลัง {new Date(data.cooldownEnd).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
          </p>
        </div>
      )}

      {/* Not eligible reason */}
      {!data?.eligible && !data?.cooldownEnd && data?.reason && (
        <div className="bg-gray-50 border rounded-xl p-4">
          <p className="text-sm text-gray-600">{data.reason}</p>
        </div>
      )}

      {/* CTA */}
      {data?.eligible && examTest ? (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">พร้อมสอบแล้ว!</h2>
          <p className="text-sm text-gray-500">
            {examTest.nameTh}
            {examTest.durationMins ? ` · ${examTest.durationMins} นาที` : ""}
          </p>
          <Link
            href={`/tests/${examTest.id}`}
            className="block w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-center font-semibold text-sm"
          >
            เริ่มสอบเลื่อนระดับ
          </Link>
        </div>
      ) : data?.eligible && !examTest ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <p className="text-sm text-yellow-700">ยังไม่มีข้อสอบสำหรับระดับนี้ กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      ) : null}

      {!data?.eligible && (
        <div className="flex gap-3">
          <Link href="/learn" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm text-center">
            ไปเรียนต่อ
          </Link>
          <Link href="/dashboard" className="flex-1 py-2.5 border rounded-xl text-sm text-center text-gray-600">
            กลับหน้าหลัก
          </Link>
        </div>
      )}
    </div>
  );
}
