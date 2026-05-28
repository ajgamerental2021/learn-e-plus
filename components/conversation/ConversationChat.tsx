"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TOPICS = [
  { id: "free", label: "สนทนาอิสระ" },
  { id: "greetings", label: "ทักทาย" },
  { id: "shopping", label: "ช้อปปิ้ง" },
  { id: "travel", label: "ท่องเที่ยว" },
  { id: "food", label: "อาหาร" },
  { id: "work", label: "งาน" },
  { id: "weather", label: "สภาพอากาศ" },
];

export default function ConversationChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("free");
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startConversation() {
    setStarted(true);
    setLoading(true);
    const selectedTopic = topic === "free" ? undefined : TOPICS.find((t) => t.id === topic)?.label;
    const res = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], topic: selectedTopic }),
    });
    const data = await res.json();
    if (data.reply) {
      setMessages([{ role: "assistant", content: data.reply }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });
    const data = await res.json();
    if (data.reply) {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    }
    setLoading(false);
  }

  function reset() {
    setMessages([]);
    setStarted(false);
    setInput("");
  }

  if (!started) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-2">
          <p className="text-5xl">🤖</p>
          <h2 className="text-lg font-bold text-gray-800">AI Tutor พร้อมคุยกับคุณ</h2>
          <p className="text-sm text-gray-500">เลือกหัวข้อและเริ่มสนทนาได้เลย</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                topic === t.id ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={startConversation}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold"
        >
          เริ่มสนทนา
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 shrink-0 mt-1">
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-white border text-gray-800 rounded-tl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 shrink-0">🤖</div>
            <div className="bg-white border px-4 py-2.5 rounded-2xl rounded-tl-sm">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t bg-gray-50 pt-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="พิมพ์ข้อความ..."
            disabled={loading}
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40"
          >
            ส่ง
          </button>
          <button
            onClick={reset}
            className="px-3 py-2.5 border rounded-xl text-sm text-gray-500 hover:bg-gray-100"
            title="เริ่มใหม่"
          >
            ↩
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">กด Enter เพื่อส่ง · AI Tutor ตอบเป็นภาษาอังกฤษ</p>
      </div>
    </div>
  );
}
