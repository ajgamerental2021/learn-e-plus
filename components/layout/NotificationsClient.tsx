"use client";

import { useState } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  titleTh: string;
  bodyTh: string;
  type: string;
  data?: { href?: string } | null;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unread = notifications.filter((n) => !n.isRead).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="space-y-1">
      {unread > 0 && (
        <div className="flex justify-end mb-2">
          <button onClick={markAllRead} className="text-sm text-blue-500 hover:underline">
            อ่านทั้งหมด ({unread})
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-400">ยังไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        notifications.map((n) => {
          const href = n.data?.href;
          const content = (
            <>
            <p className="font-semibold text-gray-800">{n.titleTh}</p>
            <p className="text-sm text-gray-500 mt-0.5">{n.bodyTh}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(n.createdAt).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            </>
          );
          const className = `block bg-white rounded-xl border p-4 cursor-pointer hover:border-blue-200 transition-colors ${!n.isRead ? "border-l-4 border-l-blue-500" : ""}`;

          return href ? (
            <Link
              key={n.id}
              href={href}
              onClick={() => { if (!n.isRead) markRead(n.id); }}
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
  );
}
