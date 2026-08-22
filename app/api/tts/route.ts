import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Google's translate_tts endpoint rejects anything much longer; the client
// splits long text into chunks and plays them back to back.
const MAX_TEXT_LENGTH = 190;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const text = (url.searchParams.get("text") ?? "").trim().slice(0, MAX_TEXT_LENGTH);
  const lang = normalizeLang(url.searchParams.get("lang") ?? "en-US");
  const speed = normalizeSpeed(url.searchParams.get("speed"));

  if (!text) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  const ttsUrl = new URL("https://translate.google.com/translate_tts");
  ttsUrl.searchParams.set("ie", "UTF-8");
  ttsUrl.searchParams.set("client", "tw-ob");
  ttsUrl.searchParams.set("tl", lang);
  ttsUrl.searchParams.set("q", text);
  if (speed) ttsUrl.searchParams.set("ttsspeed", speed);

  const upstream = await fetch(ttsUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: "TTS unavailable" }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

function normalizeLang(lang: string) {
  return lang.toLowerCase().startsWith("th") ? "th" : "en";
}

function normalizeSpeed(speed: string | null) {
  if (!speed) return "";
  const value = Number(speed);
  if (!Number.isFinite(value)) return "";
  return String(Math.min(1, Math.max(0.24, value)));
}
