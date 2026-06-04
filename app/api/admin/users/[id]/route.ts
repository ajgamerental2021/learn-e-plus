import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUserPayloadSchema } from "@/lib/admin-users";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = adminUserPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, username, displayName, role, password, isActive = true, studentIds = [] } = parsed.data;
  const user = await db.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  const duplicate = await db.user.findFirst({
    where: { id: { not: id }, OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (duplicate?.email === email) return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
  if (duplicate?.username === username) return NextResponse.json({ error: "Username นี้ถูกใช้งานแล้ว" }, { status: 409 });

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        email,
        username,
        role,
        isActive,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });

    await tx.userProfile.upsert({
      where: { userId: id },
      update: {
        displayName,
        onboardingDone: role === "LEARNER" ? undefined : true,
      },
      create: {
        userId: id,
        displayName,
        onboardingDone: role !== "LEARNER",
      },
    });

    if (role === "PARENT") {
      await tx.guardianStudent.deleteMany({
        where: { guardianId: id, studentId: { notIn: studentIds } },
      });
      if (studentIds.length > 0) {
        await tx.guardianStudent.createMany({
          data: studentIds.map((studentId) => ({
            guardianId: id,
            studentId,
            assignedBy: session.user.id,
          })),
          skipDuplicates: true,
        });
      }
    } else {
      await tx.guardianStudent.deleteMany({ where: { guardianId: id } });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "ไม่สามารถปิดใช้งานบัญชีตัวเองได้" }, { status: 400 });
  }

  await db.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
