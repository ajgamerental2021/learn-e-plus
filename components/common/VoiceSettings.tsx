"use client";

import { useEffect, useState } from "react";
import { Settings2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getVoicePreference,
  listVoices,
  onVoicesChanged,
  playTextToSpeech,
  REMOTE_VOICE_URI,
  setVoicePreference,
  type VoiceOption,
} from "@/lib/client-tts";

const REMOTE_OPTION: VoiceOption = {
  uri: REMOTE_VOICE_URI,
  name: "เสียงออนไลน์",
  lang: "อินเทอร์เน็ต",
  premium: false,
};

const LANGS = [
  { code: "en-US", label: "เสียงภาษาอังกฤษ", sample: "This is a box." },
  { code: "th-TH", label: "เสียงคำอ่านไทย", sample: "บ็อกซ์" },
];

export default function VoiceSettings() {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<Record<string, VoiceOption[]>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    function refresh() {
      const next: Record<string, VoiceOption[]> = {};
      const chosen: Record<string, string> = {};
      for (const { code } of LANGS) {
        next[code] = [...listVoices(code), REMOTE_OPTION];
        chosen[code] = getVoicePreference(code) ?? next[code][0]?.uri ?? "";
      }
      setVoices(next);
      setSelected(chosen);
    }
    refresh();
    return onVoicesChanged(refresh);
  }, []);

  function choose(lang: string, uri: string) {
    setVoicePreference(lang, uri);
    setSelected((prev) => ({ ...prev, [lang]: uri }));
    const sample = LANGS.find((l) => l.code === lang)?.sample ?? "";
    void playTextToSpeech(sample, { lang, rate: 0.55 });
  }

  // Every language always offers the online voice, so "installed" means more.
  const hasDeviceVoices = LANGS.some(({ code }) => (voices[code]?.length ?? 0) > 1);

  return (
    <div className="rounded-xl border bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Settings2 className="size-4 text-gray-400" />
          ตั้งค่าเสียงอ่าน
        </span>
        <span className="text-xs text-gray-400">{open ? "ซ่อน" : "เลือกเสียง"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          {!hasDeviceVoices && (
            <p className="text-sm text-gray-500">
              อุปกรณ์นี้ยังไม่มีเสียงติดตั้ง แอพจะใช้เสียงออนไลน์แทน ถ้าติดตั้งเสียงเพิ่มจะฟังชัดกว่ามาก
              <br />
              <span className="text-xs text-gray-400">
                Android: ตั้งค่า → ภาษาและการป้อนข้อมูล → เอาต์พุตข้อความเป็นคำพูด · iPhone: ตั้งค่า → การช่วยการเข้าถึง → เนื้อหาที่พูด → เสียง
              </span>
            </p>
          )}

          {LANGS.map(({ code, label, sample }) => {
            const options = voices[code] ?? [];
            return (
              <div key={code}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <Button
                    type="button"
                    onClick={() => void playTextToSpeech(sample, { lang: code, rate: 0.55 })}
                    className="h-8 bg-gray-100 px-2 text-xs text-gray-700 hover:bg-gray-200"
                  >
                    <Volume2 className="size-3.5" />
                    ลองฟัง
                  </Button>
                </div>
                <div className="grid gap-2">
                  {options.map((voice) => (
                    <button
                      key={voice.uri}
                      type="button"
                      onClick={() => choose(code, voice.uri)}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                        selected[code] === voice.uri
                          ? "border-blue-400 bg-blue-50 text-blue-900"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{voice.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {voice.premium && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                            คุณภาพสูง
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{voice.lang}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <p className="text-xs text-gray-400">
            แตะชื่อเสียงเพื่อเลือกและฟังตัวอย่าง ระบบจะจำไว้ในเครื่องนี้
          </p>
        </div>
      )}
    </div>
  );
}
