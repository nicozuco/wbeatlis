import "server-only";

import webpush from "web-push";

import { prisma } from "@/lib/prisma";

export type PushPayload = { title: string; body: string; url: string; tag?: string };

export const pushConfigured = () => Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

// Envía el aviso a todos los dispositivos suscritos y borra las suscripciones que
// el servicio push ya no acepta (el navegador las revocó o se desinstaló la app).
// `subject` identifica al remitente ante los servicios push: una URL https o un mailto.
export async function sendPushToAll(payload: PushPayload, subject: string) {
  if (!pushConfigured()) throw new Error("Los avisos no están configurados en el servidor.");
  const vapidDetails = { subject: process.env.VAPID_SUBJECT || subject, publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, privateKey: process.env.VAPID_PRIVATE_KEY! };
  const subscriptions = await prisma.pushSubscription.findMany();
  const expired: string[] = [];
  const delivered: string[] = [];

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(payload),
        { vapidDetails, TTL: 60 * 60 * 12, urgency: "high" },
      );
      delivered.push(subscription.id);
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) expired.push(subscription.id);
    }
  }));

  if (expired.length > 0) await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  if (delivered.length > 0) await prisma.pushSubscription.updateMany({ where: { id: { in: delivered } }, data: { lastSuccessAt: new Date() } });
  return { delivered: delivered.length, total: subscriptions.length, expired: expired.length };
}
