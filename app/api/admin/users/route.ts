import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUserPayloadSchema } from "@/lib/admin-users";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = adminUserPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, username, displayName, role, password, studentIds = [] } = parsed.data;
  if (!password) {
    return NextResponse.json({ error: "กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่" }, { status: 400 });
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing?.email === email) return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
  if (existing?.username === username) return NextResponse.json({ error: "Username นี้ถูกใช้งานแล้ว" }, { status: 409 });

  const preA1 = await db.level.findFirst({ where: { code: "PRE_A1" }, select: { id: true } });
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      username,
      passwordHash,
      role,
      isActive: true,
      emailVerified: new Date(),
      profile: {
        create: {
          displayName,
          currentLevelId: role === "LEARNER" ? preA1?.id : undefined,
          onboardingDone: role !== "LEARNER",
        },
      },
      preferences: { create: {} },
      notificationPrefs: { create: {} },
      streak: { create: {} },
    },
    select: { id: true },
  });

  if (role === "PARENT" && studentIds.length > 0) {
    await db.guardianStudent.createMany({
      data: studentIds.map((studentId) => ({
        guardianId: user.id,
        studentId,
        assignedBy: session.user.id,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, id: user.id }, { status: 201 });
}
