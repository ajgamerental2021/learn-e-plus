"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName,
        username: form.username,
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "เกิดข้อผิดพลาด");
      return;
    }

    setSuccess("สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี");
    setTimeout(() => router.push("/auth/login"), 3000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>สมัครสมาชิก</CardTitle>
        <CardDescription>สร้างบัญชีใหม่เพื่อเริ่มเรียนภาษาอังกฤษ</CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">ชื่อที่แสดงในระบบ</Label>
            <Input
              id="displayName"
              placeholder="เช่น สมชาย ใจดี"
              value={form.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="เช่น somchai99"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              required
              minLength={3}
              disabled={loading}
            />
            <p className="text-xs text-gray-400">ใช้สำหรับ login ได้ (a-z, 0-9, _ เท่านั้น)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-gray-500">
        มีบัญชีแล้ว?{" "}
        <Link href="/auth/login" className="ml-1 text-blue-600 font-medium hover:underline">
          เข้าสู่ระบบ
        </Link>
      </CardFooter>
    </Card>
  );
}
