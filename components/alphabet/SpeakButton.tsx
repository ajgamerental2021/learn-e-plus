"use client";

import { Turtle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playTextToSpeech } from "@/lib/client-tts";

export default function SpeakButton({
  text,
  label = "ฟังเสียง",
  lang = "en-US",
  slow = false,
  className = "bg-blue-600 hover:bg-blue-700",
}: {
  text: string;
  label?: string;
  lang?: string;
  slow?: boolean;
  className?: string;
}) {
  function speak() {
    void playTextToSpeech(text, {
      lang,
      preferAudio: true,
      rate: slow ? 0.5 : 0.7,
      speed: slow ? 0.3 : 1,
    });
  }

  const Icon = slow ? Turtle : Volume2;

  return (
    <Button type="button" onClick={speak} className={`h-10 px-3 text-white ${className}`}>
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
