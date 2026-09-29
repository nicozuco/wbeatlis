import "server-only";

import type { LinkMedia } from "@/lib/mind-map-style";

// Vista previa de un enlace pegado en el mapa mental, como las tarjetas de
// Figma: título, descripción, miniatura y favicon leídos de las etiquetas Open
// Graph de la página. YouTube se resuelve con su oEmbed y el id del vídeo para
// poder reproducirlo dentro de la tarjeta.

const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 512_000;

export type LinkPreviewResult = { kind: "image"; url: string } | { kind: "link"; media: LinkMedia };

// Evita que el servidor se use para leer direcciones internas (localhost, IPs privadas).
function isPublicHttpUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^(0|10|127)\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (host.includes(":") && (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80"))) return false;
  return true;
}

export function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
  return match?.[1] ?? null;
}

function providerOf(url: URL): LinkMedia["provider"] {
  if (youtubeVideoId(url)) return "youtube";
  if (/(^|\.)instagram\.com$/.test(url.hostname)) return "instagram";
  return "web";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .trim();
}

function metaContent(html: string, keys: string[]) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (!name || !keys.includes(name)) continue;
    const content = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    const value = content?.[1] ?? content?.[2];
    if (value) return decodeHtml(value);
  }
  return undefined;
}

function faviconHref(html: string) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    if (!rel.split(/\s+/).some((token) => token === "icon" || token === "apple-touch-icon")) continue;
    const href = tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (href?.[1] ?? href?.[2]) return decodeHtml(href[1] ?? href[2]);
  }
  return undefined;
}

function absolute(value: string | undefined, base: URL) {
  if (!value) return undefined;
  try {
    const resolved = new URL(value, base);
    return resolved.protocol === "https:" || resolved.protocol === "http:" ? resolved.toString() : undefined;
  } catch {
    return undefined;
  }
}

const clip = (value: string | undefined, max: number) => (value && value.length > max ? `${value.slice(0, max - 1)}…` : value);

async function readLimited(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  void reader.cancel().catch(() => {});
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

async function youtubePreview(url: URL, videoId: string): Promise<LinkMedia> {
  const base: LinkMedia = {
    url: url.toString(),
    provider: "youtube",
    videoId,
    siteName: "YouTube",
    image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    favicon: "https://www.youtube.com/favicon.ico",
  };
  try {
    const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return base;
    const data = (await response.json()) as { title?: string; author_name?: string };
    return { ...base, title: clip(data.title, 300), description: clip(data.author_name, 300) };
  } catch {
    return base;
  }
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreviewResult> {
  const url = new URL(rawUrl);
  if (!isPublicHttpUrl(url)) throw new Error("Solo se admiten enlaces públicos http(s)");

  const videoId = youtubeVideoId(url);
  if (videoId) return { kind: "link", media: await youtubePreview(url, videoId) };

  const fallback: LinkMedia = { url: url.toString(), provider: providerOf(url), siteName: url.hostname.replace(/^www\./, ""), favicon: `${url.origin}/favicon.ico` };

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // Muchas webs solo sirven las etiquetas Open Graph a los rastreadores de vistas previa.
      headers: { "user-agent": "Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)", accept: "text/html,application/xhtml+xml,image/*;q=0.8,*/*;q=0.5" },
    });
    const finalUrl = new URL(response.url || url.toString());
    if (!isPublicHttpUrl(finalUrl)) return { kind: "link", media: fallback };
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.startsWith("image/")) {
      void response.body?.cancel().catch(() => {});
      return { kind: "image", url: url.toString() };
    }
    if (!response.ok || !contentType.includes("html")) {
      void response.body?.cancel().catch(() => {});
      return { kind: "link", media: fallback };
    }
    const html = await readLimited(response);
    const title = metaContent(html, ["og:title", "twitter:title"]) ?? decodeHtml(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
    return {
      kind: "link",
      media: {
        ...fallback,
        title: clip(title || undefined, 300),
        description: clip(metaContent(html, ["og:description", "twitter:description", "description"]), 400),
        image: absolute(metaContent(html, ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]), finalUrl),
        siteName: clip(metaContent(html, ["og:site_name"]), 100) ?? fallback.siteName,
        favicon: absolute(faviconHref(html), finalUrl) ?? fallback.favicon,
      },
    };
  } catch {
    return { kind: "link", media: fallback };
  }
}
