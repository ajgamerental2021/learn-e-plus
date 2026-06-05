"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DailyAssignment = {
  id: string;
  assignedDate: string;
  status: string;
  spellingText?: string | null;
  spokenText?: string | null;
  audioDataUrl?: string | null;
  submittedAt?: string | null;
  vocabulary: Vocab;
};

type Vocab = {
  id: string;
  word: string;
  translationTh: string;
  pronunciationTh?: string | null;
  exampleSentence?: string | null;
  exampleTranslation?: string | null;
  cefrLevel: string;
};

export default function DailyVocabularyPractice({
  today,
  history,
}: {
  today: DailyAssignment | null;
  history: DailyAssignment[];
}) {
  const router = useRouter();
  const [spellingText, setSpellingText] = useState(today?.spellingText ?? "");
  const [spokenText, setSpokenText] = useState(today?.spokenText ?? today?.vocabulary.word ?? "");
  const [audioDataUrl, setAudioDataUrl] = useState(today?.audioDataUrl ?? "");
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const completedToday = today?.status === "COMPLETED";
  const expectedSpelling = useMemo(() => today?.vocabulary.word.replace(/\s+/g, "").toLowerCase() ?? "", [today]);
  const typedSpelling = spellingText.replace(/\s+/g, "").toLowerCase();

  function speakWord() {
    if (!today || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(today.vocabulary.word);
    utterance.lang = "en-US";
    utterance.rate = 0.75;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  async function startRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("อุปกรณ์นี้ยังไม่รองรับการบันทึกเสียงในเบราว์เซอร์");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => setAudioDataUrl(String(reader.result));
      reader.readAsDataURL(blob);
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function submit() {
    if (!today) return;
    if (!spellingText.trim()) {
      setError("กรุณาพิมพ์สะกดคำก่อนส่ง");
      return;
    }
    if (!audioDataUrl) {
      setError("กรุณาบันทึกเสียงพูดคำศัพท์และสะกดคำก่อนส่ง");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/daily-vocabulary/${today.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spokenText,
          spellingText,
          audioDataUrl,
          audioMimeType: audioDataUrl.slice(5, audioDataUrl.indexOf(";")),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "ส่งการบ้านไม่สำเร็จ");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (!today) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <p className="font-semibold text-gray-800">ยังไม่มีคำศัพท์ให้ท่อง</p>
        <p className="mt-1 text-sm text-gray-500">กรุณาเพิ่มคำศัพท์ในระบบก่อน</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-600">คำศัพท์ประจำวันนี้</p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">{today.vocabulary.word}</h1>
            <p className="mt-2 text-sm text-gray-500">{today.vocabulary.pronunciationTh ?? "ยังไม่มีคำอ่านไทย"}</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{today.vocabulary.cefrLevel}</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoBox label="คำแปล" value={today.vocabulary.translationTh} />
          <InfoBox label="การออกเสียง" value={today.vocabulary.pronunciationTh ?? today.vocabulary.word} />
        </div>

        {today.vocabulary.exampleSentence && (
          <div className="mt-4 rounded-lg border bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">{today.vocabulary.exampleSentence}</p>
            <p className="mt-1 text-sm text-gray-500">{today.vocabulary.exampleTranslation ?? ""}</p>
          </div>
        )}

        <Button type="button" variant="outline" className="mt-4" onClick={speakWord}>
          <Volume2 className="size-4" />
          ฟังเสียงคำศัพท์
        </Button>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold text-gray-800">ส่งการบ้านท่องศัพท์</h2>
        <p className="mt-1 text-sm text-gray-500">พูดคำศัพท์ 1 รอบ แล้วสะกดทีละตัว เช่น A-P-P-L-E จากนั้นพิมพ์สะกดคำด้านล่าง</p>

        <div className="mt-4 grid gap-4">
          <div className="space-y-2">
            <label htmlFor="spokenText" className="text-sm font-medium text-gray-700">คำที่พูด</label>
            <Input id="spokenText" value={spokenText} onChange={(e) => setSpokenText(e.target.value)} disabled={completedToday} />
          </div>
          <div className="space-y-2">
            <label htmlFor="spellingText" className="text-sm font-medium text-gray-700">พิมพ์สะกดคำ</label>
            <Input id="spellingText" value={spellingText} onChange={(e) => setSpellingText(e.target.value)} placeholder={today.vocabulary.word} disabled={completedToday} />
            {spellingText && (
              <p className={`text-xs ${typedSpelling === expectedSpelling ? "text-green-600" : "text-amber-600"}`}>
                {typedSpelling === expectedSpelling ? "สะกดตรงกับคำศัพท์" : "ยังสะกดไม่ตรง ลองตรวจอีกครั้ง"}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="flex flex-wrap gap-3">
              {!recording ? (
                <Button type="button" onClick={startRecording} disabled={completedToday}>
                  <Mic className="size-4" />
                  เริ่มบันทึกเสียง
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={stopRecording}>
                  <Square className="size-4" />
                  หยุดบันทึก
                </Button>
              )}
              {audioDataUrl && <audio controls src={audioDataUrl} className="min-w-64 flex-1" />}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="button" onClick={submit} disabled={completedToday || submitting} className="w-full">
            {completedToday ? "ส่งแล้ววันนี้" : submitting ? "กำลังส่ง..." : "ส่งการบ้าน"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold text-gray-800">ประวัติคำศัพท์ที่ท่องแล้ว</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">ยังไม่มีประวัติการส่ง</p>
        ) : (
          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800">{item.vocabulary.word}</p>
                    <p className="text-sm text-gray-500">{item.vocabulary.pronunciationTh ?? ""} · {item.vocabulary.translationTh}</p>
                    {item.vocabulary.exampleSentence && (
                      <p className="mt-1 text-xs text-gray-400">{item.vocabulary.exampleSentence} — {item.vocabulary.exampleTranslation}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(item.assignedDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {item.audioDataUrl && <audio controls src={item.audioDataUrl} className="mt-3 w-full" />}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-blue-50 p-3">
      <p className="text-xs font-medium text-blue-700">{label}</p>
      <p className="mt-1 text-sm text-blue-950">{value}</p>
    </div>
  );
}
