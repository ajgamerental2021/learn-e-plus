import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`select 1`;
    return NextResponse.json({ status: "ok", db: "ok", ts: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      { status: "error", db: "error", message, ts: new Date().toISOString() },
      { status: 503 }
    );
  }
}
