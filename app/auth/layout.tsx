import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">Learn E+</h1>
          <p className="text-gray-500 mt-1 text-sm">เรียนภาษาอังกฤษจากพื้นฐานสู่ขั้นสูง</p>
        </div>
        {children}
      </div>
    </div>
  );
}
