// Utilidades puras de la biblioteca de Formación, compartidas por el importador,
// las páginas del servidor y el renderizado de Markdown.

// La guía unificada se guarda como un curso especial con una sola "lección".
export const GUIDE_COURSE_ID = "guia";
export const GUIDE_LESSON_SLUG = "completa";
export const GUIDE_PATH = "/formacion/guia";

export type FormationDocKind = "notes" | "transcript" | "visuals";
export type FormationSegmentKind = FormationDocKind | "ficha";

export const formationDocTabs: { kind: FormationDocKind; tab: string; label: string }[] = [
  { kind: "notes", tab: "apuntes", label: "Apuntes" },
  { kind: "transcript", tab: "transcripcion", label: "Transcripción" },
  { kind: "visuals", tab: "visuales", label: "Visuales" },
];

export const formationKindLabels: Record<FormationSegmentKind, string> = {
  ficha: "Ficha",
  notes: "Apuntes",
  transcript: "Transcripción",
  visuals: "Visuales",
};

export type FormationStatus = "complete" | "partial" | "notes" | "pending";

export const formationStatusMeta: Record<FormationStatus, { label: string; tone: "success" | "warning" | "info" | "neutral"; hint: string }> = {
  complete: { label: "Completa", tone: "success", hint: "Transcripción completa y revisada." },
  partial: { label: "Con huecos", tone: "warning", hint: "Hay transcripción, pero con tramos pendientes o sin revisar." },
  notes: { label: "Solo apuntes", tone: "info", hint: "Apuntes de lo que se ve en pantalla; falta la transcripción hablada." },
  pending: { label: "Pendiente", tone: "neutral", hint: "Capturada solo en parte; revisa el estado." },
};

export function isFormationStatus(value: string): value is FormationStatus {
  return value in formationStatusMeta;
}

