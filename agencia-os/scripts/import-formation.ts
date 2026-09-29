// Importa el archivo Markdown privado de la formación (formacion-mkt-hackers)
// a las tablas Formation*. Es unidireccional: el Markdown es la fuente de verdad
// y cada importación reemplaza por completo la copia de la base.
//
//   npm run formation:import -- --dry-run          # solo muestra lo que importaría
//   npm run formation:import                       # importa
//   npm run formation:import -- --source <carpeta>  # otra ubicación del archivo

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { formationProgramById, type FormationProgramId } from "../lib/formation";
import {
  detectTools,
  formatTotalDuration,
  GUIDE_COURSE_ID,
  GUIDE_LESSON_SLUG,
  monthTitle,
  normalizeSearchText,
  parseDuration,
  type FormationSegmentKind,
  type FormationStatus,
} from "../lib/formation-content";
import { countWords, firstHeading, splitMarkdownSections, stripFrontmatter } from "../lib/formation-markdown";

const COURSE_PROGRAMS: Record<string, FormationProgramId> = {
  "tutorias-agentes": "agents-tutoring",
  ventas: "sales",
  "agencia-ia": "agency",
  "agentes-inicial": "agents-initial",
  "contenido-ia": "content-ai",
  claude: "claude",
  mentalidad: "mindset",
  "automatizacion-inicial": "automation-initial",
  "agentes-avanzado": "agents-advanced",
  "automatizacion-avanzada": "automation-advanced",
  "tutorias-negocio": "business-tutoring",
  "meta-ads": "meta-ads",
};

// Programa Core arranca el recorrido; el onboarding va justo después.
const COURSE_PRIORITY = ["programa-core", "onboarding"];

const LESSON_FILES = ["apuntes.md", "clase.md", "transcripcion.md", "transcripcion-parcial.md", "visuales.md", "estado.md"];
const SKIPPED_DIRS = new Set(["capturas", "documentos"]);
const DOCUMENT_TYPES: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

type CatalogEntry = { slug: string; title: string; courseUrl: string; displayedLessonCount: number };

type LessonDraft = {
  id: string;
  courseId: string;
  slug: string;
  sourcePath: string;
  title: string;
  moduleKey: string;
  moduleTitle: string;
  modulePosition: number;
  sectionTitle: string | null;
  sectionOrder: number[];
  leafOrder: number;
  position: number;
  lessonDate: string | null;
  durationSeconds: number | null;
  campusUrl: string | null;
  status: FormationStatus;
  notesMd: string | null;
  transcriptMd: string | null;
  visualsMd: string | null;
  statusMd: string | null;
  tools: string[];
  wordCount: number;
  documents: { name: string; contentType: string; data: Buffer }[];
};

const warnings: string[] = [];

function parseArgs() {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf("--source");
  return {
    dryRun: args.includes("--dry-run"),
    source: sourceIndex >= 0 ? args[sourceIndex + 1] : process.env.FORMATION_SOURCE_DIR ?? "../formacion-mkt-hackers",
  };
}

function readText(file: string) {
  return existsSync(file) ? readFileSync(file, "utf8").replace(/^﻿/, "") : null;
}

function directories(dir: string) {
  return existsSync(dir) ? readdirSync(dir).filter((name) => !name.startsWith(".") && statSync(path.join(dir, name)).isDirectory()) : [];
}

// Orden natural de carpetas: "leccion-03", "tema-b", "l3", "parte-01"…
function orderOf(name: string) {
  const numbered = name.match(/^(?:modulo|leccion|tema|parte|l)-?(\d+)(?:-|$)/);
  if (numbered) return Number(numbered[1]);
  const lettered = name.match(/^tema-([a-z])(?:-|$)/);
  if (lettered) return lettered[1].charCodeAt(0) - 96;
  return 1000;
}

