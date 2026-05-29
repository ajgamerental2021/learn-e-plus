import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Called by cron or Render scheduled job
// GET /api/cron/streak-reminder?secret=CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Find users with streak >= 2 who haven't studied today
  const atRiskStreaks = await db.learningStreak.findMany({
    where: {
      currentStreak: { gte: 2 },
      lastActiveDate: {
        gte: yesterday,
        lt: today,
      },
    },
    select: { userId: true, currentStreak: true },
  });

  let sent = 0;
  for (const s of atRiskStreaks) {
    await db.notification.create({
      data: {
        userId: s.userId,
        type: "GENERAL",
        titleTh: "🔥 อย่าให้ streak หาย!",
        bodyTh: `คุณมี streak ${s.currentStreak} วัน — เรียนวันนี้เพื่อรักษาไว้`,
        isRead: false,
      },
    });
    sent++;
  }

  return NextResponse.json({ sent, checked: atRiskStreaks.length });
}
