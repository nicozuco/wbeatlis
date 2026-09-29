"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { axis, Breakdown, ChartFrame, number, Panel, tooltipStyle } from "@/components/analytics/chart-parts";
import { KpiCard } from "@/components/shared/kpi-card";
import { fieldClass } from "@/components/shared/field-styles";
import { formatPercent } from "@/lib/format";
import { siteAnalytics, sites, type LiveVisitor, type SitePageviewRow, type SiteSessionRow } from "@/lib/site-analytics";

const webPages: Record<string, string> = { "/": "Inicio", "/index.html": "Inicio", "/demo.html": "Página de la demo", "/privacidad.html": "Privacidad", "/aviso-legal.html": "Aviso legal" };
export const pageLabel = (site: string, path: string) => site === "propuestas" ? `Propuesta · ${path.replace(/^\/|\/$/g, "") || "índice"}` : webPages[path] ?? path;

function useLiveVisitors() {
  const [state, setState] = useState<{ visitors: LiveVisitor[]; error: boolean; loaded: boolean }>({ visitors: [], error: false, loaded: false });
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/visitas/en-vivo", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const { visitors } = await response.json() as { visitors: LiveVisitor[] };
        if (!cancelled) setState({ visitors, error: false, loaded: true });
      } catch {
        if (!cancelled) setState((previous) => ({ ...previous, error: true, loaded: true }));
      }
    };
    load();
    const timer = window.setInterval(load, 15_000);
    document.addEventListener("visibilitychange", load);
    return () => { cancelled = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", load); };
  }, []);
  return state;
}

