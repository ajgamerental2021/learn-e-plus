"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playTextToSpeech } from "@/lib/client-tts";

export default function SpeakButton({
  text,
  label = "ฟังเสียง",
  lang = "en-US",
}: {
  text: string;
  label?: string;
  lang?: string;
}) {
  function speak() {
    void playTextToSpeech(text, { lang });
  }

  return (
    <Button type="button" onClick={speak} className="h-10 bg-blue-600 px-3 text-white hover:bg-blue-700">
      <Volume2 className="size-4" />
      {label}
    </Button>
  );
}
