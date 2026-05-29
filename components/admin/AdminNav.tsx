"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/students", label: "Students", icon: "👨‍🎓" },
  { href: "/admin/content", label: "Content", icon: "📚" },
  { href: "/admin/homework", label: "Homework", icon: "📝" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
];

export default function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-gray-900 text-white z-20 py-6 px-3">
      <div className="px-3 mb-6">
        <span className="text-xl font-bold text-white">Learn E+</span>
        <span className="ml-2 text-xs bg-blue-600 px-1.5 py-0.5 rounded text-white">{role}</span>
      </div>
      <div className="space-y-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="space-y-1 border-t border-white/10 pt-3 mt-3">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5">
          <span>🏠</span> Learner View
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </nav>
  );
}
