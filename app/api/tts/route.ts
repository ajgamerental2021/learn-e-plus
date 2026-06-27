import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 180;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const text = (url.searchParams.get("text") ?? "").trim().slice(0, MAX_TEXT_LENGTH);
  const lang = normalizeLang(url.searchParams.get("lang") ?? "en-US");

  if (!text) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  const ttsUrl = new URL("https://translate.google.com/translate_tts");
  ttsUrl.searchParams.set("ie", "UTF-8");
  ttsUrl.searchParams.set("client", "tw-ob");
  ttsUrl.searchParams.set("tl", lang);
  ttsUrl.searchParams.set("q", text);

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
