import Link from "next/link";
import { ArrowLeft, ArrowUp, X } from "lucide-react";

import { FormationMarkdown } from "@/components/formation/formation-markdown";
import { FormationSearchBox, Highlighted } from "@/components/formation/formation-ui";
import { GUIDE_PATH, highlightStems, searchTerms } from "@/lib/formation-content";
import { getFormationGuide, searchFormation } from "@/lib/formation-library";

export const dynamic = "force-dynamic";

type TocItem = { heading: string | null; anchor: string | null; level: number };

function GuideToc({ toc }: { toc: TocItem[] }) {
  return (
    <ol className="mt-3 space-y-0.5 text-sm">
      {toc.map((item, index) => (
        <li key={`${item.anchor}-${index}`}>
          <a
            href={`#${item.anchor}`}
            className={`block rounded px-1.5 py-1 transition-colors hover:bg-surface-raised hover:text-text ${item.level === 1 ? "mt-2 font-medium text-text first:mt-0" : "pl-4 text-text-muted"}`}
          >
            <span className="line-clamp-2">{item.heading}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export default async function FormationGuidePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: rawQuery } = await searchParams;
  const q = rawQuery?.trim().slice(0, 200) ?? "";
  const guide = await getFormationGuide();

  if (!guide?.notesMd) {
    return (
      <div className="space-y-6">
        <Link href="/formacion" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent"><ArrowLeft className="size-4" /> Formación</Link>
        <p className="rounded-xl border border-border bg-surface p-5 text-text-muted">
          La guía todavía no se ha importado. Crea los archivos en <code className="font-mono">formacion-mkt-hackers/guia/</code> y ejecuta <code className="font-mono text-accent">npm run formation:import</code>.
        </p>
      </div>
    );
  }

  const toc = guide.segments.filter((segment) => segment.level <= 2 && segment.anchor);
  const hits = q ? (await searchFormation(q, { lessonId: guide.id })).results[0]?.hits ?? [] : [];
  const minutes = Math.max(1, Math.round(guide.wordCount / 220));

  return (
    <div className="space-y-6" id="inicio">
      <Link href="/formacion" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-accent">
        <ArrowLeft className="size-4" /> Volver a Formación
      </Link>

      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-text sm:text-4xl">Guía completa</h1>
        <p className="section-label mt-2">Todo el temario ordenado por temas · vocabulario · preguntas y respuestas · {minutes} min de lectura</p>
      </header>

      <FormationSearchBox action={GUIDE_PATH} defaultValue={q} placeholder="Buscar en la guía: «MRR», «objeciones», «traspaso a humano»…" />

      {q ? (
        <section aria-label="Coincidencias en la guía" className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
            <p className="text-sm text-text-muted">{hits.length ? `${hits.length} ${hits.length === 1 ? "apartado contiene" : "apartados contienen"} «${q}»` : `«${q}» no aparece en la guía.`}</p>
            <div className="flex items-center gap-3 text-sm">
              <Link href={`/formacion?q=${encodeURIComponent(q)}`} className="text-accent hover:text-accent-hover">Buscar en las lecciones</Link>
              <Link href={GUIDE_PATH} aria-label="Quitar búsqueda" className="text-text-muted hover:text-text"><X className="size-4" /></Link>
            </div>
          </div>
          {hits.length ? (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {hits.map((hit, index) => (
                <li key={`${hit.anchor}-${index}`}>
                  <a href={hit.href} className="block px-5 py-2.5 transition-colors hover:bg-surface-raised">
                    {hit.heading ? <p className="text-sm font-medium text-text">{hit.heading}</p> : null}
                    {hit.snippet.length ? <p className="text-sm leading-6 text-text-muted"><Highlighted parts={hit.snippet} /></p> : null}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <details className="rounded-lg border border-border bg-surface px-4 py-3 lg:hidden">
            <summary className="cursor-pointer text-sm text-text-muted">Índice de la guía</summary>
            <GuideToc toc={toc} />
          </details>
          <article className="markdown-body formation-body rounded-xl border border-border bg-surface p-5 sm:p-8">
            <FormationMarkdown markdown={guide.notesMd} highlight={highlightStems(searchTerms(q))} />
          </article>
          <a href="#inicio" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent"><ArrowUp className="size-4" /> Volver arriba</a>
        </div>
        <aside aria-label="Índice de la guía" className="hidden lg:block">
          <nav className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-border bg-surface p-4">
            <p className="section-label">Índice</p>
            <GuideToc toc={toc} />
          </nav>
        </aside>
      </div>
    </div>
  );
}
