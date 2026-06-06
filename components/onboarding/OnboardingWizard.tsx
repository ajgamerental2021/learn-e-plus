"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AGE_GROUPS, DAILY_GOAL_OPTIONS, LEARNING_PATHS } from "@/lib/constants";

type Step = 1 | 2 | 3 | 4;

interface FormData {
  ageGroup: string;
  learningPathCode: string;
  dailyGoalMinutes: number;
  examTarget: string;
  startFromPlacement: boolean | null;
}

const INITIAL: FormData = {
  ageGroup: "",
  learningPathCode: "",
  dailyGoalMinutes: 15,
  examTarget: "",
  startFromPlacement: null,
};

export default function OnboardingWizard({ displayName }: { displayName: string }) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof FormData, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function finish(startFromPlacement: boolean) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startFromPlacement }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่");
        return;
      }

      window.location.replace(data.redirectTo);
    } catch {
      setError("เชื่อมต่อระบบไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${s <= step ? "bg-blue-600" : "bg-gray-200"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>สวัสดี {displayName}! 👋</CardTitle>
              <CardDescription>บอกเราหน่อยว่าคุณอยู่ในช่วงวัยไหน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {AGE_GROUPS.map((ag) => (
                <button
                  key={ag.code}
                  onClick={() => { update("ageGroup", ag.code); setStep(2); }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors hover:border-blue-400 hover:bg-blue-50 ${form.ageGroup === ag.code ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
                >
                  {ag.label}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>เป้าหมายการเรียน</CardTitle>
              <CardDescription>คุณต้องการเรียนภาษาอังกฤษเพื่ออะไร?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {LEARNING_PATHS.map((lp) => (
                <button
                  key={lp.code}
                  onClick={() => { update("learningPathCode", lp.code); setStep(3); }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors hover:border-blue-400 hover:bg-blue-50 ${form.learningPathCode === lp.code ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
                >
                  {lp.nameTh}
                </button>
              ))}
              <Button variant="outline" className="w-full mt-2" onClick={() => setStep(1)}>
                ย้อนกลับ
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>เป้าหมายรายวัน</CardTitle>
              <CardDescription>คุณต้องการเรียนวันละกี่นาที?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAILY_GOAL_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => { update("dailyGoalMinutes", mins); setStep(4); }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors hover:border-blue-400 hover:bg-blue-50 ${form.dailyGoalMinutes === mins ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
                >
                  <span className="font-semibold text-blue-700">{mins} นาที</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {mins === 5 && "— แค่เริ่มต้น"}
                    {mins === 10 && "— เหมาะสำหรับคนยุ่ง"}
                    {mins === 15 && "— แนะนำ"}
                    {mins === 30 && "— เรียนเยอะพัฒนาเร็ว"}
                  </span>
                </button>
              ))}
              <Button variant="outline" className="w-full mt-2" onClick={() => setStep(2)}>
                ย้อนกลับ
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>เริ่มต้นอย่างไรดี?</CardTitle>
              <CardDescription>เลือกวิธีเริ่มต้นการเรียนของคุณ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <button
                onClick={() => !loading && finish(true)}
                disabled={loading}
                className="w-full text-left px-4 py-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold">ทำแบบทดสอบวัดระดับก่อน</div>
                <div className="text-sm text-gray-500 mt-1">ใช้เวลาประมาณ 15-20 นาที ระบบจะแนะนำระดับที่เหมาะกับคุณ</div>
              </button>
              <button
                onClick={() => !loading && finish(false)}
                disabled={loading}
                className="w-full text-left px-4 py-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold">เริ่มจากพื้นฐาน (Pre-A1)</div>
                <div className="text-sm text-gray-500 mt-1">เหมาะสำหรับผู้ที่ยังไม่มีพื้นฐานหรือต้องการทบทวนตั้งแต่ต้น</div>
              </button>
              <Button variant="outline" className="w-full" onClick={() => setStep(3)}>
                ย้อนกลับ
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
