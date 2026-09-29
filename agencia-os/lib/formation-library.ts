import "server-only";

import { Prisma } from "@prisma/client";

import {
  buildTsQuery,
  findTermRanges,
  formationDocTabs,
  GUIDE_COURSE_ID,
  GUIDE_LESSON_SLUG,
  GUIDE_PATH,
  highlightStems,
  isFormationStatus,
  makeSnippet,
  searchTerms,
  type FormationSegmentKind,
  type FormationStatus,
  type TextPart,
} from "./formation-content";
import { prisma } from "./prisma";

export type LessonListItem = {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  moduleKey: string;
  moduleTitle: string;
  sectionTitle: string | null;
  lessonDate: string | null;
  durationSeconds: number | null;
  status: FormationStatus;
  tools: string[];
};

const lessonListSelect = {
  id: true, courseId: true, slug: true, title: true, moduleKey: true, moduleTitle: true, sectionTitle: true,
  lessonDate: true, durationSeconds: true, status: true, tools: true,
} satisfies Prisma.FormationLessonSelect;

function toListItem(lesson: Prisma.FormationLessonGetPayload<{ select: typeof lessonListSelect }>): LessonListItem {
  return { ...lesson, status: isFormationStatus(lesson.status) ? lesson.status : "pending" };
}

export function lessonHref(lesson: { courseId: string; slug: string }, options: { tab?: string; q?: string; anchor?: string | null } = {}) {
  const guide = lesson.courseId === GUIDE_COURSE_ID;
  const params = new URLSearchParams();
  if (options.tab && !guide) params.set("tab", options.tab);
  if (options.q) params.set("q", options.q);
  const query = params.toString();
  const base = guide ? GUIDE_PATH : `/formacion/${lesson.courseId}/${lesson.slug}`;
  return `${base}${query ? `?${query}` : ""}${options.anchor ? `#${options.anchor}` : ""}`;
}

export function tabForKind(kind: FormationSegmentKind) {
  return formationDocTabs.find((tab) => tab.kind === kind)?.tab;
}

export async function getFormationOverview() {
  const [courses, lessons] = await Promise.all([
    prisma.formationCourse.findMany({ where: { id: { not: GUIDE_COURSE_ID } }, orderBy: { position: "asc" }, select: { id: true, title: true, mentor: true, declaredLessons: true, campusUrl: true, importedAt: true } }),
    prisma.formationLesson.findMany({ where: { courseId: { not: GUIDE_COURSE_ID } }, select: { courseId: true, status: true, durationSeconds: true, tools: true } }),
  ]);
  const guide = await prisma.formationLesson.findUnique({ where: { courseId_slug: { courseId: GUIDE_COURSE_ID, slug: GUIDE_LESSON_SLUG } }, select: { wordCount: true } });
  const toolCounts = new Map<string, number>();
  for (const lesson of lessons) for (const tool of lesson.tools) toolCounts.set(tool, (toolCounts.get(tool) ?? 0) + 1);
  return {
    courses: courses.map((course) => {
      const own = lessons.filter((lesson) => lesson.courseId === course.id);
      const byStatus = own.reduce<Partial<Record<FormationStatus, number>>>((acc, lesson) => {
        const status = isFormationStatus(lesson.status) ? lesson.status : "pending";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});
      return { ...course, lessonCount: own.length, byStatus, durationSeconds: own.reduce((sum, lesson) => sum + (lesson.durationSeconds ?? 0), 0) };
    }),
    totals: {
      lessons: lessons.length,
      declared: courses.reduce((sum, course) => sum + course.declaredLessons, 0),
      complete: lessons.filter((lesson) => lesson.status === "complete").length,
      withTranscript: lessons.filter((lesson) => lesson.status === "complete" || lesson.status === "partial").length,
      durationSeconds: lessons.reduce((sum, lesson) => sum + (lesson.durationSeconds ?? 0), 0),
      coursesWithContent: new Set(lessons.map((lesson) => lesson.courseId)).size,
    },
    tools: [...toolCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count })),
    importedAt: courses[0]?.importedAt ?? null,
    guide,
  };
}

export async function getFormationCourse(courseId: string) {
  const course = await prisma.formationCourse.findUnique({ where: { id: courseId } });
  if (!course) return null;
  const lessons = await prisma.formationLesson.findMany({ where: { courseId }, orderBy: { position: "asc" }, select: lessonListSelect });
  return { course, lessons: lessons.map(toListItem) };
}

