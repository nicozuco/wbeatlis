import Link from "next/link";
import { ChevronRight, Clock3, Search } from "lucide-react";

import { ToneChip } from "@/components/shared/status-chip";
import { formatDuration, formatLessonDate, formationStatusMeta, type FormationStatus, type TextPart } from "@/lib/formation-content";
import { lessonHref, type LessonListItem } from "@/lib/formation-library";

export function FormationStatusChip({ status }: { status: FormationStatus }) {
  const meta = formationStatusMeta[status];
  return <span title={meta.hint}><ToneChip tone={meta.tone}>{meta.label}</ToneChip></span>;
}

export function Highlighted({ parts }: { parts: TextPart[] }) {
  return <>{parts.map((part, index) => (part.hit ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>))}</>;
}

export function FormationSearchBox({
  action = "/formacion",
  defaultValue,
  placeholder = "Busca en todas las clases: «precio setup», «traspaso a humano», «objeciones»…",
  hidden = {},
  autoFocus = false,
}: {
  action?: string;
  defaultValue?: string;
  placeholder?: string;
  hidden?: Record<string, string | undefined>;
  autoFocus?: boolean;
}) {
  return (
    <form action={action} method="get" role="search" className="flex w-full items-center gap-2">
      {Object.entries(hidden).map(([name, value]) => (value ? <input key={name} type="hidden" name={name} value={value} /> : null))}
      <label className="relative flex-1">
        <span className="sr-only">Buscar</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint" strokeWidth={1.8} />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={200}
          className="h-12 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-[15px] text-text outline-none transition-colors placeholder:text-text-faint hover:border-border-strong focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
        />
      </label>
      <button type="submit" className="h-12 shrink-0 rounded-lg bg-accent px-5 text-sm font-medium text-bg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        Buscar
      </button>
    </form>
  );
}

export function ToolChips({ tools, max = 3, linked = false }: { tools: string[]; max?: number; linked?: boolean }) {
  if (!tools.length) return null;
  const shown = tools.slice(0, max);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {shown.map((tool) =>
        linked ? (
          <Link key={tool} href={`/formacion?herramienta=${encodeURIComponent(tool)}`} className="status-chip tone-neutral transition-colors hover:text-text">{tool}</Link>
        ) : (
          <span key={tool} className="status-chip tone-neutral">{tool}</span>
        ),
      )}
      {tools.length > max ? <span className="text-xs text-text-faint">+{tools.length - max}</span> : null}
    </span>
  );
}

export function LessonRow({ lesson, context }: { lesson: LessonListItem; context?: string | null }) {
  const duration = formatDuration(lesson.durationSeconds);
  return (
    <li>
      <Link
        href={lessonHref(lesson)}
        className="group flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-surface-raised focus-visible:bg-surface-raised focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          {context ? <p className="mb-0.5 truncate text-xs text-text-faint">{context}</p> : null}
          <p className="font-medium leading-snug text-text group-hover:text-accent">{lesson.title}</p>
          {lesson.lessonDate ? <p className="mt-0.5 text-xs text-text-muted">{formatLessonDate(lesson.lessonDate)}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <ToolChips tools={lesson.tools} />
          {duration ? (
            <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-text-muted"><Clock3 className="size-3.5" strokeWidth={1.8} />{duration}</span>
          ) : null}
          <FormationStatusChip status={lesson.status} />
          <ChevronRight className="hidden size-4 text-text-faint group-hover:text-accent sm:block" strokeWidth={1.8} />
        </div>
      </Link>
    </li>
  );
}

export function StatusLegend() {
  return (
    <details className="group rounded-lg border border-border bg-surface px-4 py-3 text-sm">
      <summary className="cursor-pointer list-none text-text-muted marker:hidden hover:text-text">
        <span className="section-label">¿Qué significa cada estado?</span>
      </summary>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {(Object.keys(formationStatusMeta) as FormationStatus[]).map((status) => (
          <li key={status} className="flex items-start gap-2">
            <FormationStatusChip status={status} />
            <span className="text-text-muted">{formationStatusMeta[status].hint}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
