"use client";

import { useState, useRef } from "react";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

const VOCAB_TEMPLATE = "word,translationTh,partOfSpeech,exampleSentence,exampleTranslation,levelCode,category\nhello,สวัสดี,interjection,Hello! How are you?,สวัสดี! เป็นยังไงบ้าง?,PRE_A1,greetings\nbook,หนังสือ,noun,I read a book.,ฉันอ่านหนังสือ.,A1,school";

export default function ContentImporter() {
  const [type, setType] = useState<"vocabulary" | "questions">("vocabulary");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/admin/import/${type}`, { method: "POST", body: formData });
    const data = await res.json();
    setResult(data);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    setFile(null);
  }

  function downloadTemplate() {
    const blob = new Blob([VOCAB_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocabulary_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold text-gray-700">ประเภท Content</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setType("vocabulary")}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${type === "vocabulary" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600"}`}
          >
            Vocabulary
          </button>
          <button
            onClick={() => setType("questions")}
            disabled
            className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-400 cursor-not-allowed"
          >
            Questions (coming soon)
          </button>
        </div>
      </div>

      {/* Template */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Template CSV</h2>
          <button onClick={downloadTemplate} className="text-sm text-blue-500 hover:underline">
            ดาวน์โหลด Template
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
          <code className="text-xs text-gray-600 whitespace-pre">{VOCAB_TEMPLATE.split("\n")[0]}</code>
        </div>
        <div className="text-xs text-gray-400 space-y-0.5">
          <p>• Required: word, translationTh</p>
          <p>• levelCode: PRE_A1, A1, A2, B1, B2, C1, C2</p>
          <p>• partOfSpeech: noun, verb, adjective, adverb, etc.</p>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold text-gray-700">อัพโหลด CSV</h2>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-1.5 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {uploading ? "กำลังนำเข้า..." : "นำเข้าข้อมูล"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`bg-white rounded-xl border p-4 space-y-2 ${result.errors.length > 0 ? "border-orange-200" : "border-green-200"}`}>
          <h2 className="font-semibold text-gray-700">ผลลัพธ์</h2>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600">✓ นำเข้า {result.created} รายการ</span>
            {result.skipped > 0 && <span className="text-gray-400">ข้าม {result.skipped} รายการ</span>}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium mb-1">Errors ({result.errors.length}):</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-500">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
