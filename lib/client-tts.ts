"use client";

import { englishSpellingSpeech, thaiReadingSpeech, thaiSpellingSpeech } from "@/lib/thai-phonetics";

type TtsOptions = {
  lang?: string;
  rate?: number;
  preferAudio?: boolean;
  speed?: number;
};

/** Browser speechSynthesis rates. Below ~0.5 most voices turn to mush. */
const RATE_NORMAL = 0.7;
const RATE_SLOW = 0.5;

/** Google TTS `ttsspeed` values. 1 = normal, 0.24 = slowest allowed. */
const SPEED_NORMAL = 1;
const SPEED_SLOW = 0.3;

let currentAudio: HTMLAudioElement | null = null;
/** Identity of the playback in progress, so a new one cancels the old queue. */
let playToken: object | null = null;

export async function playTextToSpeech(text: string, options: TtsOptions = {}) {
  const cleanText = text.trim();
  if (!cleanText || typeof window === "undefined") return;

  const lang = options.lang ?? "en-US";
  const preferAudio = options.preferAudio ?? isAndroidWebView();

  if (preferAudio) {
    const played = await playRemoteAudio(cleanText, lang, options.speed);
    if (played) return;
  }

  const spoke = speakWithBrowser(cleanText, lang, options.rate ?? RATE_NORMAL);
  if (spoke) return;

  await playRemoteAudio(cleanText, lang, options.speed);
}

/** The English word, at learner pace. */
export async function playWordTextToSpeech(word: string, slow = false) {
  await playTextToSpeech(word, {
    lang: "en-US",
    preferAudio: true,
    rate: slow ? RATE_SLOW : RATE_NORMAL,
    speed: slow ? SPEED_SLOW : SPEED_NORMAL,
  });
}

/** The Thai reading of the word, spoken by a Thai voice. */
export async function playThaiReadingTextToSpeech(reading: string) {
  await playTextToSpeech(thaiReadingSpeech(reading), {
    lang: "th-TH",
    preferAudio: true,
    rate: RATE_SLOW,
    speed: SPEED_SLOW,
  });
}

/** Letter-by-letter in English ("bee. oh. ex."). */
export async function playSpellingTextToSpeech(text: string) {
  const phrase = englishSpellingSpeech(text);
  if (!phrase) return;
  await playTextToSpeech(phrase, { lang: "en-US", preferAudio: true, rate: RATE_SLOW, speed: SPEED_SLOW });
}

/** Letter-by-letter using Thai letter names ("บี โอ เอ็กซ์"). */
export async function playThaiSpellingTextToSpeech(text: string) {
  const phrase = thaiSpellingSpeech(text);
  if (!phrase) return;
  await playTextToSpeech(phrase, { lang: "th-TH", preferAudio: true, rate: RATE_SLOW, speed: SPEED_SLOW });
}

function speakWithBrowser(text: string, lang: string, rate: number) {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  return true;
}

/** Prefer a voice that actually matches the language, not the browser default. */
function pickVoice(lang: string) {
  const prefix = lang.slice(0, 2).toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().replace("_", "-") === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

/** The remote TTS endpoint caps each request, so long text plays in chunks. */
const REMOTE_CHUNK_LENGTH = 180;

async function playRemoteAudio(text: string, lang: string, speed?: number) {
  const chunks = chunkForSpeech(text);
  if (chunks.length === 0) return false;

  currentAudio?.pause();
  const token = {};
  playToken = token;

  try {
    // Await the first chunk so a blocked autoplay still reports failure and
    // lets the browser voice take over.
    for (const [index, chunk] of chunks.entries()) {
      if (playToken !== token) return true;
      const audio = new Audio(ttsUrl(chunk, lang, speed));
      currentAudio = audio;
      audio.preload = "auto";
      await audio.play();
      if (index < chunks.length - 1) await waitForEnd(audio);
    }
    return true;
  } catch {
    return false;
  }
}

function waitForEnd(audio: HTMLAudioElement) {
  return new Promise<void>((resolve) => {
    audio.addEventListener("ended", () => resolve(), { once: true });
    audio.addEventListener("error", () => resolve(), { once: true });
  });
}

/** Split on separators first so a chunk never cuts a word in half. */
function chunkForSpeech(text: string) {
  if (text.length <= REMOTE_CHUNK_LENGTH) return text ? [text] : [];

  const chunks: string[] = [];
  let current = "";
  for (const part of text.split(/(?<=[.…]|\s\.\.\.)\s+|\s+/)) {
    if (!part) continue;
    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length > REMOTE_CHUNK_LENGTH && current) {
      chunks.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function ttsUrl(text: string, lang: string, speed?: number) {
  const params = new URLSearchParams({ text, lang });
  if (speed && speed < 1) params.set("speed", String(speed));
  return `/api/tts?${params.toString()}`;
}

function isAndroidWebView() {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) && (/\bwv\b/i.test(ua) || /Version\/\d+\.\d+/i.test(ua));
}
