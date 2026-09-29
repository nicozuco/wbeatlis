"use client";

import { ExternalLink } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import type { AnalyticsClient } from "@/lib/analytics";
import { phaseLabels } from "@/lib/domain";
import { formatDate, formatPercent } from "@/lib/format";
import { proposalAnalytics, proposalEventLabels, type ProposalEventName, type ProposalEventRow } from "@/lib/proposals";

const PROPOSALS_URL = "https://propuestas.atlisclinicas.com";
const stageTone: Record<ProposalEventName, string> = {
  abierta: "border-border text-text-muted",
  leida: "border-info/40 text-info",
  compartida: "border-warning/40 text-warning",
  demo_pulsada: "border-success/40 text-success",
};
const when = (value: string) => formatDate(value, { hour: "2-digit", minute: "2-digit" });

export function ProposalsView({ events, clients }: { events: ProposalEventRow[]; clients: AnalyticsClient[] }) {
  const stats = proposalAnalytics(events, clients);
  const phaseOf = new Map(clients.map((client) => [client.id, client.phase]));

  if (!stats.rows.length) {
    return <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center"><p>Todavía no hay visitas a las propuestas en este periodo.</p><p className="mt-2 text-sm text-text-muted">Cada vez que una clínica abra su enlace de {PROPOSALS_URL.replace("https://", "")} aparecerá aquí. Tus propias visitas no cuentan si abriste la propuesta una vez con <span className="font-mono">?yo</span> al final.</p></div>;
  }

  return <>
    <section aria-label="Indicadores de propuestas" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Propuestas abiertas" value={String(stats.opened)} note={`${stats.visits} visitas en total`} />
      <KpiCard label="Llegaron a la oferta" value={String(stats.read)} note={`${formatPercent(stats.read, stats.opened)} de las abiertas`} />
      <KpiCard label="Pulsaron «Pedir demo»" value={String(stats.demo)} note={`${formatPercent(stats.demo, stats.opened)} de las abiertas`} tone={stats.demo ? "success" : "default"} />
      <KpiCard label="La compartieron" value={String(stats.shared)} note="con su equipo" />
    </section>

    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="p-5"><h2 className="font-heading text-lg font-semibold">Clínica por clínica</h2><p className="mt-1 text-xs text-text-muted">Ordenadas por la última actividad. Si una la ha abierto hoy, es el momento de llamar.</p></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="border-y border-border bg-bg text-xs text-text-muted"><tr>{["Clínica", "Hasta dónde llegó", "Visitas", "Oferta", "Demo", "Compartida", "Última visita", "En el CRM"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-3 font-medium">{heading}</th>)}</tr></thead>
        <tbody>{stats.rows.map((row) => {
          const phase = row.clinicId ? phaseOf.get(row.clinicId) : undefined;
          return <tr key={row.slug} className="border-b border-border last:border-0">
            <td className="px-5 py-4"><a href={`${PROPOSALS_URL}/${row.slug}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-accent">{row.clinicName}<ExternalLink className="size-3.5 text-text-faint" /></a></td>
            <td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${stageTone[row.stage]}`}>{proposalEventLabels[row.stage]}</span></td>
            {[row.visits, row.read, row.demo, row.shared].map((value, index) => <td key={index} className="px-5 py-4 font-mono text-xs text-text-muted">{value}</td>)}
            <td className="whitespace-nowrap px-5 py-4 text-xs"><span>{when(row.lastAt)}</span><span className="block text-text-muted">{[row.lastDevice, row.lastCity].filter(Boolean).join(" · ") || "—"}</span></td>
            <td className="whitespace-nowrap px-5 py-4 text-xs text-text-muted">{phase ? phaseLabels[phase] : "Sin ficha"}</td>
          </tr>;
        })}</tbody>
      </table></div>
    </section>

    <section className="mt-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-heading text-lg font-semibold">Actividad reciente</h2>
      <ol className="mt-4 space-y-3">{stats.recent.map((event, index) => <li key={`${event.occurredAt}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3 text-sm last:border-0 last:pb-0">
        <span><span className="font-medium">{event.clinicName}</span> <span className="text-text-muted">· {proposalEventLabels[event.event as ProposalEventName]}</span></span>
        <span className="font-mono text-xs text-text-muted">{when(event.occurredAt)}{event.device ? ` · ${event.device}` : ""}{event.city ? ` · ${event.city}` : ""}</span>
      </li>)}</ol>
    </section>
    <p className="mt-4 text-xs leading-5 text-text-faint">Cada paso se cuenta una vez por visita. «Abierta» exige interacción real (scroll, toque o 15 segundos a la vista), así que los escáneres de correo y las vistas previas no cuentan. «En el CRM» empareja la propuesta con la clínica de mismo nombre.</p>
  </>;
}
