import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { FormationMarkdown } from "@/components/formation/formation-markdown";
import { FormationSearchBox, LessonRow, StatusLegend } from "@/components/formation/formation-ui";
import { formatTotalDuration } from "@/lib/formation-content";
import { getFormationCourse, type LessonListItem } from "@/lib/formation-library";

export const dynamic = "force-dynamic";

type Module = { key: string; title: string; lessons: LessonListItem[]; sections: { title: string | null; lessons: LessonListItem[] }[] };

function groupModules(lessons: LessonListItem[]) {
  const modules: Module[] = [];
  for (const lesson of lessons) {
    let group = modules.at(-1);
    if (!group || group.key !== lesson.moduleKey) {
      group = { key: lesson.moduleKey, title: lesson.moduleTitle, lessons: [], sections: [] };
      modules.push(group);
    }
    group.lessons.push(lesson);
    let section = group.sections.at(-1);
    if (!section || section.title !== lesson.sectionTitle) {
      section = { title: lesson.sectionTitle, lessons: [] };
      group.sections.push(section);
    }
    section.lessons.push(lesson);
  }
  return modules;
}

export default async function FormationCoursePage({ params, searchParams }: { params: Promise<{ course: string }>; searchParams: Promise<{ vista?: string }> }) {
  const [{ course: courseId }, { vista }] = await Promise.all([params, searchParams]);
  const data = await getFormationCourse(courseId);
  if (!data) notFound();
  const { course, lessons } = data;
  const modules = groupModules(lessons);
  const showOverview = vista === "temario" || !lessons.length;
  const duration = lessons.reduce((sum, lesson) => sum + (lesson.durationSeconds ?? 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/formacion" className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent">
        <ArrowLeft className="size-4" /> Formación
      </Link>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-text sm:text-4xl">{course.title}</h1>
          <p className="section-label mt-2">
            {[course.mentor, `${lessons.length} de ${course.declaredLessons} lecciones capturadas`, duration ? `${formatTotalDuration(duration)} de vídeo` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        {course.campusUrl ? (
          <a href={course.campusUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text">
            Abrir en el campus <ExternalLink className="size-3.5" />
          </a>
        ) : null}
      </header>

      {lessons.length ? <FormationSearchBox hidden={{ curso: course.id }} placeholder={`Busca en ${course.title}…`} /> : null}

      {lessons.length && course.overviewMd ? (
        <nav aria-label="Vistas del curso" className="flex gap-1 border-b border-border">
          {[{ label: "Lecciones", href: `/formacion/${course.id}`, active: !showOverview }, { label: "Temario e inventario", href: `/formacion/${course.id}?vista=temario`, active: showOverview }].map((tab) => (
            <Link key={tab.label} href={tab.href} aria-current={tab.active ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors ${tab.active ? "border-accent text-text" : "border-transparent text-text-muted hover:text-text"}`}>
              {tab.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {showOverview ? (
        <>
          {!lessons.length ? (
            <p className="rounded-xl border border-border bg-surface p-5 text-text-muted">Este curso aún no tiene clases capturadas. Aquí está lo que se sabe de él por ahora.</p>
          ) : null}
          {course.overviewMd ? (
            <article className="markdown-body formation-body rounded-xl border border-border bg-surface p-5 sm:p-7">
              <FormationMarkdown markdown={course.overviewMd} links={{ courseHref: `/formacion/${course.id}` }} />
            </article>
          ) : null}
        </>
      ) : (
        <>
          {modules.length > 1 ? (
            <nav aria-label="Módulos" className="flex flex-wrap gap-2">
              {modules.map((group) => (
                <a key={group.key} href={`#${group.key}`} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text">
                  {group.title.replace(/\s*·.*$/, "")}<span className="font-mono text-xs tabular-nums text-text-faint">{group.lessons.length}</span>
                </a>
              ))}
            </nav>
          ) : null}

          <div className="space-y-6">
            {modules.map((group) => {
              const moduleDuration = group.lessons.reduce((sum, lesson) => sum + (lesson.durationSeconds ?? 0), 0);
              return (
                <section key={group.key} id={group.key} className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-surface">
                  <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
                    <h2 className="font-heading text-lg font-semibold text-text">{group.title}</h2>
                    <p className="text-xs text-text-muted">
                      {group.lessons.length} {group.lessons.length === 1 ? "lección" : "lecciones"}{moduleDuration ? ` · ${formatTotalDuration(moduleDuration)}` : ""}
                    </p>
                  </header>
                  {group.sections.map((section, index) => (
                    <div key={`${section.title}-${index}`}>
                      {section.title ? <h3 className="section-label border-b border-border bg-bg/40 px-5 py-2">{section.title}</h3> : null}
                      <ul className="divide-y divide-border">
                        {section.lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} />)}
                      </ul>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
          <StatusLegend />
        </>
      )}
    </div>
  );
}
