"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  titleTh: string;
  bodyTh: string;
  type: string;
  data?: { href?: string } | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadUnread(showSystemNotification = false) {
      const res = await fetch("/api/notifications?unread=true");
      const data = await res.json();
      if (!alive) return;
      const nextNotifications: Notification[] = data.notifications ?? [];
      const newest = nextNotifications[0];
      if (showSystemNotification && newest && newest.id !== lastSeenIdRef.current && "Notification" in window && Notification.permission === "granted") {
        new Notification(newest.titleTh, {
          body: newest.bodyTh,
          icon: "/icons/icon-192.png",
          data: { href: newest.data?.href ?? "/notifications" },
        });
      }
      if (newest) lastSeenIdRef.current = newest.id;
      setUnread(data.unreadCount ?? 0);
    }
    void loadUnread(false);
    const interval = window.setInterval(() => void loadUnread(true), 30000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setUnread(d.unreadCount ?? 0);
      });
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((n) => n.map((item) => ({ ...item, isRead: true })));
    setUnread(0);
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((n) => n.map((item) => item.id === id ? { ...item, isRead: true } : item));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 top-20 w-[calc(100vw-1.5rem)] max-w-sm bg-white rounded-xl border shadow-lg z-50 overflow-hidden md:left-4 md:top-16">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-gray-800 text-sm">การแจ้งเตือน</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">
                อ่านทั้งหมด
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">ไม่มีการแจ้งเตือน</p>
            ) : (
              notifications.map((n) => {
                const href = n.data?.href;
                const content = (
                  <>
                  <p className="text-sm font-medium text-gray-800">{n.titleTh}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.bodyTh}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  </>
                );
                const className = `block px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 ${!n.isRead ? "bg-blue-50" : ""}`;

                return href ? (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      if (!n.isRead) markRead(n.id);
                      setOpen(false);
                    }}
                    className={className}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.isRead) markRead(n.id); }}
                    className={className}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 border-t">
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-blue-500 hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