export function WebView({ sessions, pageviews, now, from }: { sessions: SiteSessionRow[]; pageviews: SitePageviewRow[]; now: string; from: string | null }) {
  const [site, setSite] = useState("ALL");
  const live = useLiveVisitors();
  const stats = useMemo(() => siteAnalytics(
    sessions.filter((session) => site === "ALL" || session.site === site),
    pageviews.filter((view) => site === "ALL" || view.site === site),
    now, from,
  ), [sessions, pageviews, now, from, site]);
  const liveVisitors = live.visitors.filter((visitor) => site === "ALL" || visitor.site === site);

  return <>
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <select aria-label="Filtrar por web" value={site} onChange={(event) => setSite(event.target.value)} className={`${fieldClass} max-w-full rounded-lg border px-3 text-sm`}>
        <option value="ALL">Las dos webs</option>
        {Object.entries(sites).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </div>

    <section aria-label="Visitantes en este momento" className="mt-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex size-3"><span className={`absolute inline-flex size-full rounded-full ${liveVisitors.length ? "animate-ping bg-success/60" : ""}`} /><span className={`relative inline-flex size-3 rounded-full ${liveVisitors.length ? "bg-success" : "bg-border-strong"}`} /></span>
          <p className="font-mono text-[1.75rem] font-semibold leading-none tabular-nums">{live.loaded ? liveVisitors.length : "…"}</p>
          <p className="text-sm text-text-muted">{liveVisitors.length === 1 ? "persona en la web ahora mismo" : "personas en la web ahora mismo"}</p>
        </div>
        <p className="text-xs text-text-faint">{live.error ? "No se pudo actualizar; se reintenta sola." : "Se actualiza cada 15 segundos."}</p>
      </div>
      {liveVisitors.length > 0 && <ul className="mt-4 divide-y divide-border border-t border-border">{liveVisitors.map((visitor, index) => <li key={`${visitor.lastSeenAt}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
        <span className="font-medium">{pageLabel(visitor.site, visitor.currentPath)}</span>
        <span className="font-mono text-xs text-text-muted">{[visitor.source, visitor.device, visitor.city].filter(Boolean).join(" · ")}</span>
      </li>)}</ul>}
    </section>

    {stats.sessions === 0 ? <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center"><p>Todavía no hay visitas en este periodo.</p><p className="mt-2 text-sm text-text-muted">Tus propias visitas no cuentan si abriste la web una vez con <span className="font-mono">?yo</span> al final.</p></div> : <>
      <section aria-label="Indicadores de la web" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Visitas" value={String(stats.sessions)} note="pestañas abiertas" />
        <KpiCard label="Páginas vistas" value={String(stats.pageviews)} note={`${number(stats.sessions ? stats.pageviews / stats.sessions : null)} por visita`} />
        <KpiCard label="Pulsaron la demo" value={String(stats.conversions)} note={`${number(stats.conversionRate, "%")} de las visitas`} tone={stats.conversions ? "success" : "default"} />
        <KpiCard label="Origen principal" value={stats.bySource[0]?.source ?? "—"} note={stats.bySource[0] ? `${formatPercent(stats.bySource[0].total, stats.sessions)} de las visitas` : undefined} />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Visitas por día" note={stats.days.length >= 90 ? "Últimos 90 días del periodo." : "Cada barra es un día, en hora de Madrid."}>
          <ChartFrame label="Visitas por día"><BarChart data={stats.days}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} minTickGap={16} /><YAxis allowDecimals={false} tick={axis} width={30} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent-soft)" }} /><Bar dataKey="visitas" name="Visitas" fill="var(--accent)" radius={[3, 3, 0, 0]} /></BarChart></ChartFrame>
        </Panel>
        <Panel title="Dispositivo" note="Con qué entran.">
          <Breakdown rows={stats.devices.map((row) => ({ label: row.label, count: row.total }))} />
          {stats.cities.length > 0 && <><h3 className="mt-6 text-sm font-semibold">Ciudades</h3><ul className="mt-3 space-y-2 text-sm">{stats.cities.map((row) => <li key={row.label} className="flex justify-between gap-3"><span>{row.label}</span><span className="font-mono text-xs text-text-muted">{row.total}</span></li>)}</ul></>}
        </Panel>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="p-5"><h2 className="font-heading text-lg font-semibold">De dónde vienen</h2><p className="mt-1 text-xs leading-5 text-text-muted">Por la etiqueta del enlace (utm_source) o, si no la tiene, por la app o la página desde la que llegan. «Directo» = sin origen conocido: escribieron la dirección, un enlace sin etiqueta desde un correo o una app que lo oculta.</p></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="border-y border-border bg-bg text-xs text-text-muted"><tr>{["Origen", "Visitas", "% del total", "Pulsaron la demo", "% que pulsa"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-3 font-medium">{heading}</th>)}</tr></thead>
          <tbody>{stats.bySource.map((row) => <tr key={row.source} className="border-b border-border last:border-0"><td className="px-5 py-4 font-medium">{row.source}</td>{[row.total, formatPercent(row.total, stats.sessions), row.converted, number(row.rate, "%")].map((value, index) => <td key={index} className="whitespace-nowrap px-5 py-4 font-mono text-xs text-text-muted">{value}</td>)}</tr>)}</tbody>
        </table></div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Páginas más vistas" note="Cada vez que se abre una página cuenta una vista.">
          <Breakdown rows={stats.pages.map((page) => ({ label: pageLabel(page.site, page.path), count: page.views }))} />
        </Panel>
        <Panel title="Cómo etiquetar tus enlaces" note="Añade esto al final de cada enlace que publiques para saber exactamente de dónde viene cada visita.">
          <ul className="space-y-3 text-sm">
            {[["Bio de Instagram", "?utm_source=instagram&utm_medium=bio"], ["Historia de Instagram", "?utm_source=instagram&utm_medium=historia"], ["Anuncio de Facebook", "?utm_source=facebook&utm_medium=anuncio"], ["Correo a una clínica", "?utm_source=email&utm_campaign=nombre-clinica"], ["LinkedIn", "?utm_source=linkedin"]].map(([label, tag]) => <li key={label}><span className="text-text-muted">{label}</span><code className="mt-1 block break-all rounded-md bg-bg px-2 py-1 font-mono text-xs">atlisclinicas.com/{tag}</code></li>)}
          </ul>
        </Panel>
      </div>
    </>}
    <p className="mt-4 text-xs leading-5 text-text-faint">Una visita es una pestaña abierta: si la misma persona vuelve otro día, cuenta de nuevo. No se usan cookies ni se guarda la IP. «Pulsaron la demo» cuenta los botones que llevan a reservar la demo en la web y «Pedir mi demo gratuita» en las propuestas.</p>
  </>;
}
