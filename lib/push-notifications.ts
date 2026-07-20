import webPush from "web-push";
import { db } from "@/lib/db";

type PushPayload = {
  title: string;
  body: string;
  href?: string;
};

let configured = false;

function configureWebPush() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@learneplus.local",
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const uniqueUserIds = Array.from(new Set(userIds));
  if (uniqueUserIds.length === 0 || !configureWebPush()) return;

  const subscriptions = await db.pushSubscription.findMany({
    where: {
      userId: { in: uniqueUserIds },
      isActive: true,
      user: {
        OR: [
          { notificationPrefs: { is: null } },
          { notificationPrefs: { is: { pushEnabled: true } } },
        ],
      },
    },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
      );
    } catch {
      await db.pushSubscription.update({
        where: { id: subscription.id },
        data: { isActive: false },
      });
    }
  }));
}
