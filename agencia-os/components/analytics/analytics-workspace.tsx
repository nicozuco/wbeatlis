"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, BarChart3, Download, Filter, WalletCards } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ViewToggle } from "@/components/shared/view-toggle";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/shared/field-styles";
import { commercialAnalytics, financeAnalytics, inPeriod, monthlyActivity, periodStart, type AnalyticsData } from "@/lib/analytics";
import { isFollowUpOverdue } from "@/lib/client-process";
import { contentStatusLabels, taskStatusLabels } from "@/lib/domain";
import { formatCurrency, formatPercent } from "@/lib/format";

// Colores de fase en el orden de pipelinePhases (lib/domain.ts); tokens de app/globals.css.
const colors = ["var(--phase-uncontacted)", "var(--phase-contacted)", "var(--phase-responded)", "var(--phase-meeting)", "var(--phase-proposal)", "var(--phase-contracted)", "var(--phase-signed)", "var(--phase-first-payment)", "var(--phase-onboarding)", "var(--phase-active)", "var(--phase-discarded)"];
const tooltipStyle = { background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 12 };
const axis = { fill: "var(--text-muted)", fontSize: 11 };
const number = (value: number | null, unit = "") => value === null ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value) + unit;
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function Panel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-border bg-surface p-5"><h2 className="font-heading text-lg font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-text-muted">{note}</p><div className="mt-5">{children}</div></section>;
}

function ChartFrame({ label, children }: { label: string; children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return <div role="img" aria-label={label} className="h-64 w-full min-w-0">{mounted ? <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 300, height: 256 }}>{children}</ResponsiveContainer> : null}</div>;
}

