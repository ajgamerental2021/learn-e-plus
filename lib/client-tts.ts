"use client";

type TtsOptions = {
  lang?: string;
  rate?: number;
  preferAudio?: boolean;
  speed?: number;
};

let currentAudio: HTMLAudioElement | null = null;

export async function playTextToSpeech(text: string, options: TtsOptions = {}) {
  const cleanText = text.trim();
  if (!cleanText || typeof window === "undefined") return;

  const lang = options.lang ?? "en-US";
  const preferAudio = options.preferAudio ?? isAndroidWebView();

  if (preferAudio) {
    const played = await playRemoteAudio(cleanText, lang, options.speed);
    if (played) return;
  }

  const spoke = speakWithBrowser(cleanText, lang, options.rate ?? 0.75);
  if (spoke) return;

  await playRemoteAudio(cleanText, lang, options.speed);
}

export async function playSpellingTextToSpeech(text: string) {
  const phrase = spellingPhraseForSpeech(text);
  if (!phrase) return;
  await playTextToSpeech(phrase, { lang: "en-US", preferAudio: true, speed: 0.38 });
}

function spellingPhraseForSpeech(text: string) {
  return text
    .toUpperCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Z0-9]/g, "").split("").filter(Boolean).join(", "))
    .filter(Boolean)
    .join(". ");
}

function speakWithBrowser(text: string, lang: string, rate: number) {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
  return true;
}

async function playRemoteAudio(text: string, lang: string, speed?: number) {
  try {
    currentAudio?.pause();
    const audio = new Audio(ttsUrl(text, lang, speed));
    currentAudio = audio;
    audio.preload = "auto";
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

function ttsUrl(text: string, lang: string, speed?: number) {
  const params = new URLSearchParams({ text, lang });
  if (speed) params.set("speed", String(speed));
  return `/api/tts?${params.toString()}`;
}

function isAndroidWebView() {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && (/\bwv\b/i.test(ua) || /Version\/\d+\.\d+/i.test(ua));
}
