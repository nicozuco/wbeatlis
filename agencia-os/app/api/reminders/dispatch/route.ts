import { timingSafeEqual } from "node:crypto";

import { formatTime } from "@/lib/agenda";
import { dayKey } from "@/lib/agenda";
import { prisma } from "@/lib/prisma";
import { pushConfigured, sendPushToAll } from "@/lib/push";

export const dynamic = "force-dynamic";

// La llama pg_cron (supabase/migrations/20260915140000_agenda_reminders.sql)
// cuando hay recordatorios vencidos. No usa la sesión: se protege con el secreto
// compartido REMINDERS_CRON_SECRET y el proxy de login la deja pasar.
function authorized(request: Request) {
  const secret = process.env.REMINDERS_CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!pushConfigured()) return Response.json({ error: "Faltan las claves VAPID" }, { status: 503 });

  // Reclama los vencidos de forma atómica: si dos ejecuciones coinciden, cada
  // recordatorio se envía una sola vez.
  const due = await prisma.$queryRaw<{ id: string; title: string; notes: string | null; remindAt: Date }[]>`
    UPDATE "Reminder" SET "sentAt" = (now() AT TIME ZONE 'UTC'), "updatedAt" = (now() AT TIME ZONE 'UTC')
    WHERE "id" IN (
      SELECT "id" FROM "Reminder"
      WHERE "sentAt" IS NULL AND "doneAt" IS NULL AND "remindAt" <= (now() AT TIME ZONE 'UTC')
      ORDER BY "remindAt"
      LIMIT 50
      FOR UPDATE SKIP LOCKED
    )
    RETURNING "id", "title", "notes", "remindAt"`;

  const subject = new URL(request.url).origin;
  let delivered = 0;
  for (const reminder of due) {
    const result = await sendPushToAll({
      title: reminder.title,
      body: reminder.notes || `Recordatorio · ${formatTime(reminder.remindAt)}`,
      url: `/agenda?dia=${dayKey(reminder.remindAt)}`,
      tag: `reminder-${reminder.id}`,
    }, subject);
    delivered += result.delivered;
  }
  return Response.json({ reminders: due.length, delivered });
}
