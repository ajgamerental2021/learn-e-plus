"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationBell from "@/components/layout/NotificationBell";

const NAV_ITEMS = [
  { href: "/dashboard", label: "หน้าหลัก", icon: "🏠" },
  { href: "/learn", label: "บทเรียน", icon: "📚" },
  { href: "/vocabulary", label: "คำศัพท์", icon: "📝" },
  { href: "/homework", label: "การบ้าน", icon: "✏️" },
  { href: "/tests", label: "แบบทดสอบ", icon: "📋" },
  { href: "/reports/weekly", label: "รายงาน", icon: "📊" },
  { href: "/profile", label: "โปรไฟล์", icon: "👤" },
];

export default function LearnerNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar — desktop */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r z-20 py-6 px-3">
        <div className="flex items-center justify-between px-3 mb-6">
          <Link href="/dashboard">
            <span className="text-xl font-bold text-blue-700">Learn E+</span>
          </Link>
          <NotificationBell />
        </div>
        <div className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors mt-4"
        >
          <span>🚪</span>
          ออกจากระบบ
        </button>
      </nav>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-20 flex">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                active ? "text-blue-700" : "text-gray-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
