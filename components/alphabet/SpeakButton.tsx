"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SpeakButton({ text, label = "ฟังเสียง" }: { text: string; label?: string }) {
  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.75;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <Button type="button" onClick={speak} className="h-10 bg-blue-600 px-3 text-white hover:bg-blue-700">
      <Volume2 className="size-4" />
      {label}
    </Button>
  );
}
