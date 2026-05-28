"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-5xl">⚠️</p>
        <h2 className="text-xl font-bold text-gray-800">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-gray-500">{error.message ?? "บางอย่างไม่ทำงานตามที่คาดไว้"}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            ลองใหม่
          </button>
          <a href="/dashboard" className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}
