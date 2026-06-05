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
    <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
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
          <div className="space-y-2">
            <Label htmlFor="displayName">ชื่อที่แสดง</Label>
            <Input id="displayName" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} required disabled={!canManage || saving} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={(e) => update("username", e.target.value.toLowerCase())} required disabled={!canManage || saving} className={inputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required disabled={!canManage || saving} className={inputClass} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{editing ? "รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)" : "รหัสผ่าน"}</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} minLength={editing ? undefined : 8} required={!editing} disabled={!canManage || saving} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="role">ประเภท Member</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">สถานะ</Label>
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
              <Label htmlFor="students">ผูกนักเรียนกับผู้ปกครอง</Label>
              <select
                id="students"
                multiple
                value={form.studentIds}
                onChange={(e) => update("studentIds", Array.from(e.currentTarget.selectedOptions).map((option) => option.value))}
                disabled={!canManage || saving}
                className="min-h-32 w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {learnerOptions.map((learner) => (
                  <option key={learner.id} value={learner.id}>
                    {learner.profile?.displayName ?? learner.email} ({learner.username ?? learner.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">
                {selectedStudentNames.length > 0 ? `เลือกแล้ว: ${selectedStudentNames.join(", ")}` : "กด Cmd/Ctrl เพื่อเลือกได้หลายคน"}
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
          <Label htmlFor="userManagerSearch">ค้นหาในรายการหน้านี้</Label>
          <Input
            id="userManagerSearch"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="เช่น golden014"
            className={`${inputClass} mt-2`}
          />
          <p className="mt-2 text-xs text-gray-500">แตะ card หรือปุ่มแก้ไขเพื่อโหลดข้อมูลเข้าแบบฟอร์มด้านบน/ด้านซ้าย</p>
        </div>

        <div className="grid gap-3 md:hidden">
          {visibleUsers.map((user) => {
            const studentNames = user.guardianStudents
              .map((item) => learnerOptions.find((learner) => learner.id === item.studentId)?.profile?.displayName)
              .filter(Boolean);
            return (
              <div key={user.id} className={`rounded-lg border p-4 ${form.id === user.id ? "border-blue-400 bg-blue-50" : "bg-white"}`}>
                <button type="button" onClick={() => startEdit(user)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{user.profile?.displayName ?? "ไม่มีชื่อ"}</p>
                      <p className="mt-1 text-xs text-gray-500">{user.username ? `${user.username} · ` : ""}{user.email}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{USER_ROLE_LABEL[user.role]}</span>
                  </div>
                  {user.role === "PARENT" && (
                    <p className="mt-2 text-xs text-gray-500">
                      ผู้ปกครองของ: {studentNames.length > 0 ? studentNames.join(", ") : "ยังไม่ได้ผูกนักเรียน"}
                    </p>
                  )}
                  <p className={`mt-2 text-xs font-medium ${user.isActive ? "text-green-700" : "text-red-600"}`}>
                    {user.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                  </p>
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={() => startEdit(user)} disabled={!canManage} className="h-10 border-gray-300 bg-white text-gray-900">
                    <Edit3 className="size-4" />
                    แก้ไข
                  </Button>
                  <Button type="button" onClick={() => quickRole(user, "PARENT")} disabled={!canManage || saving || user.role === "PARENT"} className="h-10 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300">
                    เป็นผู้ปกครอง
                  </Button>
                  <Button type="button" variant="outline" onClick={() => quickRole(user, "LEARNER")} disabled={!canManage || saving || user.role === "LEARNER"} className="h-10 border-gray-300 bg-white text-gray-900">
                    เป็นนักเรียน
                  </Button>
                  <Button type="button" variant="outline" onClick={() => deactivate(user)} disabled={!canManage || !user.isActive} className="h-10 border-red-200 bg-white text-red-600">
                    <Trash2 className="size-4" />
                    ปิดใช้งาน
                  </Button>
                </div>
              </div>
            );
          })}
          {visibleUsers.length === 0 && <p className="rounded-lg border p-6 text-center text-sm text-gray-400">ไม่พบผู้ใช้</p>}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ผู้ปกครองของ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">บทเรียน</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">การบ้าน</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleUsers.map((user) => {
                const studentNames = user.guardianStudents
                  .map((item) => learnerOptions.find((learner) => learner.id === item.studentId)?.profile?.displayName)
                  .filter(Boolean);
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 ${form.id === user.id ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{user.profile?.displayName ?? "ไม่มีชื่อ"}</p>
                      <p className="text-xs text-gray-400">{user.username ? `${user.username} · ` : ""}{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{USER_ROLE_LABEL[user.role]}</span>
                    </td>
                    <td className="max-w-56 px-4 py-3 text-xs text-gray-500">
                      {user.role === "PARENT" ? (studentNames.length > 0 ? studentNames.join(", ") : "ยังไม่ได้ผูกนักเรียน") : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{user._count.lessonProgress}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{user._count.homeworkAssignments}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {user.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(user)} disabled={!canManage} title="แก้ไข">
                          <Edit3 className="size-4" />
                          แก้ไข
                        </Button>
                        <Button type="button" size="sm" onClick={() => quickRole(user, "PARENT")} disabled={!canManage || saving || user.role === "PARENT"} className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300">
                          เป็นผู้ปกครอง
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => deactivate(user)} disabled={!canManage || !user.isActive} title="ปิดใช้งาน">
                          <Trash2 className="size-4" />
                          ปิด
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleUsers.length === 0 && <p className="p-6 text-center text-sm text-gray-400">ไม่พบผู้ใช้</p>}
        </div>
      </section>
    </div>
  );
}
