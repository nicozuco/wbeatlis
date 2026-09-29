import Link from "next/link";
import { ArrowRight, CalendarClock, CheckSquare2, History, MessageSquareMore } from "lucide-react";

import { ContactsChart } from "@/components/dashboard/contacts-chart";
import { KpiCard } from "@/components/shared/kpi-card";
import { PhaseChip, ToneChip } from "@/components/shared/status-chip";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getUserSettings } from "@/lib/user-settings";

export const dynamic = "force-dynamic";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default async function TodayPage() {
  const user = await getAuthenticatedUser();
  const settings = user ? await getUserSettings(user.id) : null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

  const overdueWhere = { nextFollowUpAt: { lt: startOfToday }, phase: { not: "DISCARDED" as const } };
  // La lista muestra solo los 5 más antiguos; el KPI usa el conteo completo.
  const [overdue, overdueCount, todayTasks, movements, interactions] = await Promise.all([
    prisma.clinic.findMany({ where: overdueWhere, orderBy: { nextFollowUpAt: "asc" }, take: 5 }),
    prisma.clinic.count({ where: overdueWhere }),
    prisma.task.findMany({ where: { dueAt: { gte: startOfToday, lt: endOfToday }, status: { not: "DONE" } }, include: { clinic: true }, orderBy: { dueAt: "asc" } }),
    prisma.clinicStageEvent.findMany({ include: { clinic: true }, orderBy: { changedAt: "desc" }, take: 6 }),
    prisma.interaction.findMany({ where: { occurredAt: { gte: startOfWindow } }, orderBy: { occurredAt: "asc" } }),
  ]);

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWindow);
    date.setDate(startOfWindow.getDate() + index);
    const count = interactions.filter((interaction) => {
      const item = new Date(interaction.occurredAt);
      return item.getFullYear() === date.getFullYear() && item.getMonth() === date.getMonth() && item.getDate() === date.getDate();
    }).length;
    return { day: new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", ""), contacts: count };
  });

  const hour = now.getHours();
  const greeting = hour < 14 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const dateLabel = capitalize(new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(now));

  return (
    <>
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-text sm:text-4xl">{dateLabel}</h1>
          <p className="section-label mt-2">Panel operativo</p>
        </div>
        <p className="font-heading text-xl font-medium tracking-[-0.02em] text-text-muted">{greeting}{settings?.displayName ? `, ${settings.displayName}` : ""}. Esto requiere tu atención.</p>
      </header>

      <section aria-label="Resumen del día" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Seguimientos vencidos" value={String(overdueCount)} note="requieren contacto" tone={overdueCount ? "danger" : "default"} icon={CalendarClock} />
        <KpiCard label="Tareas de hoy" value={String(todayTasks.length)} note="pendientes" icon={CheckSquare2} />
        <KpiCard label="Movimientos recientes" value={String(movements.length)} note="últimos cambios" icon={History} />
        <KpiCard label="Contactos · 7 días" value={String(interactions.length)} note="interacciones" tone="success" icon={MessageSquareMore} />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div><p className="section-label">Acción inmediata</p><h2 className="mt-2 font-heading text-xl font-semibold tracking-[-0.02em]">Seguimientos vencidos</h2></div>
            <Link href="/clientes" className="text-sm text-accent hover:text-accent-hover">Ver clientes</Link>
          </div>
          <div className="mt-5 space-y-2">
            {overdue.map((clinic) => (
              <Link key={clinic.id} href="/clientes" className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-bg p-3 transition-colors hover:border-border-strong hover:bg-surface-raised">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-text">{clinic.name}</p><p className="mt-1 text-xs text-text-muted">{clinic.contactName || clinic.city || "Sin contacto asignado"}</p></div>
                <div className="flex shrink-0 items-center gap-3"><span className="font-mono text-xs tabular-nums text-danger">{formatDate(clinic.nextFollowUpAt)}</span><ArrowRight className="size-4 text-text-faint group-hover:text-accent" /></div>
              </Link>
            ))}
            {overdue.length === 0 ? <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-text-muted">Todo al día. No hay seguimientos vencidos.</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div><p className="section-label">Actividad comercial</p><h2 className="mt-2 font-heading text-xl font-semibold tracking-[-0.02em]">Contactos de los últimos 7 días</h2></div>
          <div className="mt-4"><ContactsChart data={chartData} /></div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between"><div><p className="section-label">Agenda</p><h2 className="mt-2 font-heading text-xl font-semibold">Tareas de hoy</h2></div><Link href="/tareas" className="text-sm text-accent">Abrir tareas</Link></div>
          <div className="mt-5 space-y-2">
            {todayTasks.map((task) => <Link href="/tareas" key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg p-3 hover:border-border-strong"><div><p className="text-sm font-medium text-text">{task.title}</p><p className="mt-1 text-xs text-text-muted">{task.clinic?.name || task.category || "Agencia"}</p></div>{task.priority ? <ToneChip tone={task.priority === "URGENT" ? "danger" : "warning"}>{task.priority === "URGENT" ? "Urgente" : "Importante"}</ToneChip> : null}</Link>)}
            {todayTasks.length === 0 ? <p className="py-8 text-center text-sm text-text-muted">No hay tareas pendientes para hoy.</p> : null}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <div><p className="section-label">Pipeline</p><h2 className="mt-2 font-heading text-xl font-semibold">Últimos movimientos</h2></div>
          <div className="mt-5 space-y-3">
            {movements.map((movement) => <div key={movement.id} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-text">{movement.clinic.name}</p><p className="mt-1 font-mono text-[11px] text-text-faint">{formatDate(movement.changedAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p></div><PhaseChip phase={movement.toPhase} /></div>)}
          </div>
        </section>
      </div>
    </>
  );
}
