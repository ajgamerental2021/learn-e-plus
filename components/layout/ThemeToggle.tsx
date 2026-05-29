"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? "เปลี่ยนเป็น Light mode" : "เปลี่ยนเป็น Dark mode"}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
