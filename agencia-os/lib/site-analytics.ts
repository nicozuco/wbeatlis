// Analítica de las webs públicas: atlisclinicas.com ("web") y las propuestas
// ("propuestas"). Una sesión = una pestaña abierta; se clasifica por su origen
// al entrar y se cuenta como conversión si pulsa un botón de demo.

export const sites = { web: "atlisclinicas.com", propuestas: "Propuestas" } as const;
export type SiteKey = keyof typeof sites;
export const isSite = (value: unknown): value is SiteKey => typeof value === "string" && value in sites;

// Sesiones con actividad en este margen cuentan como «en vivo». El script envía
// una señal cada 30 segundos mientras la pestaña está visible.
export const LIVE_WINDOW_MS = 75_000;

const OWN_HOSTS = /(^|\.)atlisclinicas\.com$/;
const UTM_ALIASES: Record<string, string> = {
  ig: "Instagram", instagram: "Instagram",
  fb: "Facebook", facebook: "Facebook", meta: "Facebook",
  google: "Google", linkedin: "LinkedIn", li: "LinkedIn",
  tiktok: "TikTok", whatsapp: "WhatsApp", wa: "WhatsApp",
  email: "Email", correo: "Email", mail: "Email", newsletter: "Email",
  x: "X", twitter: "X", youtube: "YouTube", yt: "YouTube",
};
// Los más específicos primero: mail.google.com es Email, no Google.
const REFERRERS: [RegExp, string][] = [
  [/(^|\.)(mail\.google\.com|outlook\.live\.com|outlook\.office\.com|mail\.yahoo\.com)$/, "Email"],
  [/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com)$/, "Asistentes IA"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "Facebook"],
  [/(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "X"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
];

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// Orden de preferencia: etiqueta utm del enlace, navegador interno de la app
// (Instagram y Facebook suelen ocultar la página anterior) y página anterior.
export function classifySource({ utmSource, referrer, userAgent }: { utmSource?: string | null; referrer?: string | null; userAgent?: string | null }) {
  const utm = utmSource?.trim().toLowerCase().slice(0, 40);
  if (utm) return UTM_ALIASES[utm] ?? capitalize(utm);
  if (/Instagram/i.test(userAgent ?? "")) return "Instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent ?? "")) return "Facebook";
  let host = "";
  try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, "").toLowerCase() : ""; } catch { host = ""; }
  if (!host) return "Directo";
  if (host === "propuestas.atlisclinicas.com") return "Propuestas";
  if (OWN_HOSTS.test(host)) return "Directo";
  for (const [pattern, name] of REFERRERS) if (pattern.test(host)) return name;
  return host;
}

export const deviceFrom = (userAgent: string) => /ipad|tablet/i.test(userAgent) ? "Tablet" : /mobile|iphone|android/i.test(userAgent) ? "Móvil" : "Ordenador";

export type SiteSessionRow = {
  id: string; site: string; source: string; landingPath: string; currentPath: string;
  device: string; city: string | null; pageviews: number; converted: boolean; startedAt: string; lastSeenAt: string;
};
export type SitePageviewRow = { site: string; path: string; occurredAt: string };
export type LiveVisitor = { site: string; currentPath: string; source: string; device: string; city: string | null; lastSeenAt: string };

const madridDay = (value: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date(value));
const count = <T,>(items: T[], key: (item: T) => string) => {
  const map = new Map<string, number>();
  for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
  return map;
};

// Los días del gráfico van de `from` a `now` (máximo 90 barras) para que los
// días sin visitas aparezcan a cero.
export function siteAnalytics(sessions: SiteSessionRow[], pageviews: SitePageviewRow[], now: string, from: string | null) {
  const conversions = sessions.filter((session) => session.converted).length;
  const bySource = [...count(sessions, (session) => session.source)].map(([source, total]) => {
    const converted = sessions.filter((session) => session.source === source && session.converted).length;
    return { source, total, converted, rate: total ? converted / total * 100 : null };
  }).sort((a, b) => b.total - a.total || a.source.localeCompare(b.source));

  const pages = [...count(pageviews, (view) => `${view.site}\u0000${view.path}`)].map(([key, views]) => {
    const [site, path] = key.split("\u0000");
    return { site, path, views };
  }).sort((a, b) => b.views - a.views).slice(0, 12);

  const perDay = count(sessions, (session) => madridDay(session.startedAt));
  const end = new Date(`${madridDay(now)}T12:00:00Z`);
  const firstSession = sessions.reduce<string | null>((min, session) => !min || session.startedAt < min ? session.startedAt : min, null);
  const start = new Date(`${from ?? (firstSession ? madridDay(firstSession) : madridDay(now))}T12:00:00Z`);
  const days: { day: string; label: string; visitas: number }[] = [];
  for (const cursor = new Date(Math.max(start.getTime(), end.getTime() - 89 * 86_400_000)); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const day = cursor.toISOString().slice(0, 10);
    days.push({ day, label: `${day.slice(8, 10)}/${day.slice(5, 7)}`, visitas: perDay.get(day) ?? 0 });
  }

  const ranked = (map: Map<string, number>) => [...map].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total);
  return {
    sessions: sessions.length,
    pageviews: pageviews.length,
    conversions,
    conversionRate: sessions.length ? conversions / sessions.length * 100 : null,
    bySource,
    pages,
    days,
    devices: ranked(count(sessions, (session) => session.device)),
    cities: ranked(count(sessions.filter((session) => session.city), (session) => session.city!)).slice(0, 8),
  };
}
