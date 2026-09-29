import { prisma } from "@/lib/prisma";
import { classifySource, deviceFrom, isSite } from "@/lib/site-analytics";

export const dynamic = "force-dynamic";

// Recibe las visitas de las webs públicas (script visitas.js de atlisclinicas.com
// y de las propuestas). Es pública como cualquier contador de visitas: solo
// acepta esos orígenes, valida cada campo y no guarda IP ni cookies. El proxy
// de login la deja pasar.
const ALLOWED_ORIGINS = new Set(["https://atlisclinicas.com", "https://www.atlisclinicas.com", "https://propuestas.atlisclinicas.com"]);
const BOTS = /bot|crawl|spider|preview|scan|headless|lighthouse|facebookexternalhit|slack|telegram|whatsapp\/|outlook|safelinks|proofpoint|mimecast|barracuda/i;

const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);
const cors = (origin: string | null): HeadersInit => (origin && ALLOWED_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {});
const done = (origin: string | null) => new Response(null, { status: 204, headers: cors(origin) });
const header = (request: Request, name: string) => {
  const value = request.headers.get(name);
  if (!value) return null;
  try { return decodeURIComponent(value).slice(0, 80); } catch { return value.slice(0, 80); }
};

export function OPTIONS(request: Request) {
  return done(request.headers.get("origin"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!origin || !ALLOWED_ORIGINS.has(origin) || BOTS.test(userAgent)) return done(origin);

  // sendBeacon envía text/plain para evitar la petición previa de CORS.
  let body: Record<string, unknown> | null = null;
  try { body = JSON.parse((await request.text()).slice(0, 4000)); } catch { body = null; }
  const id = text(body?.id, 40);
  const site = body?.site;
  const type = body?.type;
  const path = text(body?.path, 200);
  if (!id || !/^[a-z0-9]{12,40}$/.test(id) || !isSite(site) || !path?.startsWith("/") || !["view", "ping", "cta"].includes(type as string)) return done(origin);

  try {
    await record(request, { id, site, type: type as "view" | "ping" | "cta", path, body, userAgent });
  } catch {
    // Una visita perdida (p. ej. dos primeras vistas simultáneas de la misma
    // sesión) no debe dar error en la web.
  }
  return done(origin);
}

async function record(request: Request, { id, site, type, path, body, userAgent }: { id: string; site: "web" | "propuestas"; type: "view" | "ping" | "cta"; path: string; body: Record<string, unknown> | null; userAgent: string }) {
  const now = new Date();
  if (type === "view") {
    const utm = (body?.utm ?? {}) as Record<string, unknown>;
    const referrer = text(body?.ref, 300);
    await prisma.siteSession.upsert({
      where: { id },
      create: {
        id, site, landingPath: path, currentPath: path,
        source: classifySource({ utmSource: text(utm.source, 40), referrer, userAgent }),
        medium: text(utm.medium, 40), campaign: text(utm.campaign, 80),
        referrer: referrer ? referrer.replace(/[?#].*$/, "") : null,
        device: deviceFrom(userAgent), city: header(request, "x-vercel-ip-city"), country: header(request, "x-vercel-ip-country")?.slice(0, 4) ?? null,
        startedAt: now, lastSeenAt: now,
        pageviewRows: { create: { site, path, occurredAt: now } },
      },
      update: { currentPath: path, lastSeenAt: now, pageviews: { increment: 1 }, pageviewRows: { create: { site, path, occurredAt: now } } },
    });
  } else {
    // Una señal de una sesión que no existe (id inventado o anterior al
    // despliegue) no crea nada.
    await prisma.siteSession.updateMany({ where: { id, site }, data: { lastSeenAt: now, currentPath: path, ...(type === "cta" ? { converted: true } : {}) } });
  }
}
