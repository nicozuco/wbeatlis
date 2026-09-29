// Texto con formato de las formas y pósits del mapa mental: HTML limitado a
// negrita, cursiva, subrayado, tachado, enlaces, listas y saltos de línea.
//
// El saneado no depende del DOM para poder usarse igual en el servidor (al
// guardar) y en el cliente (antes de pintar con innerHTML). Cada etiqueta se
// reconstruye desde cero: las permitidas salen sin atributos (salvo el href
// validado de los enlaces), el resto se descarta y cualquier "<" o ">" suelto
// del texto se escapa, así que no puede colarse ningún atributo ni etiqueta.

const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "s", "strike", "del", "a", "ul", "ol", "li", "br", "div", "p"]);
const VOID_TAGS = new Set(["br"]);
const TAG_PATTERN = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>/g;

function escapeText(text: string) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decodeEntities(value: string) {
  return value.replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Solo http(s) y mailto. Una dirección sin protocolo ("ejemplo.com") se trata como https.
export function normalizeLinkUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  return `https://${value.replace(/^\/+/, "")}`;
}

function hrefFrom(attributes: string) {
  const match = attributes.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i);
  if (!match) return null;
  return normalizeLinkUrl(decodeEntities(match[1] ?? match[2] ?? match[3] ?? ""));
}

export function sanitizeRichText(html: string): string {
  let result = "";
  let lastIndex = 0;
  for (const match of html.matchAll(TAG_PATTERN)) {
    result += escapeText(html.slice(lastIndex, match.index));
    lastIndex = match.index + match[0].length;
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (closing) {
      if (!VOID_TAGS.has(tag)) result += `</${tag}>`;
      continue;
    }
    if (tag === "a") {
      const href = hrefFrom(match[3]);
      result += href ? `<a href="${href.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">` : "<a>";
      continue;
    }
    result += `<${tag}>`;
  }
  return result + escapeText(html.slice(lastIndex));
}

export function richTextIsEmpty(html: string) {
  return decodeEntities(html.replace(TAG_PATTERN, "").replace(/&nbsp;/g, " ")).replace(/ /g, " ").trim() === "";
}

// Formato aplicado a una forma entera (seleccionada sin estar editando su texto).
// Si el texto ya tiene ese formato, se quita; si no, se aplica a todo.
const WRAPPERS = { bold: ["b", "strong"], strike: ["s", "strike", "del"] } as const;

function stripTags(html: string, tags: readonly string[]) {
  return html.replace(new RegExp(`</?(?:${tags.join("|")})\\b[^<>]*>`, "gi"), "");
}

function hasTag(html: string, tags: readonly string[]) {
  return new RegExp(`<(?:${tags.join("|")})\\b`, "i").test(html);
}

export function toggleWholeFormat(html: string, format: "bold" | "strike" | "list" | "link", url?: string | null): string {
  if (format === "bold" || format === "strike") {
    const tags = WRAPPERS[format];
    return hasTag(html, tags) ? stripTags(html, tags) : `<${tags[0]}>${html}</${tags[0]}>`;
  }
  if (format === "link") {
    const withoutLinks = stripTags(html, ["a"]);
    const href = url ? normalizeLinkUrl(url) : null;
    return href ? sanitizeRichText(`<a href="${href.replace(/"/g, "&quot;")}">${withoutLinks}</a>`) : withoutLinks;
  }
  if (hasTag(html, ["ul", "ol", "li"])) {
    return stripTags(html.replace(/<\/li>/gi, "<br>"), ["ul", "ol", "li"]).replace(/(<br>)+$/i, "");
  }
  // Cada bloque (div/p, que es lo que crea el editor al pulsar Intro) o <br> es una línea.
  const lines = html
    .replace(/<\/?(?:div|p)\b[^<>]*>/gi, "<br>")
    .split(/<br\s*\/?>/i)
    .filter((line) => !richTextIsEmpty(line));
  return lines.length ? `<ul>${lines.map((line) => `<li>${line}</li>`).join("")}</ul>` : html;
}

export function plainTextToRichText(text: string) {
  return escapeText(text.replace(/&/g, "&amp;")).replace(/\n/g, "<br>");
}
