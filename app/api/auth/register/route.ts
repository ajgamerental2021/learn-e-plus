import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  displayName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(50),
  username: z.string().trim().toLowerCase().min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร").max(30).regex(/^[a-z0-9_]+$/, "Username ใช้ได้แค่ a-z, 0-9, _"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, displayName, username } = parsed.data;

    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
    }

    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username นี้ถูกใช้งานแล้ว" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const user = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        emailVerifyToken: verifyToken,
        profile: {
          create: {
            displayName,
          },
        },
        preferences: {
          create: {},
        },
        notificationPrefs: {
          create: {},
        },
        streak: {
          create: {},
        },
      },
    });

    await sendVerificationEmail(email, verifyToken).catch(() => {
      // Non-fatal: user can request resend later
    });

    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ สามารถเข้าสู่ระบบได้แล้ว", userId: user.id },
      { status: 201 }
    );
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
