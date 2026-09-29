"use client";

import { useSyncExternalStore } from "react";
import { ResponsiveContainer } from "recharts";
import { formatPercent } from "@/lib/format";

// Piezas comunes de las vistas de Analítica.
// Colores de fase en el orden de pipelinePhases (lib/domain.ts); tokens de app/globals.css.
export const colors = ["var(--phase-uncontacted)", "var(--phase-contacted)", "var(--phase-responded)", "var(--phase-meeting)", "var(--phase-proposal)", "var(--phase-contracted)", "var(--phase-signed)", "var(--phase-first-payment)", "var(--phase-onboarding)", "var(--phase-active)", "var(--phase-discarded)"];
export const tooltipStyle = { background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 12 };
export const axis = { fill: "var(--text-muted)", fontSize: 11 };
export const number = (value: number | null, unit = "") => value === null ? "—" : new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value) + unit;
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function Panel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-border bg-surface p-5"><h2 className="font-heading text-lg font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-text-muted">{note}</p><div className="mt-5">{children}</div></section>;
}

export function ChartFrame({ label, children }: { label: string; children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return <div role="img" aria-label={label} className="h-64 w-full min-w-0">{mounted ? <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 300, height: 256 }}>{children}</ResponsiveContainer> : null}</div>;
}

export function Breakdown({ rows }: { rows: { label: string; count: number; color?: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return <div className="space-y-4">{rows.map((row, index) => <div key={row.label}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span>{row.label}</span><span className="font-mono text-xs text-text-muted">{row.count} · {formatPercent(row.count, total)}</span></div><div className="h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full" style={{ width: `${total ? row.count / total * 100 : 0}%`, background: row.color ?? colors[index % colors.length] }} /></div></div>)}{total === 0 && <p className="text-xs text-text-muted">No hay registros en este periodo.</p>}</div>;
}