// Minúsculas y sin tildes. Se aplica carácter a carácter para que cada posición
// del texto normalizado corresponda a la misma posición del original.
function foldChar(char: string) {
  return char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function normalizeSearchText(text: string) {
  return Array.from(text, foldChar).join("").replace(/\s+/g, " ").trim();
}

export function searchTerms(query: string, max = 8) {
  const words = normalizeSearchText(query).split(/[^a-z0-9]+/).filter((word) => word.length >= 2);
  return [...new Set(words)].slice(0, max);
}

// Cada término se busca como prefijo ("automat" encuentra "automatización").
// Los términos solo contienen [a-z0-9], así que no pueden romper la sintaxis de tsquery.
export function buildTsQuery(terms: string[]) {
  return terms.map((term) => `${term}:*`).join(" & ");
}

// La búsqueda de Postgres reduce las palabras a su raíz; para resaltar en el
// texto se usa una raíz aproximada del término.
export function highlightStems(terms: string[]) {
  return terms.map((term) => (term.length <= 5 ? term : term.slice(0, Math.max(5, Math.ceil(term.length * 0.75)))));
}

type Range = { start: number; end: number };

export function findTermRanges(text: string, stems: string[]): Range[] {
  if (!stems.length || !text) return [];
  const chars = Array.from(text);
  const folded: string[] = [];
  const origin: number[] = [];
  let offset = 0;
  for (const char of chars) {
    const f = foldChar(char);
    for (const piece of f) {
      folded.push(piece);
      origin.push(offset);
    }
    offset += char.length;
  }
  const haystack = folded.join("");
  const ranges: Range[] = [];
  for (const stem of stems) {
    let from = 0;
    while (from <= haystack.length - stem.length) {
      const index = haystack.indexOf(stem, from);
      if (index === -1) break;
      const previous = haystack[index - 1];
      if (index === 0 || !/[a-z0-9]/.test(previous)) {
        let end = index + stem.length;
        while (end < haystack.length && /[a-z0-9]/.test(haystack[end])) end += 1;
        ranges.push({ start: origin[index], end: end < origin.length ? origin[end] : text.length });
      }
      from = index + stem.length;
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: Range[] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

export type TextPart = { text: string; hit: boolean };

export function splitHighlights(text: string, stems: string[]): TextPart[] {
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const range of findTermRanges(text, stems)) {
    if (range.start > cursor) parts.push({ text: text.slice(cursor, range.start), hit: false });
    parts.push({ text: text.slice(range.start, range.end), hit: true });
    cursor = range.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts;
}

// Fragmento de ~2·radius caracteres centrado en la zona con más coincidencias.
export function makeSnippet(text: string, stems: string[], radius = 150): TextPart[] {
  const flat = text.replace(/\s+/g, " ").trim();
  const ranges = findTermRanges(flat, stems);
  if (flat.length <= radius * 2) return splitHighlights(flat, stems);
  let center = 0;
  if (ranges.length) {
    let best = 0;
    for (const range of ranges) {
      const count = ranges.filter((other) => other.start >= range.start && other.start < range.start + radius * 2).length;
      if (count > best) {
        best = count;
        center = range.start + radius * 0.6;
      }
    }
  }
  let start = Math.max(0, Math.round(center - radius));
  const end = Math.min(flat.length, start + radius * 2);
  start = Math.max(0, end - radius * 2);
  const cutStart = start > 0 ? flat.indexOf(" ", start) + 1 || start : 0;
  const cutEnd = end < flat.length ? flat.lastIndexOf(" ", end) : flat.length;
  const slice = flat.slice(cutStart, cutEnd > cutStart ? cutEnd : end);
  return splitHighlights(`${cutStart > 0 ? "… " : ""}${slice}${end < flat.length ? " …" : ""}`, stems);
}

export function slugifyHeading(text: string) {
  const slug = normalizeSearchText(text).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64).replace(/-+$/, "");
  return slug || "seccion";
}

// Asigna anclas únicas en orden de aparición. El importador y el renderizado
// usan el mismo orden (encabezados h1–h4) para que los enlaces de búsqueda
// apunten al mismo apartado.
export function createHeadingSlugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugifyHeading(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

export const ANCHORED_HEADING_DEPTH = 4;

export function headingTimestamp(heading: string) {
  return heading.match(/^\s*[[(]?(\d{1,2}:\d{2}(?::\d{2})?)/)?.[1] ?? null;
}

export function parseDuration(value: string | null | undefined) {
  const match = value?.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const [a, b, c] = [Number(match[1]), Number(match[2]), match[3] === undefined ? null : Number(match[3])];
  return c === null ? a * 60 + b : a * 3600 + b * 60 + c;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}

export function formatTotalDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
}

// Herramientas reconocibles en el contenido. Una lección se etiqueta con una
// herramienta si aparece en el título o se menciona al menos dos veces.
export const formationTools: { name: string; pattern: RegExp }[] = [
  { name: "GoHighLevel", pattern: /\b(?:GHL|Go ?High ?Level|HighLevel)\b/gi },
  { name: "n8n", pattern: /\bn8n\b/gi },
  { name: "Claude", pattern: /\bClaude\b/g },
  { name: "ChatGPT", pattern: /\b(?:ChatGPT|OpenAI|GPT-?\d)/g },
  { name: "Gemini", pattern: /\bGemini\b/g },
  { name: "Google AI Studio", pattern: /\bAI Studio\b/gi },
  { name: "Make", pattern: /\bMake(?:\.com)?\b/g },
  { name: "Zapier", pattern: /\bZapier\b/gi },
  { name: "Twilio", pattern: /\bTwilio\b/gi },
  { name: "Retell AI", pattern: /\bRetell\b/gi },
  { name: "ElevenLabs", pattern: /\bEleven ?Labs\b/gi },
  { name: "Vapi", pattern: /\bVapi\b/gi },
  { name: "WhatsApp", pattern: /\bWhats[Aa]pp\b/g },
  { name: "Meta Ads", pattern: /\b(?:Meta Ads|Facebook Ads|Ads Manager|Administrador de anuncios|Business Manager)\b/gi },
  { name: "Instagram", pattern: /\bInstagram\b/gi },
  { name: "LinkedIn", pattern: /\bLinked[Ii]n\b/g },
  { name: "TikTok", pattern: /\bTik ?Tok\b/gi },
  { name: "YouTube", pattern: /\bYou ?Tube\b/gi },
  { name: "Google Sheets", pattern: /\b(?:Google Sheets|Google Sheet|hoja de cálculo de Google)\b/gi },
  { name: "Google Calendar", pattern: /\bGoogle Calendar\b/gi },
  { name: "Canva", pattern: /\bCanva\b/g },
  { name: "CapCut", pattern: /\bCap ?Cut\b/gi },
  { name: "HeyGen", pattern: /\bHey ?Gen\b/gi },
  { name: "Notion", pattern: /\bNotion\b/g },
  { name: "Stripe", pattern: /\bStripe\b/g },
  { name: "Lovable", pattern: /\bLovable\b/g },
  { name: "Perplexity", pattern: /\bPerplexity\b/gi },
  { name: "Calendly", pattern: /\bCalendly\b/gi },
  { name: "ManyChat", pattern: /\bMany ?Chat\b/gi },
];

export function detectTools(title: string, body: string) {
  return formationTools
    .filter(({ pattern }) => {
      const inTitle = (title.match(pattern) ?? []).length > 0;
      return inTitle || (body.match(pattern) ?? []).length >= 2;
    })
    .map(({ name }) => name);
}

const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function monthTitle(isoDate: string) {
  const [year, month] = isoDate.split("-").map(Number);
  const name = monthNames[month - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export function formatLessonDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} de ${monthNames[month - 1]} de ${year}`;
}
