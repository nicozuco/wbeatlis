import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Download, ExternalLink, FileText, X } from "lucide-react";

import { FormationMarkdown } from "@/components/formation/formation-markdown";
import { FormationSearchBox, FormationStatusChip, Highlighted, ToolChips } from "@/components/formation/formation-ui";
import { GUIDE_COURSE_ID, GUIDE_PATH, formationDocTabs, formationKindLabels, formationStatusMeta, formatDuration, formatLessonDate, highlightStems, searchTerms, type FormationDocKind } from "@/lib/formation-content";
import { getFormationLesson, lessonHref, searchFormation } from "@/lib/formation-library";

export const dynamic = "force-dynamic";

type Tab = { tab: string; label: string; count?: number };

function formatBytes(size: number) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default async function FormationLessonPage({ params, searchParams }: { params: Promise<{ course: string; lesson: string }>; searchParams: Promise<{ tab?: string; q?: string }> }) {
  const [{ course: courseId, lesson: slug }, query] = await Promise.all([params, searchParams]);
  if (courseId === GUIDE_COURSE_ID) redirect(GUIDE_PATH);
  const data = await getFormationLesson(courseId, slug);
  if (!data) notFound();
  const { lesson, previous, next } = data;
  const q = query.q?.trim().slice(0, 200) ?? "";

  const markdownByKind: Record<FormationDocKind, string | null> = { notes: lesson.notesMd, transcript: lesson.transcriptMd, visuals: lesson.visualsMd };
  const tabs: Tab[] = [
    ...formationDocTabs.filter(({ kind }) => markdownByKind[kind]).map(({ tab, label }) => ({ tab, label })),
    ...(lesson.documents.length ? [{ tab: "documentos", label: "Documentos", count: lesson.documents.length }] : []),
    ...(lesson.statusMd ? [{ tab: "estado", label: "Estado" }] : []),
  ];
  const activeTab = tabs.find((tab) => tab.tab === query.tab)?.tab ?? tabs[0]?.tab ?? "estado";
  const activeKind = formationDocTabs.find((tab) => tab.tab === activeTab)?.kind ?? null;
  const markdown = activeKind ? markdownByKind[activeKind] : activeTab === "estado" ? lesson.statusMd : null;

  const stems = highlightStems(searchTerms(q));
  const lessonSearch = q ? await searchFormation(q, { lessonId: lesson.id }) : null;
  const lessonHits = lessonSearch?.results[0]?.hits ?? [];

  const toc = activeKind ? lesson.segments.filter((segment) => segment.kind === activeKind && segment.level >= 2 && segment.anchor) : [];
  const duration = formatDuration(lesson.durationSeconds);
  const readingMinutes = markdown ? Math.max(1, Math.round(markdown.split(/\s+/).length / 220)) : 0;
  const links = {
    lessonHref: (tab: string) => lessonHref(lesson, { tab }),
    courseHref: `/formacion/${lesson.courseId}`,
    documentHref: (name: string) => {
      const document = lesson.documents.find((doc) => doc.name === name);
      return document ? `/api/formacion/documentos/${document.id}` : null;
    },
  };
  const statusMeta = formationStatusMeta[lesson.status];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href={q ? `/formacion?q=${encodeURIComponent(q)}` : `/formacion/${lesson.courseId}#${lesson.moduleKey}`}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-accent"
        >
          <ArrowLeft className="size-4" /> {q ? "Volver a los resultados" : `Volver a ${lesson.course.title}`}
        </Link>
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
          <Link href="/formacion" className="transition-colors hover:text-accent">Formación</Link>
          <span aria-hidden className="text-text-faint">/</span>
          <Link href={`/formacion/${lesson.courseId}`} className="transition-colors hover:text-accent">{lesson.course.title}</Link>
          <span aria-hidden className="text-text-faint">/</span>
          <Link href={`/formacion/${lesson.courseId}#${lesson.moduleKey}`} className="transition-colors hover:text-accent">{lesson.moduleTitle}</Link>
        </nav>
      </div>

      <header className="space-y-3">
        {lesson.sectionTitle ? <p className="section-label">{lesson.sectionTitle}</p> : null}
        <h1 className="font-heading text-2xl font-semibold leading-tight tracking-[-0.02em] text-text sm:text-3xl">{lesson.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
          <FormationStatusChip status={lesson.status} />
          {duration ? <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" strokeWidth={1.8} /><span className="font-mono tabular-nums">{duration}</span> de vídeo</span> : null}
          {lesson.lessonDate ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" strokeWidth={1.8} />{formatLessonDate(lesson.lessonDate)}</span> : null}
          {lesson.course.mentor ? <span>{lesson.course.mentor}</span> : null}
          {lesson.campusUrl ? (
            <a href={lesson.campusUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover">Ver vídeo en el campus <ExternalLink className="size-3.5" /></a>
          ) : lesson.course.campusUrl ? (
            <a href={lesson.course.campusUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-accent">Abrir el curso en el campus <ExternalLink className="size-3.5" /></a>
          ) : null}
        </div>
        <ToolChips tools={lesson.tools} max={12} linked />
      </header>

      <FormationSearchBox
        action={lessonHref(lesson)}
        defaultValue={q}
        hidden={{ tab: activeTab }}
        placeholder="Buscar en esta lección…"
      />

      {q ? (
        <section aria-label="Coincidencias en esta lección" className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <p className="text-sm text-text-muted">
              {lessonHits.length ? `${lessonHits.length} ${lessonHits.length === 1 ? "apartado contiene" : "apartados contienen"} «${q}»` : `«${q}» no aparece en esta lección.`}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <Link href={`/formacion?q=${encodeURIComponent(q)}`} className="text-accent hover:text-accent-hover">Buscar en todo el curso</Link>
              <Link href={lessonHref(lesson, { tab: activeTab })} aria-label="Quitar búsqueda" className="text-text-muted hover:text-text"><X className="size-4" /></Link>
            </div>
          </div>
          {lessonHits.length ? (
            <ul className="max-h-72 divide-y divide-border overflow-y-auto">
              {lessonHits.map((hit, index) => (
                <li key={`${hit.kind}-${hit.anchor}-${index}`}>
                  <Link href={hit.href} className="block px-5 py-2.5 transition-colors hover:bg-surface-raised">
                    <p className="mb-0.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="status-chip tone-accent">{formationKindLabels[hit.kind]}</span>
                      {hit.heading ? <span className="font-medium text-text">{hit.heading}</span> : null}
                    </p>
                    {hit.snippet.length ? <p className="text-sm leading-6 text-text-muted"><Highlighted parts={hit.snippet} /></p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <nav aria-label="Contenido de la lección" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.tab}
            href={lessonHref(lesson, { tab: tab.tab, q: q || undefined })}
            aria-current={activeTab === tab.tab ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors ${activeTab === tab.tab ? "border-accent text-text" : "border-transparent text-text-muted hover:text-text"}`}
          >
            {tab.label}{tab.count ? <span className="ml-1.5 font-mono text-xs tabular-nums text-text-faint">{tab.count}</span> : null}
          </Link>
        ))}
      </nav>

      <div className={toc.length >= 3 ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]" : ""}>
        <div className="min-w-0 space-y-4">
          {toc.length >= 3 ? (
            <details className="rounded-lg border border-border bg-surface px-4 py-3 lg:hidden">
              <summary className="cursor-pointer text-sm text-text-muted">Índice de apartados ({toc.length})</summary>
              <TocList toc={toc} />
            </details>
          ) : null}

          {activeTab === "documentos" ? (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {lesson.documents.map((document) => (
                <li key={document.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <FileText className="size-5 text-text-faint" strokeWidth={1.8} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text">{document.name}</p>
                    <p className="text-xs text-text-muted">{document.contentType === "application/pdf" ? "PDF" : document.contentType} · {formatBytes(document.size)}</p>
                  </div>
                  <a href={`/api/formacion/documentos/${document.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text">Abrir <ExternalLink className="size-3.5" /></a>
                  <a href={`/api/formacion/documentos/${document.id}?download=1`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text">Descargar <Download className="size-3.5" /></a>
                </li>
              ))}
            </ul>
          ) : (
            <article className="markdown-body formation-body rounded-xl border border-border bg-surface p-5 sm:p-7">
              {activeTab === "estado" ? (
                <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg/40 px-4 py-3 text-sm text-text-muted">
                  <FormationStatusChip status={lesson.status} /> {statusMeta.hint}
                </div>
              ) : readingMinutes ? (
                <p className="section-label mb-2">{activeKind ? formationKindLabels[activeKind] : ""} · {readingMinutes} min de lectura</p>
              ) : null}
              {markdown ? <FormationMarkdown markdown={markdown} highlight={stems} links={links} /> : <p>No hay contenido en esta pestaña.</p>}
              {activeTab === "estado" ? <p className="mt-6 font-mono text-xs text-text-faint">Archivo: formacion-mkt-hackers/catalogo/{lesson.sourcePath}</p> : null}
            </article>
          )}

          <nav aria-label="Lecciones del curso" className="grid gap-3 sm:grid-cols-2">
            {previous ? (
              <Link href={lessonHref(previous)} className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
                <span className="section-label inline-flex items-center gap-1"><ArrowLeft className="size-3.5" /> Anterior</span>
                <p className="mt-1 text-sm text-text group-hover:text-accent">{previous.title}</p>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={lessonHref(next)} className="group rounded-xl border border-border bg-surface p-4 text-right transition-colors hover:border-border-strong">
                <span className="section-label inline-flex items-center gap-1">Siguiente <ArrowRight className="size-3.5" /></span>
                <p className="mt-1 text-sm text-text group-hover:text-accent">{next.title}</p>
              </Link>
            ) : null}
          </nav>
        </div>

        {toc.length >= 3 ? (
          <aside aria-label="Índice de apartados" className="hidden lg:block">
            <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-border bg-surface p-4">
              <p className="section-label">Apartados</p>
              <TocList toc={toc} />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function TocList({ toc }: { toc: { heading: string | null; anchor: string | null; level: number; timestamp: string | null }[] }) {
  return (
    <ol className="mt-3 space-y-1 text-sm">
      {toc.map((item, index) => (
        <li key={`${item.anchor}-${index}`} className={item.level >= 3 ? "pl-3" : ""}>
          <a href={`#${item.anchor}`} className="flex gap-2 rounded px-1.5 py-1 text-text-muted transition-colors hover:bg-surface-raised hover:text-text">
            {item.timestamp ? <span className="shrink-0 font-mono text-xs tabular-nums text-text-faint">{item.timestamp}</span> : null}
            <span className="line-clamp-2">{item.heading}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