export async function getFormationLesson(courseId: string, slug: string) {
  const lesson = await prisma.formationLesson.findUnique({
    where: { courseId_slug: { courseId, slug } },
    include: {
      course: { select: { id: true, title: true, campusUrl: true, mentor: true } },
      documents: { orderBy: { position: "asc" }, select: { id: true, name: true, contentType: true, size: true } },
      segments: { where: { kind: { not: "ficha" }, heading: { not: null } }, orderBy: { position: "asc" }, select: { kind: true, heading: true, anchor: true, level: true, timestamp: true } },
    },
  });
  if (!lesson) return null;
  const [previous, next] = await Promise.all([
    prisma.formationLesson.findFirst({ where: { courseId, position: { lt: lesson.position } }, orderBy: { position: "desc" }, select: { courseId: true, slug: true, title: true } }),
    prisma.formationLesson.findFirst({ where: { courseId, position: { gt: lesson.position } }, orderBy: { position: "asc" }, select: { courseId: true, slug: true, title: true } }),
  ]);
  return { lesson: { ...lesson, status: isFormationStatus(lesson.status) ? lesson.status : ("pending" as FormationStatus) }, previous, next };
}

export async function getFormationGuide() {
  return prisma.formationLesson.findUnique({
    where: { courseId_slug: { courseId: GUIDE_COURSE_ID, slug: GUIDE_LESSON_SLUG } },
    select: {
      id: true, courseId: true, slug: true, notesMd: true, wordCount: true, importedAt: true,
      segments: { where: { kind: "notes", heading: { not: null } }, orderBy: { position: "asc" }, select: { heading: true, anchor: true, level: true } },
    },
  });
}

export async function getLessonsByTool(tool: string) {
  const lessons = await prisma.formationLesson.findMany({
    where: { tools: { has: tool } },
    orderBy: [{ course: { position: "asc" } }, { position: "asc" }],
    select: { ...lessonListSelect, course: { select: { title: true } } },
  });
  return lessons.map((lesson) => ({ ...toListItem(lesson), courseTitle: lesson.course.title }));
}

export async function getFormationDocument(id: string) {
  return prisma.formationDocument.findUnique({ where: { id } });
}

type SegmentHit = { id: string; lessonId: string; kind: FormationSegmentKind; heading: string | null; anchor: string | null; timestamp: string | null; text: string; rank: number };

export type FormationSearchResult = {
  lesson: LessonListItem & { courseTitle: string };
  score: number;
  hitCount: number;
  titleMatch: boolean;
  hits: { kind: FormationSegmentKind; heading: string | null; anchor: string | null; timestamp: string | null; href: string; snippet: TextPart[] }[];
};

async function querySegments(tsquery: string, lessonId?: string) {
  return prisma.$queryRaw<SegmentHit[]>(Prisma.sql`
    SELECT s.id, s."lessonId", s.kind, s.heading, s.anchor, s."timestamp", s.text,
           ts_rank_cd(s."searchVector", q.query, 1)::float8 AS rank
    FROM "FormationSegment" s, to_tsquery('spanish', ${tsquery}) AS q(query)
    WHERE s."searchVector" @@ q.query
    ${lessonId ? Prisma.sql`AND s."lessonId" = ${lessonId}` : Prisma.empty}
    ORDER BY rank DESC
    LIMIT 400`);
}

// Busca en todos los apartados. Primero exige todas las palabras en el mismo
// apartado; si no hay nada, acepta coincidencias parciales.
export async function searchFormation(query: string, options: { lessonId?: string } = {}) {
  const terms = searchTerms(query);
  if (!terms.length) return { terms, partial: false, results: [] as FormationSearchResult[] };
  let partial = false;
  let segments = await querySegments(buildTsQuery(terms), options.lessonId);
  if (!segments.length && terms.length > 1) {
    partial = true;
    segments = await querySegments(terms.map((term) => `${term}:*`).join(" | "), options.lessonId);
  }
  const lessonIds = [...new Set(segments.map((segment) => segment.lessonId))];
  const lessons = await prisma.formationLesson.findMany({ where: { id: { in: lessonIds } }, select: { ...lessonListSelect, course: { select: { title: true } } } });
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const stems = highlightStems(terms);

  const grouped = new Map<string, SegmentHit[]>();
  for (const segment of segments) grouped.set(segment.lessonId, [...(grouped.get(segment.lessonId) ?? []), segment]);

  const results: FormationSearchResult[] = [];
  for (const [lessonId, hits] of grouped) {
    const lesson = lessonById.get(lessonId);
    if (!lesson) continue;
    const content = hits.filter((hit) => hit.kind !== "ficha");
    const titleMatch = findTermRanges(lesson.title, stems).length > 0;
    const best = Math.max(...hits.map((hit) => hit.rank));
    results.push({
      lesson: { ...toListItem(lesson), courseTitle: lesson.course.title },
      score: best * (titleMatch ? 1.5 : 1) + Math.log1p(content.length) * 0.05,
      hitCount: content.length,
      titleMatch,
      hits: content.map((hit) => ({
        kind: hit.kind,
        heading: hit.heading,
        anchor: hit.anchor,
        timestamp: hit.timestamp,
        href: lessonHref(lesson, { tab: tabForKind(hit.kind), q: query, anchor: hit.anchor }),
        snippet: hit.text ? makeSnippet(hit.text, stems) : [],
      })),
    });
  }
  results.sort((a, b) => b.score - a.score);
  return { terms, partial, results };
}