function humanize(slug: string) {
  const acronyms: Record<string, string> = { ia: "IA", ghl: "GHL", rrss: "RRSS", roi: "ROI", mrr: "MRR", bofu: "BOFU", n8n: "n8n", crm: "CRM" };
  const words = slug.replace(/^(?:\d{4}-\d{2}-\d{2}|modulo-\d+|leccion-\d+|tema-[a-z\d]+|parte-\d+|l\d+)-?/, "").split("-").filter(Boolean);
  const text = words.map((word) => acronyms[word] ?? word).join(" ");
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : slug;
}

// Quita prefijos de archivo ("Apuntes —"), de numeración ("Módulo 3 ·",
// "Lección 2 —", "L1 ·", "A —") y sufijos de estado ("— transcripción parcial"):
// el módulo y el orden ya se ven en la estructura del curso.
function cleanTitle(title: string) {
  let text = title.trim().replace(/\.$/, "");
  text = text.replace(/^(?:Apuntes|Notas visuales|Visuales|Transcripción(?: bruta| parcial)?)\s*[—–·:|-]\s*/i, "");
  text = text.replace(/^M[oó]dulo \d+\s*[·—–-]\s*/i, "");
  text = text.replace(/^(?:Lecci[oó]n|Tema|L)\s*[\dA-Z]{1,2}\s*[·—–:-]\s*/, "");
  text = text.replace(/^[A-Z\d]{1,2}\s*[·—–]\s+/, "");
  text = text.replace(/\s*[—–-]\s*transcripci[oó]n[^—–]*$/i, "");
  return text.trim();
}

const GENERIC_TITLE = /^(?:(?:M[oó]dulo \d+\s*·\s*)?(?:Lecci[oó]n|Tema|Parte) [\w\d]+|Estado.*|de captura|de revisi[oó]n|Revisi[oó]n visual.*|Apuntes)$/i;

