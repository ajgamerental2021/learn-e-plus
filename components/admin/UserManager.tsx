"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Loader2, Trash2, UserPlus } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USER_ROLE_LABEL } from "@/lib/admin-users";

type AdminUser = {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  profile: { displayName: string | null; onboardingDone: boolean } | null;
  streak: { currentStreak: number } | null;
  guardianStudents: Array<{ studentId: string }>;
  _count: { lessonProgress: number; homeworkAssignments: number };
};

type LearnerOption = {
  id: string;
  email: string;
  username: string | null;
  profile: { displayName: string | null } | null;
};

type FormState = {
  id?: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  studentIds: string[];
};

const emptyForm: FormState = {
  displayName: "",
  username: "",
  email: "",
  password: "",
  role: "PARENT",
  isActive: true,
  studentIds: [],
};

const roles: UserRole[] = ["ADMIN", "TEACHER", "PARENT", "LEARNER"];

export default function UserManager({
  users,
  learnerOptions,
  canManage,
}: {
  users: AdminUser[];
  learnerOptions: LearnerOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userQuery, setUserQuery] = useState("");

  const editing = Boolean(form.id);
  const inputClass = "h-11 border-2 border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:border-blue-500";
  const selectClass = "h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400";
  const selectedStudentNames = useMemo(() => {
    const selected = new Set(form.studentIds);
    return learnerOptions.filter((learner) => selected.has(learner.id)).map((learner) => learner.profile?.displayName ?? learner.email);
  }, [form.studentIds, learnerOptions]);
  const visibleUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const name = user.profile?.displayName?.toLowerCase() ?? "";
      return name.includes(query) || user.email.toLowerCase().includes(query) || (user.username ?? "").toLowerCase().includes(query);
    });
  }, [userQuery, users]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(user: AdminUser) {
    setMessage("");
    setError("");
    setForm({
      id: user.id,
      displayName: user.profile?.displayName ?? "",
      username: usernameFor(user),
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
      studentIds: user.guardianStudents.map((item) => item.studentId),
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setError("");
    setMessage("");
  }

  function usernameFor(user: AdminUser) {
    return user.username ?? user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError("");
    setMessage("");

    const res = await fetch(editing ? `/api/admin/users/${form.id}` : "/api/admin/users", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        isActive: form.isActive,
        studentIds: form.role === "PARENT" ? form.studentIds : [],
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setMessage(editing ? "อัปเดตผู้ใช้แล้ว" : "สร้างผู้ใช้แล้ว");
    setForm(emptyForm);
    router.refresh();
  }

  async function deactivate(user: AdminUser) {
    if (!canManage || !confirm(`ปิดใช้งาน ${user.profile?.displayName ?? user.email}?`)) return;
    setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "ปิดใช้งานไม่สำเร็จ");
      return;
    }
    setMessage("ปิดใช้งานผู้ใช้แล้ว");
    router.refresh();
  }

  async function quickRole(user: AdminUser, role: UserRole) {
    if (!canManage) return;
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: user.profile?.displayName ?? user.username ?? user.email,
        username: usernameFor(user),
        email: user.email,
        password: "",
        role,
        isActive: user.isActive,
        studentIds: role === "PARENT" ? user.guardianStudents.map((item) => item.studentId) : [],
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "เปลี่ยนประเภทไม่สำเร็จ");
      return;
    }
    setMessage(`เปลี่ยน ${user.profile?.displayName ?? user.email} เป็น ${USER_ROLE_LABEL[role]} แล้ว`);
    if (form.id === user.id) update("role", role);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-800">{editing ? "แก้ไข User" : "เพิ่ม User"}</h2>
            <p className="mt-1 text-xs text-gray-500">นักเรียนสมัครเองได้ที่หน้า Login ส่วนผู้ปกครองเพิ่มได้จากตรงนี้</p>
            {editing && (
              <p className="mt-2 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                กำลังแก้ไข: {form.displayName || form.username || form.email}
              </p>
            )}
          </div>
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              ยกเลิก
            </Button>
          )}
        </div>

        {!canManage && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            บัญชีอาจารย์ดูรายการได้ แต่การเพิ่ม/แก้ไข/ลบทำได้เฉพาะ Admin
          </div>
        )}
        {message && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            {editing
              ? "แก้ข้อมูลด้านล่าง แล้วกด “บันทึกการแก้ไข”"
              : "กรอกชื่อ, Username, อีเมล และรหัสผ่าน จากนั้นเลือกประเภทบัญชี"}
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-gray-900">ชื่อที่แสดง <span className="text-red-500">*</span></Label>
            <Input id="displayName" placeholder="เช่น สมชาย ใจดี หรือ คุณแม่สมชาย" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required disabled={!canManage || saving} className={inputClass} />
            <p className="text-xs text-gray-500">ชื่อที่ทุกคนจะเห็นภายในแอป</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-900">Username สำหรับ Login <span className="text-red-500">*</span></Label>
              <Input id="username" placeholder="เช่น golden014" value={form.username} onChange={(e) => update("username", e.target.value.toLowerCase())} required disabled={!canManage || saving} className={inputClass} />
              <p className="text-xs text-gray-500">ใช้ a-z, ตัวเลข และ _ เท่านั้น</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900">อีเมลสำหรับ Login <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" placeholder="เช่น parent@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} required disabled={!canManage || saving} className={inputClass} />
              <p className="text-xs text-gray-500">ต้องไม่ซ้ำกับบัญชีอื่น</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-900">{editing ? "รหัสผ่านใหม่ (ไม่เปลี่ยนให้เว้นว่าง)" : <>รหัสผ่าน <span className="text-red-500">*</span></>}</Label>
            <Input id="password" type="password" placeholder={editing ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยน" : "อย่างน้อย 8 ตัวอักษร"} value={form.password} onChange={(e) => update("password", e.target.value)} minLength={editing ? undefined : 8} required={!editing} disabled={!canManage || saving} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-900">ประเภทบัญชี <span className="text-red-500">*</span></Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => update("role", e.target.value as UserRole)}
                disabled={!canManage || saving}
                className={selectClass}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{USER_ROLE_LABEL[role]}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">เลือกผู้ปกครองเพื่อผูกกับบัญชีนักเรียน</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-900">สถานะการเข้าใช้งาน</Label>
              <select
                id="status"
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) => update("isActive", e.target.value === "active")}
                disabled={!canManage || saving}
                className={selectClass}
              >
                <option value="active">ใช้งานอยู่</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
            </div>
          </div>

          {form.role === "PARENT" && (
            <div className="space-y-2">
              <Label className="text-gray-900">เลือกนักเรียนที่อยู่ในการดูแล</Label>
              <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border-2 border-gray-300 bg-white p-3 sm:grid-cols-2">
                {learnerOptions.map((learner) => {
                  const checked = form.studentIds.includes(learner.id);
                  return (
                    <label key={learner.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${checked ? "border-blue-400 bg-blue-50" : "border-gray-200"}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => update("studentIds", checked ? form.studentIds.filter((id) => id !== learner.id) : [...form.studentIds, learner.id])}
                        disabled={!canManage || saving}
                        className="mt-0.5 size-5"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">{learner.profile?.displayName ?? learner.email}</span>
                        <span className="block text-xs text-gray-500">{learner.username ?? learner.email}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">
                {selectedStudentNames.length > 0 ? `เลือกแล้ว: ${selectedStudentNames.join(", ")}` : "ยังไม่ได้เลือกนักเรียน"}
              </p>
            </div>
          )}

          <Button type="submit" className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300" disabled={!canManage || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : editing ? <Edit3 className="size-4" /> : <UserPlus className="size-4" />}
            {editing ? "บันทึกการแก้ไข" : "เพิ่ม User"}
          </Button>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4">
          <Label htmlFor="userManagerSearch" className="text-gray-900">ค้นหาผู้ใช้ในรายการ</Label>
          <Input
            id="userManagerSearch"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="เช่น golden014"
            className={`${inputClass} mt-2`}
          />
          <p className="mt-2 text-xs text-gray-500">กด “แก้ไขข้อมูล” เพื่อโหลดข้อมูลของผู้ใช้นั้นเข้าสู่แบบฟอร์มด้านบน</p>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {visibleUsers.map((user) => {
            const studentNames = user.guardianStudents
              .map((item) => learnerOptions.find((learner) => learner.id === item.studentId)?.profile?.displayName)
              .filter(Boolean);
            return (
              <article key={user.id} className={`rounded-lg border-2 p-4 ${form.id === user.id ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{user.profile?.displayName ?? "ไม่มีชื่อ"}</p>
                    <p className="mt-1 break-all text-xs text-gray-500">Username: {user.username ?? "-"}</p>
                    <p className="break-all text-xs text-gray-500">อีเมล: {user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{USER_ROLE_LABEL[user.role]}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="font-bold text-gray-900">{user._count.lessonProgress}</p>
                    <p className="text-xs text-gray-500">บทเรียน</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="font-bold text-gray-900">{user._count.homeworkAssignments}</p>
                    <p className="text-xs text-gray-500">การบ้าน</p>
                  </div>
                </div>
                {user.role === "PARENT" && (
                  <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                    ดูแลนักเรียน: {studentNames.length > 0 ? studentNames.join(", ") : "ยังไม่ได้ผูกนักเรียน"}
                  </p>
                )}
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Button type="button" variant="outline" onClick={() => startEdit(user)} disabled={!canManage} className="h-10 border-gray-300 bg-white text-gray-900">
                    <Edit3 className="size-4" />
                    แก้ไขข้อมูล
                  </Button>
                  <Button type="button" onClick={() => quickRole(user, "PARENT")} disabled={!canManage || saving || user.role === "PARENT"} className="h-10 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300">
                    เป็นผู้ปกครอง
                  </Button>
                  <Button type="button" variant="outline" onClick={() => deactivate(user)} disabled={!canManage || !user.isActive} className="h-10 border-red-200 bg-white text-red-600">
                    <Trash2 className="size-4" />
                    ปิดใช้งาน
                  </Button>
                </div>
              </article>
            );
          })}
          {visibleUsers.length === 0 && <p className="rounded-lg border p-6 text-center text-sm text-gray-400">ไม่พบผู้ใช้</p>}
        </div>
      </section>
    </div>
  );
}
