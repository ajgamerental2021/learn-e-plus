import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid-token", req.url));
  }

  const user = await db.user.findUnique({ where: { emailVerifyToken: token } });

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid-token", req.url));
  }

  if (user.emailVerified) {
    return NextResponse.redirect(new URL("/auth/login?message=already-verified", req.url));
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
    },
  });

  return NextResponse.redirect(new URL("/auth/login?message=email-verified", req.url));
}
