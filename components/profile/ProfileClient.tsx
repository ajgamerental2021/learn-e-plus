"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface SkillScore {
  skillType: string;
  score: number;
}

interface Props {
  user: {
    id: string;
    displayName: string | null;
    email: string;
    createdAt: Date;
    role: string;
    notificationPrefs: { inAppEnabled: boolean; pushEnabled: boolean; emailEnabled: boolean } | null;
  };
  profile: {
    currentLevel: { code: string; nameTh: string } | null;
    ageGroup: string | null;
    learningPathCode: string | null;
    dailyGoalMinutes: number | null;
    onboardingDone: boolean;
  } | null;
  streak: { currentStreak: number; longestStreak: number } | null;
  skillScores: SkillScore[];
  lessonsCompleted: number;
  testsAttempted: number;
}

const SKILL_LABELS: Record<string, string> = {
  GRAMMAR: "Grammar",
  VOCABULARY: "Vocabulary",
  READING: "Reading",
  LISTENING: "Listening",
  SPEAKING: "Speaking",
  WRITING: "Writing",
};

export default function ProfileClient({ user, profile, streak, skillScores, lessonsCompleted, testsAttempted }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.displayName ?? "");
  const [inAppNotificationsEnabled, setInAppNotificationsEnabled] = useState(user.notificationPrefs?.inAppEnabled ?? true);
  const [pushEnabled, setPushEnabled] = useState(user.notificationPrefs?.pushEnabled ?? true);
  const [pushMessage, setPushMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, inAppNotificationsEnabled }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function enablePushNotifications() {
    setPushMessage("");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushMessage("เครื่องนี้ยังไม่รองรับ push notification แบบเว็บ");
      return;
    }
    const keyRes = await fetch("/api/push/vapid-public-key");
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      setPushMessage("ยังไม่ได้ตั้งค่า push key บน server");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushMessage("ยังไม่ได้อนุญาตแจ้งเตือนบนเครื่องนี้");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    setPushEnabled(true);
    setPushMessage("เปิดแจ้งเตือนเครื่องนี้แล้ว");
    router.refresh();
  }

  async function disablePushNotifications() {
    setPushMessage("");
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration("/sw.js") : null;
    const subscription = registration ? await registration.pushManager.getSubscription() : null;
    if (subscription) await subscription.unsubscribe();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription?.endpoint }),
    });
    setPushEnabled(false);
    setPushMessage("ปิด push notification บนเครื่องนี้แล้ว");
    router.refresh();
  }

  async function handleToggleNotifications() {
    const nextValue = !inAppNotificationsEnabled;
    setInAppNotificationsEnabled(nextValue);
    setSaving(true);
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inAppNotificationsEnabled: nextValue }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-800">โปรไฟล์</h1>

      {/* Avatar + basic info */}
      <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700 shrink-0">
          {(user.displayName ?? user.email)[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{user.displayName ?? "—"}</p>
          <p className="text-sm text-gray-400 truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{profile?.currentLevel?.nameTh ?? "ยังไม่ได้ทดสอบ"}</span>
            <span className="text-xs text-gray-400">เข้าร่วมเมื่อ {user.createdAt.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{streak?.currentStreak ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">🔥 Streak</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{lessonsCompleted}</p>
          <p className="text-xs text-gray-400 mt-0.5">บทเรียน</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{testsAttempted}</p>
          <p className="text-xs text-gray-400 mt-0.5">ข้อสอบ</p>
        </div>
      </div>

      {/* Skills */}
      {skillScores.length > 0 && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">ทักษะ</h2>
          {skillScores.map((s) => (
            <div key={s.skillType}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{SKILL_LABELS[s.skillType] ?? s.skillType}</span>
                <span className="text-gray-500">{s.score}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.score >= 70 ? "bg-green-500" : s.score >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                  style={{ width: `${s.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit name */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold text-gray-700">แก้ไขข้อมูล</h2>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">ชื่อ</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saved ? "✓ บันทึกแล้ว" : saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-700">การแจ้งเตือน</h2>
            <p className="mt-1 text-sm text-gray-500">รับแจ้งเตือนในแอพเมื่อมีการบ้าน ส่งงาน หรือกิจกรรมสำคัญ</p>
          </div>
          <button
            type="button"
            onClick={handleToggleNotifications}
            disabled={saving}
            className={`relative h-8 w-14 rounded-full transition-colors ${inAppNotificationsEnabled ? "bg-blue-600" : "bg-gray-300"}`}
            aria-pressed={inAppNotificationsEnabled}
            aria-label="เปิดปิดการแจ้งเตือนในแอพ"
          >
            <span
              className={`absolute top-1 size-6 rounded-full bg-white shadow transition-transform ${inAppNotificationsEnabled ? "translate-x-7" : "translate-x-1"}`}
            />
          </button>
        </div>
        <p className={`mt-3 text-sm font-medium ${inAppNotificationsEnabled ? "text-green-600" : "text-gray-500"}`}>
          {inAppNotificationsEnabled ? "เปิดการแจ้งเตือนอยู่" : "ปิดการแจ้งเตือนอยู่"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={enablePushNotifications}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            เปิดแจ้งเตือนเครื่องนี้
          </button>
          <button
            type="button"
            onClick={disablePushNotifications}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ปิด Push
          </button>
        </div>
        <p className={`mt-2 text-xs ${pushEnabled ? "text-green-600" : "text-gray-500"}`}>
          {pushEnabled ? "Push notification เปิดอยู่ในบัญชีนี้" : "Push notification ปิดอยู่ในบัญชีนี้"}
        </p>
        {pushMessage && <p className="mt-2 text-xs text-gray-500">{pushMessage}</p>}
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-xl border p-5">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
