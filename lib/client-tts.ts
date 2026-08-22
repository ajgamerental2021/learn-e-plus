"use client";

import { englishSpellingSpeech, thaiReadingSpeech, thaiSpellingSpeech } from "@/lib/thai-phonetics";

/**
 * Text-to-speech for learners.
 *
 * The device's own voices (iOS Kanya/Samantha, Android Google TTS) are far
 * clearer than the Google translate endpoint, and their rate control degrades
 * gracefully — so we speak locally whenever a voice for the language exists and
 * only fall back to the network for devices that have none.
 *
 * The translate endpoint is kept as that fallback, but never at its slow speed:
 * `ttsspeed` time-stretches the audio into something mushy, which is the
 * opposite of what a learner trying to catch a syllable needs.
 */

type TtsOptions = {
  lang?: string;
  /** 1 = the voice's normal pace. */
  rate?: number;
};

const RATE_NORMAL = 0.85;
const RATE_SLOW = 0.55;

/** Gap between syllables/letters when speaking something one piece at a time. */
const PIECE_GAP_MS = 260;

const VOICE_PREF_KEY = "tts-voice";

/**
 * Sentinel preference meaning "skip the device voices and use the network
 * endpoint". Some devices ship only one voice per language, so this gives the
 * learner a second option to compare against.
 */
export const REMOTE_VOICE_URI = "__remote__";

let currentAudio: HTMLAudioElement | null = null;
/** Identity of the playback in progress, so a new one cancels the old queue. */
let playToken: object | null = null;

// ── Voice inventory ──────────────────────────────────────────────────────────

export type VoiceOption = {
  uri: string;
  name: string;
  lang: string;
  /** True for the enhanced/neural voices worth downloading. */
  premium: boolean;
};

function synth() {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

/**
 * Chrome populates the voice list asynchronously, so the first call can come
 * back empty. Callers that render a picker should also subscribe via
 * `onVoicesChanged`.
 */
export function getVoices(): SpeechSynthesisVoice[] {
  return synth()?.getVoices() ?? [];
}

export function onVoicesChanged(handler: () => void) {
  const s = synth();
  if (!s) return () => {};
  s.addEventListener("voiceschanged", handler);
  return () => s.removeEventListener("voiceschanged", handler);
}

function matchesLang(voice: SpeechSynthesisVoice, lang: string) {
  const voiceLang = voice.lang.toLowerCase().replace("_", "-");
  return voiceLang === lang.toLowerCase() || voiceLang.startsWith(lang.slice(0, 2).toLowerCase());
}

const PREMIUM_MARKERS = /enhanced|premium|neural|natural|siri/i;
const LOW_QUALITY_MARKERS = /compact|eloquence|espeak/i;

/**
 * macOS ships joke voices ("Bad News", "Bubbles", "Zarvox") in the same list as
 * the real ones. They are useless for a learner and would clutter the picker,
 * so they never appear and are never auto-selected.
 */
const NOVELTY_VOICES = new Set(
  [
    "Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos",
    "Deranged", "Good News", "Jester", "Organ", "Superstar", "Trinoids",
    "Whisper", "Wobble", "Zarvox", "Hysterical", "Pipe Organ", "Junior",
    "Ralph", "Kathy", "Princess", "Grandma", "Grandpa", "Rocko", "Sandy",
    "Shelley", "Bruce", "Fred",
  ].map((name) => name.toLowerCase())
);

function isUsableVoice(voice: SpeechSynthesisVoice) {
  // Names arrive as "Grandma (English (United States))" on newer macOS.
  const base = voice.name.split("(")[0].trim().toLowerCase();
  return !NOVELTY_VOICES.has(base);
}

/** Higher scores win. Enhanced voices first, the tinny compact ones last. */
function voiceScore(voice: SpeechSynthesisVoice, lang: string) {
  let score = 0;
  if (PREMIUM_MARKERS.test(voice.name)) score += 100;
  if (LOW_QUALITY_MARKERS.test(voice.name)) score -= 100;
  // An exact region match ("th-TH") beats a bare language match ("th").
  if (voice.lang.toLowerCase().replace("_", "-") === lang.toLowerCase()) score += 20;
  if (!voice.localService) score += 10;
  if (voice.default) score += 5;
  return score;
}

export function listVoices(lang: string): VoiceOption[] {
  return getVoices()
    .filter((v) => matchesLang(v, lang) && isUsableVoice(v))
    .sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))
    .map((v) => ({
      uri: v.voiceURI,
      name: v.name,
      lang: v.lang,
      premium: PREMIUM_MARKERS.test(v.name),
    }));
}

// ── Voice preference ─────────────────────────────────────────────────────────

function prefKey(lang: string) {
  return `${VOICE_PREF_KEY}:${lang.slice(0, 2).toLowerCase()}`;
}

