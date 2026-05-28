import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  displayName: z.string().min(1, "กรุณากรอกชื่อ").max(50),
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

    const { email, password, displayName } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const user = await db.user.create({
      data: {
        email,
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
      { message: "สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมลของคุณ", userId: user.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 }
    );
  }
}
