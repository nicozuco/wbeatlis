import Link from "next/link";
import { ArrowRight, BookOpenText, Clock3, FileCheck2, Layers3, Map as MapIcon, X } from "lucide-react";

import { FormationSearchBox, FormationStatusChip, Highlighted, LessonRow, StatusLegend } from "@/components/formation/formation-ui";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { formationKindLabels, formatDuration, formatTotalDuration, GUIDE_PATH, type FormationSegmentKind } from "@/lib/formation-content";
import { getFormationOverview, getLessonsByTool, lessonHref, searchFormation } from "@/lib/formation-library";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; curso?: string; herramienta?: string; en?: string }>;

function filterHref(params: { q?: string; curso?: string; herramienta?: string; en?: string }) {
  const search = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const query = search.toString();
  return `/formacion${query ? `?${query}` : ""}`;
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm transition-colors ${active ? "border-accent/40 bg-accent-soft text-accent" : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"}`}
    >
      {children}
    </Link>
  );
}

export default async function FormationPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q?.trim().slice(0, 200) ?? "";
  const tool = params.herramienta?.trim() || undefined;
  const overview = await getFormationOverview();

  if (!overview.courses.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Formación" description="Biblioteca del curso MKT Hackers" />
        <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">
          Todavía no se ha importado el contenido. Ejecuta <code className="font-mono text-accent">npm run formation:import</code> para cargar el archivo de <code className="font-mono">formacion-mkt-hackers</code>.
        </div>
      </div>
    );
  }

  const { totals } = overview;
  const header = (
    <PageHeader
      title="Formación"
      description={`Curso MKT Hackers · ${totals.lessons} lecciones capturadas de ${totals.declared} · ${formatTotalDuration(totals.durationSeconds)} de vídeo`}
    />
  );

  if (q) {
    const { results, partial, terms } = await searchFormation(q);
    const courseFacets = new Map<string, { title: string; count: number }>();
    for (const result of results) {
      const facet = courseFacets.get(result.lesson.courseId) ?? { title: result.lesson.courseTitle, count: 0 };
      facet.count += 1;
      courseFacets.set(result.lesson.courseId, facet);
    }
    const kinds = (["notes", "transcript", "visuals"] as FormationSegmentKind[]).filter((kind) => results.some((result) => result.hits.some((hit) => hit.kind === kind)));
    const kind = kinds.find((value) => value === params.en);
    const filtered = results
      .filter((result) => !params.curso || result.lesson.courseId === params.curso)
      .filter((result) => !tool || result.lesson.tools.includes(tool))
      .map((result) => (kind ? { ...result, hits: result.hits.filter((hit) => hit.kind === kind) } : result))
      .filter((result) => !kind || result.hits.length);
    const base = { q, curso: params.curso, herramienta: tool, en: kind };

    return (
      <div className="space-y-6">
        {header}
        <FormationSearchBox defaultValue={q} hidden={{ curso: params.curso, herramienta: tool }} />
        {terms.length === 0 ? (
          <p className="text-text-muted">Escribe al menos una palabra de dos letras.</p>
        ) : (
          <>
            <div className="space-y-3">
              {courseFacets.size > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="section-label mr-1">Curso</span>
                  <FilterChip href={filterHref({ ...base, curso: undefined })} active={!params.curso}>Todos <span className="font-mono text-xs tabular-nums">{results.length}</span></FilterChip>
                  {[...courseFacets.entries()].map(([id, facet]) => (
                    <FilterChip key={id} href={filterHref({ ...base, curso: id })} active={params.curso === id}>{facet.title} <span className="font-mono text-xs tabular-nums">{facet.count}</span></FilterChip>
                  ))}
                </div>
              ) : null}
              {kinds.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="section-label mr-1">Buscar en</span>
                  <FilterChip href={filterHref({ ...base, en: undefined })} active={!kind}>Todo</FilterChip>
                  {kinds.map((value) => <FilterChip key={value} href={filterHref({ ...base, en: value })} active={kind === value}>{formationKindLabels[value]}</FilterChip>)}
                </div>
              ) : null}
              {tool ? (
                <div className="flex items-center gap-2">
                  <span className="section-label mr-1">Herramienta</span>
                  <FilterChip href={filterHref({ ...base, herramienta: undefined })} active>{tool}<X className="size-3.5" /></FilterChip>
                </div>
              ) : null}
            </div>

            <p className="text-sm text-text-muted" aria-live="polite">
              {filtered.length === 0
                ? `No hay resultados para «${q}».`
                : `${filtered.length} ${filtered.length === 1 ? "lección" : "lecciones"} con «${q}»${partial ? " · ninguna contiene todas las palabras en el mismo apartado; se muestran coincidencias parciales" : ""}.`}
            </p>

            <ol className="space-y-3">
              {filtered.slice(0, 60).map((result) => {
                const duration = formatDuration(result.lesson.durationSeconds);
                const context = [result.lesson.courseTitle, result.lesson.moduleTitle, result.lesson.sectionTitle].filter(Boolean).join(" · ");
                return (
                  <li key={result.lesson.id} className="rounded-xl border border-border bg-surface">
                    <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-text-faint">{context}</p>
                        <Link href={lessonHref(result.lesson, { q })} className="font-heading text-lg font-semibold leading-snug text-text hover:text-accent">
                          {result.lesson.title}
                        </Link>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {duration ? <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-text-muted"><Clock3 className="size-3.5" />{duration}</span> : null}
                        <FormationStatusChip status={result.lesson.status} />
                      </div>
                    </div>
                    {result.hits.length ? (
                      <ul className="divide-y divide-border">
                        {result.hits.slice(0, 3).map((hit, index) => (
                          <li key={`${hit.anchor}-${index}`}>
                            <Link href={hit.href} className="block px-5 py-3 transition-colors hover:bg-surface-raised">
                              <p className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                                <span className="status-chip tone-accent">{formationKindLabels[hit.kind]}</span>
                                {hit.timestamp ? <span className="font-mono tabular-nums text-text-muted">{hit.timestamp}</span> : null}
                                {hit.heading ? <span className="font-medium text-text">{hit.heading}</span> : null}
                              </p>
                              {hit.snippet.length ? <p className="text-sm leading-6 text-text-muted"><Highlighted parts={hit.snippet} /></p> : null}
                            </Link>
                          </li>
                        ))}
                        {result.hits.length > 3 ? (
                          <li className="px-5 py-2.5 text-xs text-text-muted">
                            <Link href={lessonHref(result.lesson, { q })} className="hover:text-accent">+{result.hits.length - 3} apartados más con coincidencias en esta lección</Link>
                          </li>
                        ) : null}
                      </ul>
                    ) : (
                      <p className="px-5 py-3 text-sm text-text-muted">Coincide con el título de la lección.</p>
                    )}
                  </li>
                );
              })}
            </ol>
            {filtered.length > 60 ? <p className="text-sm text-text-muted">Se muestran las 60 lecciones más relevantes. Añade palabras o filtra por curso para afinar.</p> : null}
          </>
        )}
      </div>
    );
  }

  if (tool) {
    const lessons = await getLessonsByTool(tool);
    return (
      <div className="space-y-6">
        {header}
        <FormationSearchBox hidden={{ herramienta: tool }} placeholder={`Busca dentro de las lecciones sobre ${tool}…`} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="section-label mr-1">Herramienta</span>
          <FilterChip href="/formacion" active>{tool}<X className="size-3.5" /></FilterChip>
          <span className="text-sm text-text-muted">{lessons.length} {lessons.length === 1 ? "lección la menciona" : "lecciones la mencionan"}</span>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} context={[lesson.courseTitle, lesson.moduleTitle, lesson.sectionTitle].filter(Boolean).join(" · ")} />)}
        </ul>
      </div>
    );
  }

  const withContent = overview.courses.filter((course) => course.lessonCount > 0);
  const pending = overview.courses.filter((course) => course.lessonCount === 0);

  return (
    <div className="space-y-8">
      {header}
      <FormationSearchBox autoFocus />

      {overview.guide ? (
        <Link href={GUIDE_PATH} className="group flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent-soft p-5 transition-colors hover:border-accent/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-bg"><MapIcon className="size-5" strokeWidth={1.8} /></span>
            <div>
              <p className="font-heading text-lg font-semibold text-text">Guía completa del curso</p>
              <p className="mt-0.5 text-sm text-text-muted">Todo el temario en un solo sitio y ordenado por temas, con esquemas y gráficos, el vocabulario clave y las preguntas y respuestas de las tutorías.</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent">Abrir la guía · {Math.max(1, Math.round(overview.guide.wordCount / 220))} min <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      ) : null}

      <section aria-label="Resumen" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Lecciones capturadas" value={String(totals.lessons)} note={`de ${totals.declared}`} icon={BookOpenText} />
        <KpiCard label="Con transcripción" value={String(totals.withTranscript)} note={`${totals.complete} completas`} icon={FileCheck2} />
        <KpiCard label="Vídeo cubierto" value={`${Math.round(totals.durationSeconds / 3600)} h`} note="de grabaciones" icon={Clock3} />
        <KpiCard label="Cursos con contenido" value={String(totals.coursesWithContent)} note={`de ${overview.courses.length}`} icon={Layers3} />
      </section>

      <section className="space-y-4">
        <h2 className="section-label">Cursos</h2>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {withContent.map((course) => {
            const percent = course.declaredLessons ? Math.min(100, Math.round((course.lessonCount / course.declaredLessons) * 100)) : 0;
            return (
              <li key={course.id}>
                <Link href={`/formacion/${course.id}`} className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-raised">
                  <p className="font-heading text-lg font-semibold leading-snug text-text">{course.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{course.mentor ?? "Varios mentores"}{course.durationSeconds ? ` · ${formatTotalDuration(course.durationSeconds)}` : ""}</p>
                  <div className="mt-auto pt-5">
                    <div className="flex items-baseline justify-between text-xs text-text-muted">
                      <span><span className="font-mono text-sm tabular-nums text-text">{course.lessonCount}</span> de {course.declaredLessons} lecciones</span>
                      <span className="font-mono tabular-nums">{percent}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-raised" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${course.title}: ${percent}% capturado`}>
                      <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(["complete", "partial", "notes", "pending"] as const).map((status) => course.byStatus[status] ? (
                        <span key={status} className="inline-flex items-center gap-1"><FormationStatusChip status={status} /><span className="font-mono text-xs tabular-nums text-text-muted">{course.byStatus[status]}</span></span>
                      ) : null)}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        {pending.length ? (
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="section-label">Pendientes de captura</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {pending.map((course) => (
                <li key={course.id}>
                  <Link href={`/formacion/${course.id}`} className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text">
                    {course.title}<span className="font-mono text-xs tabular-nums text-text-faint">{course.declaredLessons}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {overview.tools.length ? (
        <section className="space-y-3">
          <h2 className="section-label">Explorar por herramienta</h2>
          <div className="flex flex-wrap gap-2">
            {overview.tools.map(({ name, count }) => (
              <FilterChip key={name} href={filterHref({ herramienta: name })} active={false}>{name}<span className="font-mono text-xs tabular-nums text-text-faint">{count}</span></FilterChip>
            ))}
          </div>
        </section>
      ) : null}

      <StatusLegend />
      {overview.importedAt ? <p className="text-xs text-text-faint">Última importación: {overview.importedAt.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Madrid" })}</p> : null}
    </div>
  );
}
