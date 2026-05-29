"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import NotificationBell from "@/components/layout/NotificationBell";
import ThemeToggle from "@/components/layout/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "หน้าหลัก", icon: "🏠" },
  { href: "/learn", label: "บทเรียน", icon: "📚" },
  { href: "/vocabulary", label: "คำศัพท์", icon: "📝" },
  // { href: "/conversation", label: "AI Tutor", icon: "🤖" }, // coming soon
  { href: "/homework", label: "การบ้าน", icon: "✏️" },
  { href: "/tests", label: "แบบทดสอบ", icon: "📋" },
  { href: "/achievements", label: "Badges", icon: "🏆" },
  { href: "/leaderboard", label: "อันดับ", icon: "🥇" },
  { href: "/reports/weekly", label: "รายงาน", icon: "📊" },
  { href: "/profile", label: "โปรไฟล์", icon: "👤" },
];

const MOBILE_MAIN = NAV_ITEMS.slice(0, 4);

export default function LearnerNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Sidebar — desktop */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r z-20 py-6 px-3">
        <div className="flex items-center justify-between px-3 mb-6">
          <Link href="/dashboard">
            <span className="text-xl font-bold text-blue-700">Learn E+</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
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

      {/* More menu overlay — mobile */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute bottom-16 right-2 bg-white rounded-xl shadow-lg border w-52 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_ITEMS.slice(4).map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                    active ? "text-blue-700 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t my-1" />
            <button
              onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/auth/login" }); }}
              className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full"
            >
              <span>🚪</span>
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-20 flex">
        {MOBILE_MAIN.map((item) => {
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
        {/* More button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
            menuOpen ? "text-blue-700" : "text-gray-400"
          }`}
        >
          <span className="text-lg">⋯</span>
          <span className="mt-0.5">เพิ่มเติม</span>
        </button>
      </nav>
    </>
  );
}
