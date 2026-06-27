"use client";

type TtsOptions = {
  lang?: string;
  rate?: number;
  preferAudio?: boolean;
};

let currentAudio: HTMLAudioElement | null = null;
let sequenceToken = 0;

export async function playTextToSpeech(text: string, options: TtsOptions = {}) {
  const cleanText = text.trim();
  if (!cleanText || typeof window === "undefined") return;

  sequenceToken += 1;
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

export async function playSpellingTextToSpeech(text: string) {
  const groups = spellingGroups(text);
  if (groups.length === 0 || typeof window === "undefined") return;

  const token = sequenceToken + 1;
  sequenceToken = token;
  currentAudio?.pause();

  for (let wordIndex = 0; wordIndex < groups.length; wordIndex += 1) {
    const letters = groups[wordIndex];
    for (let letterIndex = 0; letterIndex < letters.length; letterIndex += 1) {
      if (sequenceToken !== token) return;
      await playRemoteAudio(letters[letterIndex], "en-US", true);
      if (sequenceToken !== token) return;
      await delay(520);
    }
    if (wordIndex < groups.length - 1) {
      await delay(1100);
    }
  }
}

function spellingGroups(text: string) {
  return text
    .toUpperCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Z0-9]/g, "").split("").filter(Boolean))
    .filter((letters) => letters.length > 0);
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

async function playRemoteAudio(text: string, lang: string, waitForEnd = false) {
  try {
    currentAudio?.pause();
    const audio = new Audio(ttsUrl(text, lang));
    currentAudio = audio;
    audio.preload = "auto";
    await audio.play();
    if (waitForEnd) await waitForAudioEnd(audio);
    return true;
  } catch {
    return false;
  }
}

function waitForAudioEnd(audio: HTMLAudioElement) {
  return new Promise<void>((resolve) => {
    audio.addEventListener("ended", () => resolve(), { once: true });
    audio.addEventListener("error", () => resolve(), { once: true });
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ttsUrl(text: string, lang: string) {
  const params = new URLSearchParams({ text, lang });
  return `/api/tts?${params.toString()}`;
}

function isAndroidWebView() {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && (/\bwv\b/i.test(ua) || /Version\/\d+\.\d+/i.test(ua));
}