function Breakdown({ rows }: { rows: { label: string; count: number; color?: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return <div className="space-y-4">{rows.map((row, index) => <div key={row.label}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span>{row.label}</span><span className="font-mono text-xs text-text-muted">{row.count} · {formatPercent(row.count, total)}</span></div><div className="h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full" style={{ width: `${total ? row.count / total * 100 : 0}%`, background: row.color ?? colors[index % colors.length] }} /></div></div>)}{total === 0 && <p className="text-xs text-text-muted">No hay registros en este periodo.</p>}</div>;
}

function exportSources(rows: ReturnType<typeof commercialAnalytics>["sources"]) {
  // Neutraliza fórmulas en campos de texto al abrir el CSV en una hoja de cálculo.
  const cell = (value: string | number) => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
  const csv = [["Origen", "Clínicas", "Contactadas", "Respondidas", "Contratadas actuales", "Contratación sobre contactadas (%)", "MRR (EUR)"], ...rows.map((row) => [row.source, row.total, row.contacted, row.responded, row.contracted, row.conversion ?? "", row.mrr / 100])].map((row) => row.map(cell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a"); link.href = url; link.download = "analitica-origenes.csv"; link.click(); URL.revokeObjectURL(url);
}

export function AnalyticsWorkspace({ data }: { data: AnalyticsData }) {
  const [view, setView] = useState<"commercial" | "operations">("commercial");
  const [period, setPeriod] = useState("all");
  const [source, setSource] = useState("ALL");
  const [city, setCity] = useState("ALL");
  const start = periodStart(period, data.now);
  const clients = useMemo(() => data.clients.filter((client) => inPeriod(client.createdAt, start, data.now) && (source === "ALL" || (client.leadSource ?? "") === source) && (city === "ALL" || (client.city ?? "") === city)), [data.clients, data.now, start, source, city]);
  const stats = useMemo(() => commercialAnalytics(clients, data.now), [clients, data.now]);
  const activity = useMemo(() => monthlyActivity(clients, data.now), [clients, data.now]);
  const finances = financeAnalytics(data.finances.filter((entry) => inPeriod(entry.occurredAt, start, data.now)));
  const tasks = data.tasks.filter((task) => inPeriod(task.createdAt, start, data.now));
  const content = data.content.filter((item) => inPeriod(item.createdAt, start, data.now));
  const sources = [...new Set(data.clients.map((client) => client.leadSource ?? ""))].sort();
  const cities = [...new Set(data.clients.map((client) => client.city ?? ""))].sort();
  const closed = stats.contracted + stats.discarded;
  const maxAge = Math.max(1, ...stats.phaseAges.map((phase) => phase.days ?? 0));
  const biggestDrop = stats.funnel.slice(1).filter((phase) => phase.conversion !== null).sort((a, b) => (a.conversion ?? 100) - (b.conversion ?? 100))[0];

  return <>
    <PageHeader title="Analítica" description="Datos de la agencia · Entiende qué funciona" actions={<Button variant="outline" asChild><Link href="/clientes">Abrir procesos <ArrowRight className="size-4" /></Link></Button>} />
    <div className="mt-7 flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-center">
      <ViewToggle value={view} onChange={setView} options={[{ value: "commercial", label: "Comercial", icon: BarChart3 }, { value: "operations", label: "Operaciones y finanzas", icon: WalletCards }]} />
      <div className="flex flex-wrap items-center gap-2"><Filter className="mr-1 hidden size-4 text-text-muted sm:block" />
        <select aria-label="Periodo de análisis" value={period} onChange={(event) => setPeriod(event.target.value)} className={`${fieldClass} max-w-full rounded-lg border px-3 text-sm`}><option value="all">Todo el historial</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="365">Últimos 365 días</option></select>
        {view === "commercial" && <><select aria-label="Filtrar por origen" value={source} onChange={(event) => setSource(event.target.value)} className={`${fieldClass} max-w-full rounded-lg border px-3 text-sm`}><option value="ALL">Todos los orígenes</option>{sources.map((value) => <option key={value} value={value}>{value || "Sin origen"}</option>)}</select><select aria-label="Filtrar por ciudad" value={city} onChange={(event) => setCity(event.target.value)} className={`${fieldClass} max-w-full rounded-lg border px-3 text-sm`}><option value="ALL">Todas las ciudades</option>{cities.map((value) => <option key={value} value={value}>{value || "Sin ciudad"}</option>)}</select></>}
      </div>
    </div>
    <p className="mt-3 text-xs leading-5 text-text-muted">{view === "commercial" ? `${clients.length} de ${data.clients.length} clínicas · El periodo selecciona clínicas por fecha de alta. Las conversiones incluyen su historial completo y las cuotas reflejan su estado actual.` : "Vista global de la agencia. Finanzas se filtra por fecha del movimiento; tareas y contenido, por fecha de creación. Los estados son los actuales."} Fechas en hora de Madrid.</p>

    {view === "commercial" ? <>
      {clients.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center"><p>No hay clínicas para esta selección.</p><p className="mt-2 text-sm text-text-muted">Amplía los filtros o añade una clínica para empezar a medir el proceso.</p></div>}
      <section aria-label="Indicadores comerciales" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tasa de respuesta" value={formatPercent(stats.responded, stats.contacted)} note={`${stats.responded} de ${stats.contacted} contactadas`} />
        <KpiCard label="Tasa de contratación" value={formatPercent(stats.contracted, stats.contacted)} note={`${stats.contracted} actuales / ${stats.contacted} contactadas`} />
        <KpiCard label="Éxito en cierres" value={formatPercent(stats.contracted, closed)} note={`${stats.contracted} contratos / ${closed} cerradas`} tone="success" />
        <KpiCard label="Ciclo hasta contrato" value={number(stats.cycleDays, " d")} note={`${stats.cycleSample} con fechas válidas`} />
      </section>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Embudo de conversión" note="Alcance histórico sobre las clínicas seleccionadas. Una fase posterior implica las anteriores; los saltos se incluyen. Un descarte previo al contacto no cuenta como contactado.">
          <div className="mb-3 flex justify-between text-[11px] uppercase tracking-wider text-text-faint"><span>Fase alcanzada</span><span>% del total · % desde anterior</span></div>
          <div className="space-y-4">{stats.funnel.map((phase, index) => <div key={phase.phase}><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm"><span>{phase.label} <span className="ml-1 font-mono text-text-muted">{phase.count}</span></span><span className="font-mono text-xs"><span className="text-text-muted">{number(phase.share, "%")}</span><span className="ml-3 text-accent">{index === 0 ? "—" : number(phase.conversion, "%")}</span></span></div><div className="h-5 rounded bg-bg"><div className="h-full rounded transition-all" style={{ width: `${phase.share ?? 0}%`, background: colors[index] }} /></div></div>)}</div>
          <p className="mt-5 text-xs leading-5 text-text-muted">«Desde anterior» = clínicas que alcanzaron esta fase ÷ las que alcanzaron la anterior. Cada clínica se cuenta una vez. El último tramo incluye contratos históricos, aunque hoy estén descartados.</p>
        </Panel>
        <Panel title="Dónde están tus clientes" note="Distribución actual. Cada clínica aparece en una sola fase.">
          {clients.length > 0 ? <ChartFrame label="Distribución actual de clínicas por fase; cantidades y porcentajes en la leyenda inferior"><PieChart><Pie data={stats.distribution} dataKey="count" nameKey="label" innerRadius={65} outerRadius={95} paddingAngle={2} stroke="var(--surface)">{stats.distribution.map((entry, index) => <Cell key={entry.phase} fill={colors[index]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ChartFrame> : <div className="grid h-32 place-items-center text-sm text-text-faint">Sin datos para representar</div>}
          <div className="mt-2 grid gap-3 sm:grid-cols-2">{stats.distribution.map((phase, index) => <div key={phase.phase} className="flex items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2 text-text-muted"><span className="size-2 shrink-0 rounded-full" style={{ background: colors[index] }} />{phase.label}</span><span className="font-mono">{phase.count} · {formatPercent(phase.count, clients.length)}</span></div>)}</div>
        </Panel>
      </div>
      <section aria-label="Seguimiento y valor comercial" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Seguimientos vencidos" value={String(stats.overdue)} note={`${formatPercent(stats.overdue, stats.active)} de ${stats.active} abiertas`} tone={stats.overdue ? "danger" : "default"} />
        <KpiCard label="Sin próximo seguimiento" value={String(stats.missingFollowUp)} note={`${formatPercent(stats.missingFollowUp, stats.active)} de abiertas`} tone={stats.missingFollowUp ? "warning" : "default"} />
        <KpiCard label="MRR contratado" value={formatCurrency(stats.mrr)} note="cuotas mensuales actuales" tone="success" />
        <KpiCard label="Cuotas en oportunidades" value={formatCurrency(stats.potential)} note="sin ponderar; no es previsión" />
      </section>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Tiempo en la fase actual" note="Media de días de las oportunidades abiertas desde su último cambio de fase; sin historial, desde su alta.">
          <div className="space-y-5">{stats.phaseAges.map((phase, index) => <div key={phase.phase}><div className="mb-2 flex justify-between gap-3 text-sm"><span>{phase.label} <span className="text-xs text-text-muted">({phase.count})</span></span><span className="font-mono text-xs">{number(phase.days, " días")}</span></div><div className="h-2 rounded bg-bg"><div className="h-full rounded" style={{ width: `${(phase.days ?? 0) / maxAge * 100}%`, background: colors[index] }} /></div></div>)}</div>
          {biggestDrop && <p className="mt-5 rounded-lg border border-border bg-bg p-3 text-xs leading-5 text-text-muted">Menor avance acumulado: <span className="text-text">{biggestDrop.label}</span>, con {number(biggestDrop.conversion, "%")} desde la fase anterior. {biggestDrop.lost} aún no la han alcanzado; pueden seguir abiertas o estar descartadas.</p>}
        </Panel>
        <Panel title="Altas y primeros contratos" note="Últimos 6 meses de las clínicas seleccionadas. Los contratos usan el primer evento registrado, no la cuota ni una fecha estimada.">
          <ChartFrame label="Altas de clínicas y primeros contratos por mes"><BarChart data={activity}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={axis} width={30} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent-soft)" }} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="altas" name="Altas" fill="var(--info)" radius={[3, 3, 0, 0]} /><Bar dataKey="contratos" name="Primeros contratos" fill="var(--accent)" radius={[3, 3, 0, 0]} /></BarChart></ChartFrame>
          <details className="mt-3 text-xs text-text-muted"><summary className="cursor-pointer">Ver cifras mensuales</summary><ul className="mt-3 space-y-2">{activity.map((item) => <li key={item.month}>{item.month}: {item.altas} altas · {item.contratos} primeros contratos</li>)}</ul></details>
        </Panel>
      </div>
      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5"><div><h2 className="font-heading text-lg font-semibold">Qué orígenes convierten mejor</h2><p className="mt-1 text-xs text-text-muted">Contratación actual sobre contactadas. Compara también el tamaño de la muestra.</p></div><Button variant="outline" disabled={!stats.sources.length} onClick={() => exportSources(stats.sources)}><Download className="size-4" /> Exportar CSV</Button></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-border bg-bg text-xs text-text-muted"><tr>{["Origen", "Clínicas", "Contactadas", "Respondidas", "Contratadas", "% contratación", "MRR"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{stats.sources.map((row) => <tr key={row.source} className="border-b border-border last:border-0"><td className="px-5 py-4 font-medium">{row.source}</td>{[row.total, row.contacted, row.responded, row.contracted, number(row.conversion, "%"), formatCurrency(row.mrr)].map((value, index) => <td key={index} className="whitespace-nowrap px-5 py-4 font-mono text-xs text-text-muted">{value}</td>)}</tr>)}{!stats.sources.length && <tr><td colSpan={7} className="p-8 text-center text-text-muted">No hay orígenes para comparar.</td></tr>}</tbody></table></div>
      </section>
      <p className="mt-4 text-xs leading-5 text-text-faint">Éxito en cierres = contratos actuales ÷ (contratos actuales + descartes). Ciclo hasta contrato = días desde el primer contacto hasta el primer contrato con transición registrada; excluye fechas ausentes o incoherentes. «—» indica que no hay base para calcular el porcentaje.</p>
    </> : <>
      <section aria-label="Indicadores financieros" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Ingresos registrados" value={formatCurrency(finances.income)} note="en el periodo" tone="success" /><KpiCard label="Gastos registrados" value={formatCurrency(finances.expenses)} note="en el periodo" /><KpiCard label="Balance" value={formatCurrency(finances.balance)} note="ingresos − gastos" tone={finances.balance < 0 ? "danger" : "success"} /><KpiCard label="Margen sobre ingresos" value={number(finances.margin, "%")} note="balance ÷ ingresos" /></section>
      <div className="mt-4"><Panel title="Evolución de ingresos y gastos" note="Movimientos registrados en euros. El MRR comercial se muestra por separado y no se suma a los ingresos.">{finances.monthly.length > 0 ? <><ChartFrame label="Ingresos y gastos mensuales en euros"><BarChart data={finances.monthly}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent-soft)" }} formatter={(value) => `${number(Number(value))} €`} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="ingresos" name="Ingresos" fill="var(--accent)" radius={[3, 3, 0, 0]} /><Bar dataKey="gastos" name="Gastos" fill="var(--warning)" radius={[3, 3, 0, 0]} /></BarChart></ChartFrame><details className="mt-3 text-xs text-text-muted"><summary className="cursor-pointer">Ver cifras mensuales</summary><ul className="mt-3 space-y-2">{finances.monthly.map((item) => <li key={item.month}>{item.month}: {formatCurrency(item.ingresos * 100)} de ingresos · {formatCurrency(item.gastos * 100)} de gastos</li>)}</ul></details></> : <div className="py-16 text-center text-sm text-text-muted">No hay movimientos financieros en este periodo. <Link href="/finanzas" className="text-accent">Abrir finanzas</Link></div>}</Panel></div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2"><Panel title="Ejecución de tareas" note={`${tasks.length} tareas creadas en el periodo · ${formatPercent(tasks.filter((task) => task.status === "DONE").length, tasks.length)} completadas a día de hoy.`}><Breakdown rows={Object.entries(taskStatusLabels).map(([status, label]) => ({ label, count: tasks.filter((task) => task.status === status).length, color: status === "DONE" ? "var(--accent)" : undefined }))} /><p className="mt-5 text-sm text-text-muted">{tasks.filter((task) => task.status !== "DONE" && isFollowUpOverdue(task.dueAt, new Date(data.now))).length} pendientes con fecha vencida. <Link href="/tareas" className="text-accent">Organizar tareas →</Link></p></Panel><Panel title="Producción de contenido" note={`${content.length} piezas creadas en el periodo · ${formatPercent(content.filter((item) => item.status === "PUBLISHED").length, content.length)} publicadas a día de hoy.`}><Breakdown rows={Object.entries(contentStatusLabels).map(([status, label]) => ({ label, count: content.filter((item) => item.status === status).length }))} /><Link href="/contenido" className="mt-5 inline-block text-sm text-accent">Abrir contenido →</Link></Panel></div>
    </>}
  </>;
}
