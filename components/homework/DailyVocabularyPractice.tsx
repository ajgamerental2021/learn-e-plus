"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Turtle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  playSpellingTextToSpeech,
  playThaiReadingTextToSpeech,
  playThaiSpellingTextToSpeech,
  playWordTextToSpeech,
} from "@/lib/client-tts";
import { thaiReading, thaiSpelling } from "@/lib/thai-phonetics";
import VoiceSettings from "@/components/common/VoiceSettings";

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
  const [audioError, setAudioError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const completedToday = today?.status === "COMPLETED";
  const expectedSpelling = useMemo(() => today?.vocabulary.word.replace(/\s+/g, "").toLowerCase() ?? "", [today]);
  const typedSpelling = spellingText.replace(/\s+/g, "").toLowerCase();

  const word = today?.vocabulary.word ?? "";
  const reading = useMemo(
    () => thaiReading(word, today?.vocabulary.pronunciationTh),
    [word, today?.vocabulary.pronunciationTh]
  );
  const spelling = useMemo(() => thaiSpelling(word), [word]);

  function speakWord(slow = false) {
    if (!today) return;
    void playWordTextToSpeech(today.vocabulary.word, slow);
  }

  function speakThaiReading() {
    if (!reading) return;
    void playThaiReadingTextToSpeech(reading.text);
  }

  function speakSpelling() {
    if (!today) return;
    void playSpellingTextToSpeech(today.vocabulary.word);
  }

  function speakThaiSpelling() {
    if (!today) return;
    void playThaiSpellingTextToSpeech(today.vocabulary.word);
  }

  async function startRecording() {
    setError("");
    setAudioError("");
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("การบันทึกเสียงต้องเปิดผ่าน HTTPS หรือแอพที่รองรับ");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("อุปกรณ์นี้ยังไม่รองรับการบันทึกเสียงในเบราว์เซอร์");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("อุปกรณ์นี้ยังไม่รองรับ MediaRecorder กรุณาอัปเดต Android System WebView หรือ Chrome");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError("บันทึกเสียงไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/mp4" });
        const reader = new FileReader();
        reader.onloadend = () => setAudioDataUrl(String(reader.result));
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("แอพยังไม่ได้รับอนุญาตใช้ไมโครโฟน กรุณาอนุญาตไมค์ใน Android Settings แล้วลองใหม่");
      } else {
        setError("เปิดไมโครโฟนไม่ได้ กรุณาตรวจสอบสิทธิ์ไมค์และลองใหม่");
      }
    }
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
    if (audioError) {
      setError("กรุณาบันทึกเสียงใหม่ เพราะไฟล์เสียงเดิมเปิดไม่ได้");
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
            {reading && <p className="mt-2 text-xl font-semibold text-blue-700">{reading.text}</p>}
            {reading?.perWord && (
              <p className="mt-1 text-xs text-gray-400">คำอ่านแยกทีละคำ</p>
            )}
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{today.vocabulary.cefrLevel}</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoBox label="คำแปล" value={today.vocabulary.translationTh} />
          {reading && <InfoBox label="คำอ่านไทย" value={reading.text} />}
        </div>

        <div className="mt-3 rounded-lg border-2 border-indigo-100 bg-indigo-50 p-4">
          <p className="text-xs font-medium text-indigo-700">สะกดทีละตัว</p>
          <p className="mt-1 text-lg font-semibold tracking-wide text-indigo-950">{spelling}</p>
          <p className="mt-1 text-xs text-indigo-500">{word.toUpperCase().split("").join(" - ")}</p>
        </div>

        {today.vocabulary.exampleSentence && (
          <div className="mt-4 rounded-lg border bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">{today.vocabulary.exampleSentence}</p>
            <p className="mt-1 text-sm text-gray-500">{today.vocabulary.exampleTranslation ?? ""}</p>
          </div>
        )}

        <div className="mt-5 space-y-3">
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">ฟังคำศัพท์</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="h-11 bg-blue-600 text-white hover:bg-blue-700" onClick={() => speakWord(false)}>
                <Volume2 className="size-4" />
                เสียงอังกฤษ
              </Button>
              <Button type="button" className="h-11 bg-blue-500 text-white hover:bg-blue-600" onClick={() => speakWord(true)}>
                <Turtle className="size-4" />
                อังกฤษ ช้าๆ
              </Button>
              {reading && (
                <Button type="button" className="h-11 bg-emerald-600 text-white hover:bg-emerald-700" onClick={speakThaiReading}>
                  <Volume2 className="size-4" />
                  คำอ่านไทย
                </Button>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">ฟังสะกดทีละตัว</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="h-11 bg-indigo-600 text-white hover:bg-indigo-700" onClick={speakSpelling}>
                <Volume2 className="size-4" />
                สะกดอังกฤษ
              </Button>
              <Button type="button" className="h-11 bg-emerald-600 text-white hover:bg-emerald-700" onClick={speakThaiSpelling}>
                <Volume2 className="size-4" />
                สะกดแบบไทย
              </Button>
            </div>
          </div>
        </div>
      </section>

      <VoiceSettings />

      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold text-gray-800">ส่งการบ้านท่องศัพท์</h2>
        <p className="mt-1 text-sm text-gray-500">พูดคำศัพท์ 1 รอบ แล้วสะกดทีละตัว เช่น A-P-P-L-E จากนั้นพิมพ์สะกดคำด้านล่าง</p>

        <div className="mt-4 grid gap-4">
          <div className="space-y-2">
            <label htmlFor="spokenText" className="text-sm font-medium text-gray-700">คำที่พูด</label>
            <Input
              id="spokenText"
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              disabled={submitting}
              className="h-12 border-2 border-gray-300 bg-white px-4 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="spellingText" className="text-sm font-medium text-gray-700">พิมพ์สะกดคำ</label>
            <Input
              id="spellingText"
              value={spellingText}
              onChange={(e) => setSpellingText(e.target.value)}
              placeholder={today.vocabulary.word}
              disabled={submitting}
              className="h-12 border-2 border-gray-300 bg-white px-4 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:border-blue-500"
            />
            {spellingText && (
              <p className={`text-xs ${typedSpelling === expectedSpelling ? "text-green-600" : "text-amber-600"}`}>
                {typedSpelling === expectedSpelling ? "สะกดตรงกับคำศัพท์" : "ยังสะกดไม่ตรง ลองตรวจอีกครั้ง"}
              </p>
            )}
          </div>

          <div className="rounded-lg border-2 border-blue-100 bg-blue-50 p-4">
            <p className="mb-3 text-sm font-semibold text-blue-900">บันทึกเสียงพูดคำศัพท์และสะกดคำ</p>
            <div className="flex flex-wrap items-center gap-3">
              {!recording ? (
                <Button type="button" onClick={startRecording} disabled={submitting} className="h-11 bg-red-600 px-4 text-white hover:bg-red-700 disabled:bg-gray-300">
                  <Mic className="size-4" />
                  เริ่มบันทึกเสียง
                </Button>
              ) : (
                <Button type="button" onClick={stopRecording} className="h-11 bg-gray-900 px-4 text-white hover:bg-gray-800">
                  <Square className="size-4" />
                  หยุดบันทึก
                </Button>
              )}
              {audioDataUrl && !audioError && (
                <audio
                  controls
                  src={audioDataUrl}
                  onError={() => setAudioError("ไฟล์เสียงนี้เปิดไม่ได้บนเบราว์เซอร์นี้ กรุณาบันทึกใหม่อีกครั้ง")}
                  className="min-w-64 flex-1 rounded-md bg-white"
                />
              )}
            </div>
            {audioError && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {audioError}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="button" onClick={submit} disabled={submitting || recording} className="h-12 w-full bg-blue-600 text-base text-white hover:bg-blue-700 disabled:bg-gray-300">
            {submitting ? "กำลังส่ง..." : completedToday ? "บันทึกแก้ไขการบ้าน" : "ส่งการบ้าน"}
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
                    <p className="text-sm text-gray-500">
                      {[thaiReading(item.vocabulary.word, item.vocabulary.pronunciationTh)?.text, item.vocabulary.translationTh]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
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

function preferredAudioMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  const options = [
    "audio/mp4",
    "audio/aac",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-blue-50 p-3">
      <p className="text-xs font-medium text-blue-700">{label}</p>
      <p className="mt-1 text-sm text-blue-950">{value}</p>
    </div>
  );
}
