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
  const mobileItems = NAV_ITEMS.slice(0, 4);
  const moreItems = NAV_ITEMS.slice(4);

  return (
    <>
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 text-white border-t border-white/10 z-30 flex">
        {mobileItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                active ? "text-white" : "text-gray-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
        <details className="relative flex-1">
          <summary className="flex h-full list-none flex-col items-center py-3 text-xs text-gray-400 [&::-webkit-details-marker]:hidden">
            <span className="text-lg">⋯</span>
            <span className="mt-0.5">More</span>
          </summary>
          <div className="absolute bottom-16 right-2 w-48 rounded-xl border border-white/10 bg-gray-950 py-2 shadow-lg">
            {moreItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10">
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="my-1 border-t border-white/10" />
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-200 hover:bg-white/10">
              <span>🏠</span>
              Learner View
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-white/10"
            >
              <span>🚪</span>
              Logout
            </button>
          </div>
        </details>
      </nav>
    </>
  );
}