export function getVoicePreference(lang: string) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(prefKey(lang));
}

export function setVoicePreference(lang: string, uri: string | null) {
  if (typeof window === "undefined") return;
  if (uri) localStorage.setItem(prefKey(lang), uri);
  else localStorage.removeItem(prefKey(lang));
}

/** The chosen voice if it is still installed, otherwise the best available. */
function pickVoice(lang: string) {
  const preferred = getVoicePreference(lang);
  // An explicit choice of the online voice skips the device voices entirely.
  if (preferred === REMOTE_VOICE_URI) return null;

  const voices = getVoices().filter((v) => matchesLang(v, lang) && isUsableVoice(v));
  if (voices.length === 0) return null;

  const chosen = preferred ? voices.find((v) => v.voiceURI === preferred) : undefined;
  if (chosen) return chosen;

  return voices.sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0];
}

// ── Playback ─────────────────────────────────────────────────────────────────

export function stopSpeaking() {
  playToken = null;
  synth()?.cancel();
  currentAudio?.pause();
}

export async function playTextToSpeech(text: string, options: TtsOptions = {}) {
  const cleanText = text.trim();
  if (!cleanText || typeof window === "undefined") return;

  const lang = options.lang ?? "en-US";
  const rate = options.rate ?? RATE_NORMAL;

  if (speakWithBrowser(cleanText, lang, rate)) return;
  await playRemoteAudio(cleanText, lang);
}

/** Speak pieces one at a time with a gap, so each syllable stays distinct. */
async function playPieces(pieces: string[], lang: string, rate: number) {
  const parts = pieces.map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0 || typeof window === "undefined") return;

  const token = {};
  stopSpeaking();
  playToken = token;

  const voice = pickVoice(lang);
  if (!voice) {
    // No local voice for this language — the network fallback cannot pause
    // between pieces, so send them as one phrase.
    await playRemoteAudio(parts.join(" "), lang);
    return;
  }

  for (const [index, part] of parts.entries()) {
    if (playToken !== token) return;
    await speakOnce(part, lang, rate, voice);
    if (index < parts.length - 1) await delay(PIECE_GAP_MS);
  }
}

/** The English word, at learner pace. */
export async function playWordTextToSpeech(word: string, slow = false) {
  await playTextToSpeech(word, { lang: "en-US", rate: slow ? RATE_SLOW : RATE_NORMAL });
}

/** The Thai reading, one syllable at a time so the learner can copy it. */
export async function playThaiReadingTextToSpeech(reading: string) {
  const syllables = thaiReadingSpeech(reading).split(/[\s-]+/);
  await playPieces(syllables, "th-TH", RATE_SLOW);
}

/** Letter-by-letter in English ("bee", "oh", "ex"). */
export async function playSpellingTextToSpeech(text: string) {
  const letters = englishSpellingSpeech(text).split(/\.\s*/);
  await playPieces(letters, "en-US", RATE_SLOW);
}

/** Letter-by-letter using Thai letter names ("บี", "โอ", "เอ็กซ์"). */
export async function playThaiSpellingTextToSpeech(text: string) {
  const letters = thaiSpellingSpeech(text).split(/\s*\.\.\.\s*/);
  await playPieces(letters, "th-TH", RATE_SLOW);
}

function speakWithBrowser(text: string, lang: string, rate: number) {
  const s = synth();
  if (!s || typeof SpeechSynthesisUtterance === "undefined") return false;

  const voice = pickVoice(lang);
  // Without a voice for this language the browser reads the text with whatever
  // default it has — Thai script in an English voice — so use the network.
  if (!voice) return false;

  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = rate;
  s.speak(utterance);
  return true;
}

function speakOnce(text: string, lang: string, rate: number, voice: SpeechSynthesisVoice) {
  const s = synth();
  if (!s) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate;
    utterance.addEventListener("end", () => resolve(), { once: true });
    utterance.addEventListener("error", () => resolve(), { once: true });
    s.speak(utterance);
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Network fallback ─────────────────────────────────────────────────────────

/** The remote TTS endpoint caps each request, so long text plays in chunks. */
const REMOTE_CHUNK_LENGTH = 180;

async function playRemoteAudio(text: string, lang: string) {
  const chunks = chunkForSpeech(text);
  if (chunks.length === 0) return false;

  currentAudio?.pause();
  const token = {};
  playToken = token;

  try {
    for (const [index, chunk] of chunks.entries()) {
      if (playToken !== token) return true;
      const audio = new Audio(ttsUrl(chunk, lang));
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
  for (const part of text.split(/\s+/)) {
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

function ttsUrl(text: string, lang: string) {
  return `/api/tts?${new URLSearchParams({ text, lang }).toString()}`;
}
