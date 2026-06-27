"use client";

type TtsOptions = {
  lang?: string;
  rate?: number;
  preferAudio?: boolean;
};

let currentAudio: HTMLAudioElement | null = null;

export async function playTextToSpeech(text: string, options: TtsOptions = {}) {
  const cleanText = text.trim();
  if (!cleanText || typeof window === "undefined") return;

  const lang = options.lang ?? "en-US";
  const preferAudio = options.preferAudio ?? isAndroidWebView();

  if (preferAudio) {
    const played = await playRemoteAudio(cleanText, lang);
    if (played) return;
  }

  const spoke = speakWithBrowser(cleanText, lang, options.rate ?? 0.75);
  if (spoke) return;

  await playRemoteAudio(cleanText, lang);
}

export function spellingTextForSpeech(text: string) {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .split("")
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

async function playRemoteAudio(text: string, lang: string) {
  try {
    currentAudio?.pause();
    const audio = new Audio(ttsUrl(text, lang));
    currentAudio = audio;
    audio.preload = "auto";
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

function ttsUrl(text: string, lang: string) {
  const params = new URLSearchParams({ text, lang });
  return `/api/tts?${params.toString()}`;
}

function isAndroidWebView() {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && (/\bwv\b/i.test(ua) || /Version\/\d+\.\d+/i.test(ua));
}
