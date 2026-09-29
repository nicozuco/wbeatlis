"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowUpRight, Bell, Building2, CalendarClock, CalendarDays, CalendarRange, CheckSquare2, ChevronLeft, ChevronRight, Clapperboard, GraduationCap, LayoutList, Plus, Rows3, TimerReset, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteReminder, moveTask, saveReminder, setReminderDone } from "@/app/actions";
import { ContentForm, contentColumns, contentStatusTone, type ContentItem } from "@/components/content/content-form";
import { fieldClass, textareaClass } from "@/components/shared/field-styles";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SidePanel } from "@/components/shared/side-panel";
import { SortableTable } from "@/components/shared/sortable-table";
import { PhaseChip, ToneChip } from "@/components/shared/status-chip";
import { ViewToggle } from "@/components/shared/view-toggle";
import { TaskForm, type ClinicOption, type TaskData } from "@/components/tasks/tasks-workspace";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { addDays, addMonths, dayKey, formatDayKey, formatTime, monthGridKeys, weekKeys } from "@/lib/agenda";
import { contentStatusLabels, type PipelinePhaseValue } from "@/lib/domain";
import { formationMentors, formationProgramById, formationPrograms, formationSessionsBetween, formationSourceUrl, type FormationSession } from "@/lib/formation";

import { AgendaPushNotice } from "./push-manager";

export type AgendaReminder = { id: string; title: string; notes: string | null; remindAt: string; sentAt: string | null; doneAt: string | null };
export type AgendaFollowUp = { id: string; name: string; phase: PipelinePhaseValue; nextFollowUpAt: string };
export type AgendaView = "day" | "week" | "month" | "content" | "formation";

type Kind = "reminder" | "task" | "followup" | "content" | "formation";
type Entry = {
  key: string;
  kind: Kind;
  title: string;
  subtitle: string | null;
  day: string;
  time: string | null;
  done: boolean;
  cancelled?: boolean;
  open: () => void;
  toggle?: (done: boolean) => void;
  badge?: React.ReactNode;
};
type Panel = { type: "reminder"; item: AgendaReminder | null; day: string } | { type: "task"; item: TaskData | null } | { type: "content"; item: ContentItem | null; day: string } | { type: "formation"; item: FormationSession } | null;

const kinds: { kind: Kind; label: string; dot: string; icon: LucideIcon }[] = [
  { kind: "reminder", label: "Recordatorios", dot: "bg-accent", icon: Bell },
  { kind: "task", label: "Tareas", dot: "bg-info", icon: CheckSquare2 },
  { kind: "followup", label: "Seguimientos", dot: "bg-violet", icon: Building2 },
  { kind: "content", label: "Contenido", dot: "bg-warning", icon: Clapperboard },
  { kind: "formation", label: "Formación", dot: "bg-success", icon: GraduationCap },
];
const kindMeta = Object.fromEntries(kinds.map((item) => [item.kind, item])) as Record<Kind, (typeof kinds)[number]>;

const nextHour = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
};

// Convierte día + hora elegidos (hora local del dispositivo) en un instante ISO.
const toInstant = (day: string, time: string) => new Date(`${day}T${time}`).toISOString();

