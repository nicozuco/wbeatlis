import { timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { isProposalEvent, proposalEventLabels } from "@/lib/proposals";
import { pushConfigured, sendPushToAll } from "@/lib/push";

export const dynamic = "force-dynamic";

// La llama api/visita.js del proyecto de propuestas (propuestas.atlisclinicas.com)
// cuando una clínica abre su propuesta, llega a la oferta, pulsa la demo o la comparte.
// No usa la sesión: se protege con el secreto compartido PROPUESTAS_EVENTS_SECRET
// y el proxy de login la deja pasar.
function authorized(request: Request) {
  const secret = process.env.PROPUESTAS_EVENTS_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const slug = text(body?.slug, 60);
  const event = text(body?.evento, 20);
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || !event || !isProposalEvent(event)) return Response.json({ error: "Evento no válido" }, { status: 400 });

  const clinicName = text(body?.clinica, 120) ?? slug;
  const city = text(body?.ciudad, 80);
  const device = text(body?.dispositivo, 20);
  await prisma.proposalEvent.create({
    data: { slug, clinicName, event, seconds: Math.max(0, Math.min(86400, Math.round(Number(body?.segundos) || 0))), device, city, country: text(body?.pais, 4) },
  });

  // Aviso al móvil en los momentos en que conviene llamar. Un fallo del aviso
  // no debe perder el evento, que ya está guardado.
  if (event !== "leida" && pushConfigured()) {
    try {
      await sendPushToAll({
        title: `${clinicName}: ${proposalEventLabels[event].toLowerCase()}`,
        body: [device, city].filter(Boolean).join(" · ") || "Propuesta",
        url: "/analitica?vista=propuestas",
        tag: `propuesta-${slug}-${event}`,
      }, new URL(request.url).origin);
    } catch {}
  }
  return new Response(null, { status: 204 });
}
