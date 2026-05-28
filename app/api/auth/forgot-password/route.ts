import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "อีเมลไม่ถูกต้อง" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตให้" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: expiry },
    });

    await sendPasswordResetEmail(parsed.data.email, resetToken).catch(() => {});

    return NextResponse.json({ message: "หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตให้" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