function ReminderForm({ reminder, day, onClose }: { reminder: AgendaReminder | null; day: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const localDate = (value: string) => { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
  const localTime = (value: string) => { const date = new Date(value); return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; };
  const [form, setForm] = useState({ title: reminder?.title ?? "", notes: reminder?.notes ?? "", date: reminder ? localDate(reminder.remindAt) : day, time: reminder ? localTime(reminder.remindAt) : nextHour() });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const run = (work: () => Promise<unknown>, success: string) => startTransition(async () => {
    try { await work(); toast.success(success); onClose(); } catch { toast.error("No se pudo guardar el recordatorio"); }
  });

  return (
    <form onSubmit={(event) => { event.preventDefault(); run(() => saveReminder({ id: reminder?.id, title: form.title, notes: form.notes, remindAt: toInstant(form.date, form.time) }), reminder ? "Recordatorio actualizado" : "Recordatorio creado"); }} className="flex min-h-0 flex-1 flex-col">
      <div className="grid gap-5 overflow-y-auto px-5 py-6">
        <label><Label className="mb-2 text-text-muted">Recordatorio</Label><Input required autoFocus value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Ej. Llamar a Clínica Pedro" className={fieldClass} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label><Label className="mb-2 text-text-muted">Día</Label><Input required type="date" value={form.date} onChange={(event) => set("date", event.target.value)} className={fieldClass} /></label>
          <label><Label className="mb-2 text-text-muted">Hora del aviso</Label><Input required type="time" value={form.time} onChange={(event) => set("time", event.target.value)} className={fieldClass} /></label>
        </div>
        <label><Label className="mb-2 text-text-muted">Notas</Label><Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} placeholder="Se muestran en la notificación" className={`min-h-24 ${textareaClass}`} /></label>
        {reminder?.sentAt ? <p className="rounded-lg border border-border bg-bg p-3 text-xs text-text-muted">Aviso enviado. Si cambias el día o la hora, se volverá a avisar.</p> : null}
      </div>
      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border p-5">
        {reminder ? (
          <div className="flex gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild><Button type="button" variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /> Eliminar</Button></AlertDialogTrigger>
              <AlertDialogContent className="border-border bg-surface-raised text-text">
                <AlertDialogHeader><AlertDialogTitle>Eliminar recordatorio</AlertDialogTitle><AlertDialogDescription className="text-text-muted">Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => run(() => deleteReminder(reminder.id), "Recordatorio eliminado")}>Eliminar</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => run(() => setReminderDone(reminder.id, !reminder.doneAt), reminder.doneAt ? "Marcado como pendiente" : "Marcado como hecho")} className="text-text-muted hover:text-text">{reminder.doneAt ? "Marcar pendiente" : "Marcar hecho"}</Button>
          </div>
        ) : <span />}
        <Button disabled={pending} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Guardando…" : "Guardar"}</Button>
      </footer>
    </form>
  );
}

function EntryRow({ entry, showDay = false, compact = false }: { entry: Entry; showDay?: boolean; compact?: boolean }) {
  const meta = kindMeta[entry.kind];
  const Icon = meta.icon;
  if (compact) {
    return (
      <button type="button" onClick={entry.open} className={`flex w-full items-center gap-1.5 truncate rounded-md bg-surface-raised px-2 py-1.5 text-left text-xs hover:bg-accent-soft ${entry.done || entry.cancelled ? "text-text-faint line-through" : "text-text"}`}>
        <span className={`size-1.5 shrink-0 rounded-full ${meta.dot}`} />
        {entry.time ? <span className="shrink-0 font-mono tabular-nums text-text-muted">{entry.time}</span> : null}
        <span className="truncate">{entry.title}</span>
      </button>
    );
  }
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-border bg-bg p-3 transition-colors hover:border-border-strong ${entry.done || entry.cancelled ? "opacity-60" : ""}`}>
      <span className={`h-9 w-1 shrink-0 rounded-full ${meta.dot}`} />
      {entry.toggle ? (
        <input type="checkbox" checked={entry.done} onChange={(event) => entry.toggle!(event.target.checked)} aria-label={entry.done ? "Marcar como pendiente" : "Marcar como hecho"} className="size-4 shrink-0 accent-accent" />
      ) : <Icon className="size-4 shrink-0 text-text-muted" />}
      <button type="button" onClick={entry.open} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-sm font-medium ${entry.done || entry.cancelled ? "text-text-muted line-through" : "text-text"}`}>{entry.title}</p>
        <p className="mt-0.5 truncate text-xs text-text-muted">{[meta.label.replace(/s$/, ""), showDay ? formatDayKey(entry.day, { day: "numeric", month: "short" }) : null, entry.subtitle].filter(Boolean).join(" · ")}</p>
      </button>
      {entry.badge}
      <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-text-muted">{entry.time ?? "Todo el día"}</span>
    </div>
  );
}