// Tabla de avance del README ("| Módulo 8 · Vender · Tema 2 | La demo perfecta | Vídeo completo (16:09)… | `clases/…/` |").
function readLessonTable(readme: string | null) {
  const rows = new Map<string, { title: string; note: string }>();
  for (const line of readme?.split(/\r?\n/) ?? []) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const pathCell = cells.at(-1)?.match(/`(clases\/[^`]+?)\/?`/);
    if (!pathCell || cells.length < 4) continue;
    rows.set(pathCell[1], { title: cells[1], note: cells[2] });
  }
  return rows;
}

function estadoLessonLine(estado: string | null) {
  const line = estado?.match(/^[-*]\s*Lecci[oó]n:\s*(.+)$/m)?.[1];
  if (!line) return null;
  const parts = line.split(/\s+[—–]\s+/);
  return parts.length > 1 ? parts.slice(1).join(" — ") : line;
}

// Índice de módulos del README del curso: "### Módulo N · Título" y sus líneas.
function readModuleIndex(readme: string | null) {
  const modules = new Map<number, { title: string; lines: string[] }>();
  if (!readme) return modules;
  let current: { title: string; lines: string[] } | null = null;
  for (const line of readme.split(/\r?\n/)) {
    const heading = line.match(/^###\s+(M[oó]dulo\s+(\d+)\s*·.*)$/);
    if (heading) {
      current = { title: heading[1].trim(), lines: [] };
      modules.set(Number(heading[2]), current);
      continue;
    }
    if (/^##\s/.test(line) || /^###\s+(?:Cierre|Examen)/i.test(line)) current = null;
    if (current && /^(?:###\s|[-*]\s|\d+\.\s)/.test(line)) current.lines.push(line);
  }
  return modules;
}

function resolveSection(dirName: string, lines: string[]) {
  const cleaned = lines.map((line) => line.replace(/^###\s+(?:Bloque\s*·\s*)?|^[-*]\s+|^\d+\.\s+/g, "").trim());
  const numbered = dirName.match(/^(?:l|leccion)-?(\d+)(?:-|$)/);
  let index = -1;
  if (numbered) {
    const n = Number(numbered[1]);
    index = cleaned.findIndex((line) => new RegExp(`^(?:L${n}\\b|Lecci[oó]n ${n}\\b)`, "i").test(line));
  }
  if (index < 0) {
    const words = dirName.split("-").filter((word) => word.length > 2 && !/^\d+$/.test(word) && !["leccion", "tema", "parte", "modulo"].includes(word));
    if (words.length) index = cleaned.findIndex((line) => { const normalized = normalizeSearchText(line); return words.every((word) => normalized.includes(word)); });
  }
  if (index < 0) return { title: humanize(dirName), order: 10_000 + orderOf(dirName) };
  const title = cleaned[index].replace(/^L\d+\s+/, "").replace(/^Lecci[oó]n \d+\s*[–—-]\s*/i, "").trim();
  return { title, order: index };
}

function classifyStatus(hasTranscript: boolean, partialFile: boolean, hasNotes: boolean, statusText: string) {
  const relevant = statusText.split(/\r?\n/).filter((line) => !/siguiente/i.test(line)).join(" ");
  const complete = /complet[ao]|transcripcion-completa|hasta el final/i.test(relevant);
  const incomplete = /pendiente|hueco|parcial|truncad|incomplet|en curso|falta|no se marca como completa|dudos/i.test(relevant);
  if (hasTranscript) return !partialFile && complete && !incomplete ? "complete" : "partial";
  if (hasNotes) return "notes";
  return "pending";
}

function findCampusUrl(texts: string[]) {
  for (const text of texts) {
    const match = text.match(/https:\/\/campus\.mkthackers\.com\/cursos\/[^\s)>\]]+\/lecciones\/[^\s)>\]]+/);
    if (match) return match[0];
  }
  return null;
}

function findDuration(texts: string[]) {
  const patterns = [
    /Duraci[oó]n[^:\n]*:\**\s*(\d{1,2}:\d{2}(?::\d{2})?)/i,
    /V[ií]deo[^\n]{0,40}?\((\d{1,2}:\d{2}(?::\d{2})?)\)/i,
    /\*\*V[ií]deo:\*\*\s*(\d{1,2}:\d{2}(?::\d{2})?)/i,
    /(?:V[ií]deo|Reproducci[oó]n)[^\n]{0,40}?\d{1,2}:\d{2}\s*[–-]\s*(\d{1,2}:\d{2}(?::\d{2})?)/i,
    /reproducid[oa][^\n]{0,40}?\((\d{1,2}:\d{2}(?::\d{2})?)\)/i,
  ];
  for (const pattern of patterns) {
    for (const text of texts) {
      const match = text.match(pattern);
      if (match) return parseDuration(match[1]);
    }
  }
  return null;
}

function readDocuments(dir: string) {
  const docsDir = path.join(dir, "documentos");
  if (!existsSync(docsDir)) return [];
  return readdirSync(docsDir).sort().flatMap((name) => {
    const extension = name.split(".").pop()?.toLowerCase() ?? "";
    const contentType = DOCUMENT_TYPES[extension];
    const file = path.join(docsDir, name);
    if (!contentType || !statSync(file).isFile()) return [];
    const data = readFileSync(file);
    if (data.length > MAX_DOCUMENT_BYTES) {
      warnings.push(`Documento demasiado grande, no se importa: ${file}`);
      return [];
    }
    return [{ name, contentType, data }];
  });
}

function findLessonDirs(dir: string, found: string[] = []) {
  const files = existsSync(dir) ? readdirSync(dir) : [];
  if (files.some((name) => LESSON_FILES.includes(name))) found.push(dir);
  for (const child of directories(dir)) if (!SKIPPED_DIRS.has(child)) findLessonDirs(path.join(dir, child), found);
  return found;
}

function readLesson(courseId: string, clasesDir: string, dir: string, modules: ReturnType<typeof readModuleIndex>, table: ReturnType<typeof readLessonTable>): LessonDraft {
  const read = (name: string) => readText(path.join(dir, name));
  const clase = read("clase.md");
  const transcriptFull = read("transcripcion.md");
  const transcriptPartial = transcriptFull ? null : read("transcripcion-parcial.md");
  const apuntesRaw = read("apuntes.md");
  const apuntesFront = apuntesRaw ? stripFrontmatter(apuntesRaw) : null;
  const apuntes = apuntesFront?.body ?? null;
  const visualsRaw = read("visuales.md");
  const visuals = visualsRaw ? stripFrontmatter(visualsRaw).body : null;
  const estado = read("estado.md");

  const claseParsed = clase ? stripFrontmatter(clase) : null;
  const transcriptParsed = stripFrontmatter(transcriptFull ?? transcriptPartial ?? "");
  const front = { ...(apuntesFront?.data ?? {}), ...transcriptParsed.data, ...(claseParsed?.data ?? {}) };
  const transcriptMd = transcriptParsed.body.trim() || null;
  const notesMd = [apuntes, claseParsed?.body].filter((text): text is string => Boolean(text?.trim())).join("\n\n").trim() || null;
  const visualsMd = visuals?.trim() || null;
  const statusMd = estado?.trim() || null;

  const rel = path.relative(clasesDir, dir).split(path.sep);
  const leaf = rel.at(-1) ?? "";
  const tableRow = table.get(["clases", ...rel].join("/"));
  const titleCandidates = [tableRow?.title, front.titulo, transcriptMd && firstHeading(transcriptMd), estadoLessonLine(estado), notesMd && firstHeading(notesMd), visualsMd && firstHeading(visualsMd), statusMd && firstHeading(statusMd)]
    .filter((value): value is string => Boolean(value))
    .map(cleanTitle)
    .filter(Boolean);
  const title = titleCandidates.find((candidate) => !GENERIC_TITLE.test(candidate)) ?? titleCandidates[0] ?? humanize(leaf);
  if (!titleCandidates.length) warnings.push(`Sin título en los archivos, se usa el nombre de carpeta: ${dir}`);

  const lessonDate = front.fecha?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? leaf.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  const moduleMatch = rel[0]?.match(/^modulo-(\d+)/);
  let moduleKey = "general";
  let moduleTitle = "Lecciones";
  let modulePosition = 0;
  let sectionDirs: string[] = rel.slice(0, -1);
  if (moduleMatch) {
    const number = Number(moduleMatch[1]);
    moduleKey = rel[0];
    moduleTitle = modules.get(number)?.title ?? `Módulo ${number} · ${humanize(rel[0])}`;
    modulePosition = number;
    sectionDirs = rel.slice(1, -1);
  } else if (lessonDate) {
    moduleKey = lessonDate.slice(0, 7);
    moduleTitle = monthTitle(lessonDate);
    modulePosition = -Number(lessonDate.slice(0, 7).replace("-", ""));
  }
  const moduleLines = moduleMatch ? modules.get(Number(moduleMatch[1]))?.lines ?? [] : [];
  const sections = sectionDirs.map((name) => resolveSection(name, moduleLines));

  const texts = [clase, transcriptFull, transcriptPartial, apuntes, visuals, estado, tableRow?.note].filter((text): text is string => Boolean(text));
  const body = [notesMd, transcriptMd, visualsMd].filter(Boolean).join("\n\n");

  return {
    id: "",
    courseId,
    slug: leaf,
    sourcePath: path.relative(path.dirname(path.dirname(clasesDir)), dir),
    title,
    moduleKey,
    moduleTitle,
    modulePosition,
    sectionTitle: sections.length ? sections.map((section) => section.title).join(" · ") : null,
    sectionOrder: sections.map((section) => section.order),
    leafOrder: lessonDate ? -Number(lessonDate.replace(/-/g, "")) : orderOf(leaf),
    position: 0,
    lessonDate,
    durationSeconds: parseDuration(front.duracion) ?? findDuration(texts),
    campusUrl: front.url?.startsWith("https://") ? front.url : findCampusUrl(texts),
    status: classifyStatus(Boolean(transcriptMd), Boolean(transcriptPartial), Boolean(notesMd), [front.estado ?? "", statusMd ?? ""].join("\n")),
    notesMd,
    transcriptMd,
    visualsMd,
    statusMd,
    tools: detectTools(title, body),
    wordCount: countWords(body),
    documents: readDocuments(dir),
  };
}

function compareLessons(a: LessonDraft, b: LessonDraft) {
  if (a.modulePosition !== b.modulePosition) return a.modulePosition - b.modulePosition;
  for (let i = 0; i < Math.max(a.sectionOrder.length, b.sectionOrder.length); i += 1) {
    const left = a.sectionOrder[i] ?? -1;
    const right = b.sectionOrder[i] ?? -1;
    if (left !== right) return left - right;
  }
  if (a.leafOrder !== b.leafOrder) return a.leafOrder - b.leafOrder;
  return a.sourcePath.localeCompare(b.sourcePath);
}

function buildSegments(lesson: LessonDraft) {
  const segments: {
    id: string; lessonId: string; kind: FormationSegmentKind; position: number; level: number;
    heading: string | null; anchor: string | null; timestamp: string | null; text: string; searchHead: string; searchBody: string;
  }[] = [];
  const context = [lesson.moduleTitle, lesson.sectionTitle].filter(Boolean).join(" · ");
  segments.push({
    id: `${lesson.id}--ficha`,
    lessonId: lesson.id,
    kind: "ficha",
    position: 0,
    level: 0,
    heading: null,
    anchor: null,
    timestamp: null,
    text: [lesson.title, context, lesson.tools.length ? `Herramientas: ${lesson.tools.join(", ")}` : ""].filter(Boolean).join("\n"),
    searchHead: normalizeSearchText(lesson.title),
    searchBody: normalizeSearchText(lesson.tools.join(" ")),
  });
  const docs: [FormationSegmentKind, string | null][] = [["notes", lesson.notesMd], ["transcript", lesson.transcriptMd], ["visuals", lesson.visualsMd]];
  for (const [kind, markdown] of docs) {
    if (!markdown) continue;
    splitMarkdownSections(markdown).forEach((section, index) => {
      if (!section.text && section.level <= 1) return;
      segments.push({
        id: `${lesson.id}--${kind}-${index}`,
        lessonId: lesson.id,
        kind,
        position: segments.length,
        level: section.level,
        heading: section.heading,
        anchor: section.anchor,
        timestamp: section.timestamp,
        text: section.text,
        searchHead: normalizeSearchText(section.heading ?? ""),
        searchBody: normalizeSearchText(section.text),
      });
    });
  }
  return segments;
}

// La guía unificada: guia/*.md en orden de nombre (README.md explica la sintaxis
// y no se importa). Los enlaces a lecciones del archivo (…/catalogo/<ruta>/apuntes.md)
// se convierten en enlaces de la app.
function readGuide(guideDir: string, lessons: LessonDraft[]): LessonDraft | null {
  if (!existsSync(guideDir)) return null;
  const files = readdirSync(guideDir).filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md").sort();
  if (!files.length) return null;
  const bySource = new Map(lessons.map((lesson) => [lesson.sourcePath.split(path.sep).join("/"), lesson]));
  const markdown = files.map((name) => readText(path.join(guideDir, name))?.trim() ?? "").join("\n\n").replace(/\]\(([^)\s]*catalogo\/[^)\s]+)\)/g, (match, href: string) => {
    const [target] = href.split("#");
    const relative = decodeURIComponent(target.slice(target.indexOf("catalogo/") + "catalogo/".length)).replace(/\/$/, "");
    const file = relative.match(/\/([\w-]+)\.md$/)?.[1];
    const lesson = bySource.get(file ? relative.slice(0, relative.lastIndexOf("/")) : relative);
    if (!lesson) {
      warnings.push(`Guía: enlace a una lección que no existe: ${href}`);
      return match;
    }
    const tab = file ? { apuntes: "apuntes", clase: "apuntes", transcripcion: "transcripcion", visuales: "visuales", estado: "estado" }[file] : undefined;
    return `](/formacion/${lesson.courseId}/${lesson.slug}${tab ? `?tab=${tab}` : ""})`;
  });
  return {
    id: `${GUIDE_COURSE_ID}--${GUIDE_LESSON_SLUG}`,
    courseId: GUIDE_COURSE_ID,
    slug: GUIDE_LESSON_SLUG,
    sourcePath: "guia",
    title: "Guía completa del curso",
    moduleKey: GUIDE_COURSE_ID,
    moduleTitle: "Guía completa",
    modulePosition: 0,
    sectionTitle: null,
    sectionOrder: [],
    leafOrder: 0,
    position: 0,
    lessonDate: null,
    durationSeconds: null,
    campusUrl: null,
    status: "complete",
    notesMd: markdown,
    transcriptMd: null,
    visualsMd: null,
    statusMd: null,
    tools: [],
    wordCount: countWords(markdown),
    documents: [],
  };
}

async function main() {
  const { dryRun, source } = parseArgs();
  const root = path.resolve(source);
  const catalogDir = path.join(root, "catalogo");
  const catalogFile = path.join(root, "catalogo.json");
  if (!existsSync(catalogFile)) throw new Error(`No encuentro ${catalogFile}. Usa --source <carpeta de formacion-mkt-hackers>.`);
  const catalog = JSON.parse(readFileSync(catalogFile, "utf8").replace(/^﻿/, "")) as CatalogEntry[];
  const slugs = new Set(catalog.map((entry) => entry.slug));

  // Carpetas extra con contenido de un curso del catálogo (p. ej. "tutorias-agentes-ia").
  const folders = directories(catalogDir);
  const aliases = new Map<string, string[]>(catalog.map((entry) => [entry.slug, folders.includes(entry.slug) ? [entry.slug] : []]));
  for (const folder of folders.filter((name) => !slugs.has(name))) {
    const owner = [...slugs].filter((slug) => folder.startsWith(`${slug}-`)).sort((a, b) => b.length - a.length)[0];
    if (owner) aliases.get(owner)?.push(folder);
    else warnings.push(`Carpeta sin curso en catalogo.json, se ignora: ${folder}`);
  }

  const ordered = [...catalog].sort((a, b) => {
    const rank = (slug: string) => (COURSE_PRIORITY.includes(slug) ? COURSE_PRIORITY.indexOf(slug) : COURSE_PRIORITY.length);
    return rank(a.slug) - rank(b.slug) || catalog.indexOf(a) - catalog.indexOf(b);
  });

  type CourseDraft = {
    id: string; title: string; programId: string | null; mentor: string | null; campusUrl: string | null;
    declaredLessons: number; position: number; overviewMd: string | null; readme: string | null;
  };
  const courses: CourseDraft[] = ordered.map((entry, position) => {
    const programId = COURSE_PROGRAMS[entry.slug] as FormationProgramId | undefined;
    const readme = readText(path.join(catalogDir, entry.slug, "README.md"));
    return {
      id: entry.slug,
      title: entry.title,
      programId: programId ?? null,
      mentor: programId ? (formationProgramById[programId].mentor as string) : null,
      campusUrl: entry.courseUrl,
      declaredLessons: entry.displayedLessonCount,
      position,
      overviewMd: readme?.replace(/^#\s+.*\r?\n/, "").trim() || null,
      readme,
    };
  });

  const lessons: LessonDraft[] = [];
  for (const course of courses) {
    const modules = readModuleIndex(course.readme);
    const table = readLessonTable(course.readme);
    const drafts = (aliases.get(course.id) ?? []).flatMap((folder) => {
      const clasesDir = path.join(catalogDir, folder, "clases");
      return findLessonDirs(clasesDir).map((dir) => readLesson(course.id, clasesDir, dir, modules, table));
    });
    const leafCount = new Map<string, number>();
    for (const draft of drafts) leafCount.set(draft.slug, (leafCount.get(draft.slug) ?? 0) + 1);
    for (const draft of drafts) {
      if ((leafCount.get(draft.slug) ?? 0) > 1) draft.slug = draft.sourcePath.split(path.sep).slice(-2).join("-");
      draft.id = `${course.id}--${draft.slug}`;
    }
    drafts.sort(compareLessons).forEach((draft, index) => { draft.position = index; });
    lessons.push(...drafts);
  }

  const guide = readGuide(path.join(root, "guia"), lessons);
  if (guide) {
    courses.push({
      id: GUIDE_COURSE_ID, title: "Guía completa", programId: null, mentor: null, campusUrl: null,
      declaredLessons: 0, position: courses.length, overviewMd: null, readme: null,
    });
    lessons.push(guide);
  }

  const segments = lessons.flatMap(buildSegments);
  const documents = lessons.flatMap((lesson) => lesson.documents.map((doc, position) => ({
    id: `${lesson.id}--doc-${position}`,
    lessonId: lesson.id,
    name: doc.name,
    contentType: doc.contentType,
    size: doc.data.length,
    position,
    data: doc.data,
  })));

  const byStatus = lessons.reduce<Record<string, number>>((acc, lesson) => ({ ...acc, [lesson.status]: (acc[lesson.status] ?? 0) + 1 }), {});
  const textBytes = segments.reduce((sum, segment) => sum + Buffer.byteLength(segment.text) + Buffer.byteLength(segment.searchBody), 0)
    + lessons.reduce((sum, lesson) => sum + [lesson.notesMd, lesson.transcriptMd, lesson.visualsMd, lesson.statusMd].reduce((s, text) => s + Buffer.byteLength(text ?? ""), 0), 0);
  const totalSeconds = lessons.reduce((sum, lesson) => sum + (lesson.durationSeconds ?? 0), 0);

  if (dryRun) {
    for (const lesson of lessons) {
      console.log([lesson.courseId, lesson.position, lesson.moduleTitle, lesson.sectionTitle ?? "", lesson.title, lesson.status, lesson.durationSeconds ?? "", lesson.campusUrl ? "url" : "sin-url", lesson.tools.join(",")].join(" | "));
    }
  }
  console.log(`\nCursos: ${courses.length} · Lecciones: ${lessons.length} (${Object.entries(byStatus).map(([status, count]) => `${status} ${count}`).join(", ")})`);
  console.log(`Apartados buscables: ${segments.length} · Documentos: ${documents.length} (${(documents.reduce((sum, doc) => sum + doc.size, 0) / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`Texto: ${(textBytes / 1024 / 1024).toFixed(2)} MB · Vídeo cubierto: ${formatTotalDuration(totalSeconds)}`);
  for (const warning of warnings) console.warn(`Aviso: ${warning}`);
  if (dryRun) return;

  if (typeof process.loadEnvFile === "function" && existsSync(".env")) process.loadEnvFile(".env");
  const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.formationCourse.deleteMany({});
      await tx.formationCourse.createMany({
        data: courses.map((course) => ({
          id: course.id, title: course.title, programId: course.programId, mentor: course.mentor, campusUrl: course.campusUrl,
          declaredLessons: course.declaredLessons, position: course.position, overviewMd: course.overviewMd,
        })),
      });
      await tx.formationLesson.createMany({
        data: lessons.map((lesson) => ({
          id: lesson.id, courseId: lesson.courseId, slug: lesson.slug, sourcePath: lesson.sourcePath, title: lesson.title,
          moduleKey: lesson.moduleKey, moduleTitle: lesson.moduleTitle, modulePosition: lesson.modulePosition,
          sectionTitle: lesson.sectionTitle, position: lesson.position, lessonDate: lesson.lessonDate,
          durationSeconds: lesson.durationSeconds, campusUrl: lesson.campusUrl, status: lesson.status,
          notesMd: lesson.notesMd, transcriptMd: lesson.transcriptMd, visualsMd: lesson.visualsMd, statusMd: lesson.statusMd,
          tools: lesson.tools, wordCount: lesson.wordCount,
        })),
      });
      for (let i = 0; i < segments.length; i += 500) await tx.formationSegment.createMany({ data: segments.slice(i, i + 500) });
      for (const document of documents) await tx.formationDocument.create({ data: { ...document, data: new Uint8Array(document.data) } });
    }, { timeout: 180_000, maxWait: 20_000 });
    const [size] = await prisma.$queryRaw<{ size: string }[]>`SELECT pg_size_pretty(pg_database_size(current_database())) AS size`;
    console.log(`Importación completada. Tamaño de la base de datos: ${size.size}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