export function AgendaWorkspace({
  today,
  initialDay,
  initialView,
  reminders,
  tasks,
  followUps,
  contentItems,
  clinics,
  vapidPublicKey,
}: {
  today: string;
  initialDay: string;
  initialView: AgendaView;
  reminders: AgendaReminder[];
  tasks: TaskData[];
  followUps: AgendaFollowUp[];
  contentItems: ContentItem[];
  clinics: ClinicOption[];
  vapidPublicKey: string | null;
}) {
  const router = useRouter();
  const [view, setView] = useState<AgendaView>(initialView);
  const [cursor, setCursor] = useState(initialDay);
  const [hidden, setHidden] = useState<Set<Kind>>(new Set());
  const [formationFilter, setFormationFilter] = useState("all");
  const [panel, setPanel] = useState<Panel>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickTime, setQuickTime] = useState(nextHour);
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<unknown>, success?: string) => startTransition(async () => {
    try { await work(); if (success) toast.success(success); } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar"); }
  });

  const formationSessions = useMemo(() => {
    const days = view === "month" ? monthGridKeys(cursor) : view === "week" ? weekKeys(cursor) : null;
    const start = view === "formation" ? `${cursor.slice(0, 7)}-01` : days?.[0] ?? cursor;
    const end = view === "formation" ? addDays(addMonths(cursor, 1), -1) : days?.at(-1) ?? cursor;
    return formationSessionsBetween(start, end);
  }, [cursor, view]);

  const filteredFormation = formationSessions.filter((session) => formationFilter === "all" || session.programId === formationFilter);
  const formationDays = [...new Set(filteredFormation.map((session) => session.date))];

  // Todo lo que tiene fecha, unificado en entradas de agenda por día.
  const entries = useMemo<Entry[]>(() => [
    ...reminders.map((reminder) => ({
      key: `reminder-${reminder.id}`, kind: "reminder" as const, title: reminder.title, subtitle: reminder.notes, day: dayKey(reminder.remindAt), time: formatTime(reminder.remindAt), done: Boolean(reminder.doneAt),
      open: () => setPanel({ type: "reminder", item: reminder, day: dayKey(reminder.remindAt) }),
      toggle: (done: boolean) => run(() => setReminderDone(reminder.id, done)),
      badge: reminder.sentAt && !reminder.doneAt ? <ToneChip tone="neutral">Avisado</ToneChip> : null,
    })),
    ...tasks.filter((task) => task.dueAt).map((task) => ({
      key: `task-${task.id}`, kind: "task" as const, title: task.title, subtitle: task.clinicName ?? task.category, day: dayKey(task.dueAt!), time: null, done: task.status === "DONE",
      open: () => setPanel({ type: "task", item: task }),
      toggle: (done: boolean) => run(() => moveTask(task.id, done ? "DONE" : "TODO")),
      badge: task.priority ? <ToneChip tone={task.priority === "URGENT" ? "danger" : "warning"}>{task.priority === "URGENT" ? "Urgente" : "Importante"}</ToneChip> : null,
    })),
    ...followUps.map((clinic) => ({
      key: `followup-${clinic.id}`, kind: "followup" as const, title: `Seguimiento · ${clinic.name}`, subtitle: null, day: dayKey(clinic.nextFollowUpAt), time: null, done: false,
      open: () => router.push("/clientes"),
      badge: <PhaseChip phase={clinic.phase} />,
    })),
    ...contentItems.filter((item) => item.scheduledFor).map((item) => ({
      key: `content-${item.id}`, kind: "content" as const, title: item.title, subtitle: null, day: dayKey(item.scheduledFor!), time: null, done: item.status === "PUBLISHED",
      open: () => setPanel({ type: "content", item, day: dayKey(item.scheduledFor!) }),
      badge: <ToneChip tone={contentStatusTone[item.status]}>{contentStatusLabels[item.status]}</ToneChip>,
    })),
    ...formationSessions.map((session) => {
      const program = formationProgramById[session.programId];
      return {
        key: `formation-${session.id}`, kind: "formation" as const, title: program.name, subtitle: session.cancelled ? `${session.topic} · Clase suspendida` : session.topic,
        day: session.date, time: program.time, done: false, cancelled: session.cancelled,
        open: () => setPanel({ type: "formation", item: session }),
        badge: session.cancelled ? <ToneChip tone="danger">Suspendida</ToneChip> : session.recording ? <ToneChip tone="success">Vídeo</ToneChip> : null,
      };
    }),
  ], [reminders, tasks, followUps, contentItems, formationSessions, router]);

  const visible = entries.filter((entry) => !hidden.has(entry.kind));
  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of visible) map.set(entry.day, [...(map.get(entry.day) ?? []), entry]);
    // Primero lo de todo el día, después por hora.
    for (const list of map.values()) list.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "") || a.kind.localeCompare(b.kind));
    return map;
  }, [visible]);

  // Lo pendiente de días anteriores se arrastra a hoy.
  const overdue = visible.filter((entry) => entry.day < today && !entry.done && entry.kind !== "content" && entry.kind !== "formation");
  const todayPending = entries.filter((entry) => entry.day === today && !entry.done && entry.kind !== "formation").length;
  const week = weekKeys(today);
  const pendingReminders = reminders.filter((reminder) => !reminder.doneAt && new Date(reminder.remindAt) > new Date()).length;
  const overdueTasks = tasks.filter((task) => task.dueAt && task.status !== "DONE" && dayKey(task.dueAt) < today).length;
  const contentThisWeek = contentItems.filter((item) => item.scheduledFor && week.includes(dayKey(item.scheduledFor))).length;

  const step = (direction: -1 | 1) => setCursor((current) => (view === "month" || view === "formation" ? addMonths(current, direction) : addDays(current, view === "week" ? 7 * direction : direction)));
  const openDay = (key: string) => { setCursor(key); setView("day"); };
  const toggleKind = (kind: Kind) => setHidden((current) => { const next = new Set(current); if (next.has(kind)) next.delete(kind); else next.add(kind); return next; });

  const rangeLabel = view === "day"
    ? formatDayKey(cursor, { weekday: "long", day: "numeric", month: "long" })
    : view === "week"
      ? `${formatDayKey(weekKeys(cursor)[0], { day: "numeric", month: "short" })} – ${formatDayKey(weekKeys(cursor)[6], { day: "numeric", month: "short", year: "numeric" })}`
      : formatDayKey(cursor, { month: "long", year: "numeric" });

  const addQuickReminder = (event: React.FormEvent) => {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title || !quickTime) return;
    run(async () => { await saveReminder({ title, remindAt: toInstant(cursor, quickTime) }); setQuickTitle(""); }, "Recordatorio creado");
  };

  const panelTitle = !panel ? "" : panel.type === "reminder" ? (panel.item ? panel.item.title : "Nuevo recordatorio") : panel.type === "task" ? (panel.item ? panel.item.title : "Nueva tarea") : panel.type === "formation" ? formationProgramById[panel.item.programId].name : panel.item ? panel.item.title : "Nueva pieza de contenido";

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Organización · Lo que hay cada día"
        actions={
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild><Button className="h-10 bg-accent text-bg hover:bg-accent-hover"><Plus className="size-4" /> Añadir</Button></PopoverTrigger>
            <PopoverContent align="end" className="flex w-56 flex-col border-border bg-surface-raised p-1.5 text-text">
              {([["reminder", "Recordatorio con aviso", Bell], ["task", "Tarea", CheckSquare2], ["content", "Pieza de contenido", Clapperboard]] as const).map(([type, label, Icon]) => (
                <button key={type} type="button" onClick={() => { setAddOpen(false); setPanel(type === "task" ? { type, item: null } : { type, item: null, day: cursor }); }} className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-surface"><Icon className="size-4 text-text-muted" /> {label}</button>
              ))}
            </PopoverContent>
          </Popover>
        }
      />

      <AgendaPushNotice vapidPublicKey={vapidPublicKey} />

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Pendiente hoy" value={String(todayPending)} note="entre todo" icon={CalendarClock} />
        <KpiCard label="Recordatorios" value={String(pendingReminders)} note="por avisar" tone="success" icon={Bell} />
        <KpiCard label="Tareas vencidas" value={String(overdueTasks)} tone={overdueTasks ? "danger" : "default"} icon={TimerReset} />
        <KpiCard label="Contenido esta semana" value={String(contentThisWeek)} tone="warning" icon={Clapperboard} />
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="max-w-full overflow-x-auto"><ViewToggle value={view} onChange={setView} options={[{ value: "day", label: "Día", icon: Rows3 }, { value: "week", label: "Semana", icon: CalendarRange }, { value: "month", label: "Mes", icon: CalendarDays }, { value: "content", label: "Contenido", icon: LayoutList }, { value: "formation", label: "Formación", icon: GraduationCap }]} /></div>
            {view !== "content" ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label="Anterior" className="border-border bg-surface-raised text-text"><ChevronLeft /></Button>
                <Button variant="outline" onClick={() => setCursor(today)} disabled={view === "formation" ? cursor.slice(0, 7) === today.slice(0, 7) : cursor === today} className="border-border bg-surface-raised text-text">{view === "formation" ? "Este mes" : "Hoy"}</Button>
                <Button variant="outline" size="icon" onClick={() => step(1)} aria-label="Siguiente" className="border-border bg-surface-raised text-text"><ChevronRight /></Button>
                <p className="min-w-44 font-heading font-medium first-letter:uppercase text-text">{rangeLabel}</p>
              </div>
            ) : null}
          </div>
          {view !== "content" && view !== "formation" ? (
            <div className="flex flex-wrap gap-2">
              {kinds.map(({ kind, label, dot }) => (
                <button key={kind} type="button" aria-pressed={!hidden.has(kind)} onClick={() => toggleKind(kind)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${hidden.has(kind) ? "border-border text-text-faint" : "border-border-strong bg-surface-raised text-text"}`}>
                  <span className={`size-2 rounded-full ${dot} ${hidden.has(kind) ? "opacity-30" : ""}`} />{label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {view === "day" ? (
          <div className="grid gap-5 p-4">
            <form onSubmit={addQuickReminder} className="flex flex-col gap-2 sm:flex-row">
              <Input value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} placeholder={`Recordatorio para ${formatDayKey(cursor, { weekday: "long", day: "numeric" })}…`} aria-label="Nuevo recordatorio" className={fieldClass} />
              <Input type="time" value={quickTime} onChange={(event) => setQuickTime(event.target.value)} aria-label="Hora del aviso" className={`${fieldClass} sm:w-32`} />
              <Button type="submit" disabled={pending || !quickTitle.trim()} className="bg-accent text-bg hover:bg-accent-hover"><Bell className="size-4" /> Recordar</Button>
            </form>
            {cursor === today && overdue.length > 0 ? (
              <div>
                <p className="section-label mb-2 text-danger">Atrasado</p>
                <div className="grid gap-2">{overdue.map((entry) => <EntryRow key={entry.key} entry={entry} showDay />)}</div>
              </div>
            ) : null}
            <div>
              <p className="section-label mb-2">{cursor === today ? "Hoy" : formatDayKey(cursor, { weekday: "long", day: "numeric", month: "long" })}</p>
              <div className="grid gap-2">
                {(byDay.get(cursor) ?? []).map((entry) => <EntryRow key={entry.key} entry={entry} />)}
                {(byDay.get(cursor) ?? []).length === 0 ? <p className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-text-muted">Nada programado para este día.</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        {view === "week" ? (
          <div className="grid gap-px bg-border md:grid-cols-7">
            {weekKeys(cursor).map((key) => (
              <div key={key} className="min-h-48 bg-surface p-2">
                <button type="button" onClick={() => openDay(key)} className={`mb-2 flex w-full items-baseline justify-between rounded-md px-1.5 py-1 text-left hover:bg-surface-raised ${key === today ? "text-accent" : "text-text-muted"}`}>
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em]">{formatDayKey(key, { weekday: "short" })}</span>
                  <span className="font-mono text-sm tabular-nums">{formatDayKey(key, { day: "numeric" })}</span>
                </button>
                <div className="space-y-1">{(byDay.get(key) ?? []).map((entry) => <EntryRow key={entry.key} entry={entry} compact />)}</div>
              </div>
            ))}
          </div>
        ) : null}

        {view === "month" ? (
          <div>
            <div className="grid grid-cols-7 border-b border-border bg-bg/50">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <div key={day} className="p-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">{day}</div>)}</div>
            <div className="grid grid-cols-7">
              {monthGridKeys(cursor).map((key) => {
                const list = byDay.get(key) ?? [];
                const muted = key.slice(0, 7) !== cursor.slice(0, 7);
                return (
                  <div key={key} className="min-h-28 border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0">
                    <button type="button" onClick={() => openDay(key)} className={`grid size-7 place-items-center rounded-full font-mono text-xs tabular-nums hover:bg-surface-raised ${key === today ? "bg-accent text-bg hover:bg-accent-hover" : muted ? "text-text-faint" : "text-text-muted"}`}>{Number(key.slice(8))}</button>
                    <div className="mt-1 space-y-1">
                      {list.slice(0, 3).map((entry) => <EntryRow key={entry.key} entry={entry} compact />)}
                      {list.length > 3 ? <button type="button" onClick={() => openDay(key)} className="px-2 text-[11px] text-text-muted hover:text-text">+{list.length - 3} más</button> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {view === "content" ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm text-text-muted">
              <span>Todas las piezas de Instagram, con o sin fecha.</span>
              <Button variant="outline" onClick={() => setPanel({ type: "content", item: null, day: cursor })} className="border-border bg-surface-raised text-text"><Plus className="size-4" /> Nueva pieza</Button>
            </div>
            <SortableTable rows={contentItems} columns={contentColumns} getRowId={(item) => item.id} onRowClick={(item) => setPanel({ type: "content", item, day: cursor })} emptyMessage="Todavía no hay piezas de contenido." />
          </>
        ) : null}

        {view === "formation" ? (
          <div>
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text">Clases en directo · MKT Hackers</p>
                <p className="mt-1 text-xs text-text-muted">{filteredFormation.filter((session) => !session.cancelled).length} clases este mes{filteredFormation.some((session) => session.cancelled) ? ` · ${filteredFormation.filter((session) => session.cancelled).length} suspendidas` : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Filtrar formación" value={formationFilter} onChange={(event) => setFormationFilter(event.target.value)} className={`${fieldClass} h-9 max-w-full sm:max-w-64`}>
                  <option value="all">Todas las formaciones</option>
                  {formationPrograms.map((program) => <option key={program.id} value={program.id}>{program.name} · {program.level} · {program.mentor}</option>)}
                </select>
                <a href={formationSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-md border border-border-strong px-3 text-xs text-text-muted hover:text-text">Ver temario PDF <ArrowUpRight className="size-3.5" /></a>
              </div>
            </div>
            {formationDays.length ? (
              <div className="grid gap-6 p-4">
                {formationDays.map((date) => (
                  <div key={date}>
                    <h2 className="section-label mb-2 first-letter:uppercase">{formatDayKey(date, { weekday: "long", day: "numeric", month: "long" })}</h2>
                    <div className="grid gap-2">
                      {filteredFormation.filter((session) => session.date === date).map((session) => {
                        const program = formationProgramById[session.programId];
                        return (
                          <button key={session.id} type="button" onClick={() => setPanel({ type: "formation", item: session })} className={`flex w-full items-start gap-3 rounded-lg border border-border bg-bg p-3 text-left transition-colors hover:border-border-strong ${session.cancelled ? "opacity-65" : ""}`}>
                            <span className="w-12 shrink-0 pt-0.5 font-mono text-xs tabular-nums text-text-muted">{program.time}</span>
                            <span className="min-w-0 flex-1">
                              <span className={`block text-sm font-medium text-text ${session.cancelled ? "line-through" : ""}`}>{program.name}</span>
                              <span className="mt-0.5 block text-sm text-text-muted">{session.topic}</span>
                              <span className="mt-1 block text-xs text-text-faint">{program.mentor} · {program.level}{session.cycle ? ` · Ciclo ${session.cycle}` : ""}</span>
                            </span>
                            {session.cancelled ? <ToneChip tone="danger">Suspendida</ToneChip> : session.recording ? <ToneChip tone="success">Vídeo</ToneChip> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="px-4 py-12 text-center text-sm text-text-muted">No hay clases de esta formación en este mes.</p>}
          </div>
        ) : null}
      </section>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-text-faint">Los seguimientos se gestionan desde <Link href="/clientes" className="inline-flex items-center gap-0.5 text-text-muted hover:text-text">Clientes <ArrowUpRight className="size-3" /></Link></p>

      <SidePanel open={panel !== null} onOpenChange={(open) => { if (!open) setPanel(null); }} size="lg" title={panelTitle} description={panel?.type === "reminder" ? "Te avisaremos a esa hora en todos los dispositivos con avisos activados." : panel?.type === "task" ? "Organiza el trabajo y vincúlalo a una clínica cuando corresponda." : panel?.type === "formation" ? "Clase en directo del programa de MKT Hackers." : "Define formato, estado, fecha y guion."}>
        {panel?.type === "reminder" ? <ReminderForm key={panel.item?.id ?? `new-${panel.day}`} reminder={panel.item} day={panel.day} onClose={() => setPanel(null)} /> : null}
        {panel?.type === "task" ? <TaskForm key={panel.item?.id ?? "new"} task={panel.item} clinics={clinics} onClose={() => setPanel(null)} /> : null}
        {panel?.type === "content" ? <ContentForm key={panel.item?.id ?? `new-${panel.day}`} item={panel.item} defaultDate={panel.day} onClose={() => setPanel(null)} /> : null}
        {panel?.type === "formation" ? (
          <div className="grid gap-5 overflow-y-auto p-5">
            <div className="flex items-center gap-2"><GraduationCap className="size-5 text-success" /><ToneChip tone={panel.item.cancelled ? "danger" : "success"}>{panel.item.cancelled ? "Clase suspendida" : panel.item.recurring ? "Tutoría semanal" : "Clase programada"}</ToneChip></div>
            <div><p className="section-label mb-1">Tema</p><p className="text-base font-medium text-text">{panel.item.topic}</p></div>
            {panel.item.recording ? (
              <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                <p className="section-label mb-1">Grabación de esta fecha</p>
                <p className="text-sm text-text">{panel.item.recording.title}</p>
                <a href={panel.item.recording.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-2 text-sm font-medium text-bg hover:opacity-90">Ver vídeo de la clase <ArrowUpRight className="size-4" /></a>
                <p className="mt-2 text-xs text-text-muted">Se abre en el campus de MKT Hackers. Puede pedirte que inicies sesión.</p>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="section-label mb-1">Fecha y hora</p><p className="text-sm text-text">{formatDayKey(panel.item.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {formationProgramById[panel.item.programId].time}</p></div>
              <div><p className="section-label mb-1">Mentor</p><p className="text-sm text-text">{formationProgramById[panel.item.programId].mentor}</p></div>
              <div><p className="section-label mb-1">Nivel</p><p className="text-sm text-text">{formationProgramById[panel.item.programId].level}</p></div>
              {panel.item.cycle ? <div><p className="section-label mb-1">Programa</p><p className="text-sm text-text">Ciclo {panel.item.cycle}{panel.item.sequence ? ` · Sesión ${panel.item.sequence}` : ""}</p></div> : panel.item.sequence ? <div><p className="section-label mb-1">Sesión</p><p className="text-sm text-text">{panel.item.sequence}</p></div> : null}
            </div>
            <div className="rounded-lg border border-border bg-bg p-4">
              <p className="section-label mb-1">Sobre el mentor</p>
              <p className="text-sm font-medium text-text">{formationMentors[formationProgramById[panel.item.programId].mentor].specialty}</p>
              <p className="mt-1 text-sm text-text-muted">{formationMentors[formationProgramById[panel.item.programId].mentor].bio}</p>
              {formationMentors[formationProgramById[panel.item.programId].mentor].profile ? <p className="mt-2 text-xs text-text-faint">{formationMentors[formationProgramById[panel.item.programId].mentor].profile}</p> : null}
            </div>
            <a href={`${formationSourceUrl}#page=${panel.item.sourcePage ?? 1}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">Ver en el temario <ArrowUpRight className="size-4" /></a>
          </div>
        ) : null}
      </SidePanel>
    </>
  );
}
