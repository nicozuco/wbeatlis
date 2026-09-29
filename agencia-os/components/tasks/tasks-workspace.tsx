"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, CircleDashed, Columns3, LayoutList, ListTodo, Lock, Plus, Search, TimerReset, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTask, moveTask, saveTask } from "@/app/actions";
import { fieldClass, selectContentClass, textareaClass } from "@/components/shared/field-styles";
import { KanbanBoard } from "@/components/shared/kanban-board";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SidePanel } from "@/components/shared/side-panel";
import { SortableTable, type Column } from "@/components/shared/sortable-table";
import { ToneChip } from "@/components/shared/status-chip";
import { ViewToggle } from "@/components/shared/view-toggle";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { gatePhases, type GatePhase } from "@/lib/client-process";
import { phaseLabels, taskStatusLabels, type PipelinePhaseValue } from "@/lib/domain";
import { formatDate, toDateInput } from "@/lib/format";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskData = { id: string; title: string; description: string | null; category: string | null; priority: "URGENT" | "IMPORTANT" | null; status: TaskStatus; dueAt: string | null; clinicId: string | null; clinicName: string | null; blocksPhase: PipelinePhaseValue | null };
export type ClinicOption = { id: string; name: string; phase: PipelinePhaseValue };

const isGatePhase = (phase: string): phase is GatePhase => (gatePhases as readonly string[]).includes(phase);

function GateChip({ phase }: { phase: PipelinePhaseValue | null }) {
  if (!phase) return null;
  return <ToneChip tone="warning"><Lock className="mr-1 inline size-3" />Obligatoria · {phaseLabels[phase]}</ToneChip>;
}

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const statusTone = (status: TaskStatus) => (status === "DONE" ? "success" : status === "IN_PROGRESS" ? "accent" : "neutral");
const isOverdue = (task: TaskData) => Boolean(task.dueAt && new Date(task.dueAt) < new Date() && task.status !== "DONE");

function PriorityChip({ priority }: { priority: TaskData["priority"] }) {
  if (!priority) return null;
  return <ToneChip tone={priority === "URGENT" ? "danger" : "warning"}>{priority === "URGENT" ? "Urgente" : "Importante"}</ToneChip>;
}

const taskColumns: Column<TaskData>[] = [
  { id: "title", header: "Tarea", cell: (task) => <span className="inline-flex items-center gap-2">{task.blocksPhase ? <Lock aria-label="Obligatoria para avanzar de fase" className="size-3.5 text-warning" /> : null}{task.title}</span>, sortValue: (task) => task.title, className: "px-5 font-medium text-text", headClassName: "px-5" },
  { id: "category", header: "Categoría", cell: (task) => task.category || "—", sortValue: (task) => task.category, className: "text-text-muted" },
  { id: "client", header: "Cliente", cell: (task) => task.clinicName || "—", sortValue: (task) => task.clinicName, className: "text-text-muted" },
  { id: "priority", header: "Prioridad", cell: (task) => (task.priority ? <PriorityChip priority={task.priority} /> : "—"), sortValue: (task) => (task.priority === "URGENT" ? 0 : task.priority === "IMPORTANT" ? 1 : null) },
  { id: "due", header: "Fecha límite", cell: (task) => <span className={isOverdue(task) ? "text-danger" : "text-text-muted"}>{formatDate(task.dueAt)}</span>, sortValue: (task) => task.dueAt, className: "font-mono tabular-nums" },
  { id: "status", header: "Estado", cell: (task) => <ToneChip tone={statusTone(task.status)}>{taskStatusLabels[task.status]}</ToneChip>, sortValue: (task) => statuses.indexOf(task.status) },
];

// Exportado para crear y editar tareas también desde la Agenda.
export function TaskForm({ task, clinics, onClose }: { task: TaskData | null; clinics: ClinicOption[]; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ title: task?.title ?? "", description: task?.description ?? "", category: task?.category ?? "", priority: task?.priority ?? "NONE", status: task?.status ?? "TODO", dueAt: toDateInput(task?.dueAt), clinicId: task?.clinicId ?? "NONE", blocksPhase: task?.blocksPhase ?? "NONE" });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const clinic = clinics.find((item) => item.id === form.clinicId);
  // Por defecto bloquea la fase en la que está ahora la clínica.
  const defaultGate: GatePhase = clinic && isGatePhase(clinic.phase) ? clinic.phase : "UNCONTACTED";
  const blocksPhase = clinic && isGatePhase(form.blocksPhase) ? form.blocksPhase : null;
  return <form onSubmit={(event) => { event.preventDefault(); startTransition(async () => { try { await saveTask({ id: task?.id, ...form, priority: form.priority === "NONE" ? null : form.priority as "URGENT" | "IMPORTANT", status: form.status as TaskStatus, clinicId: form.clinicId === "NONE" ? null : form.clinicId, blocksPhase }); toast.success(task ? "Tarea actualizada" : "Tarea añadida"); onClose(); } catch { toast.error("No se pudo guardar la tarea"); } }); }} className="flex min-h-0 flex-1 flex-col">
    <div className="grid gap-5 overflow-y-auto px-5 py-6">
      <label><Label className="mb-2 text-text-muted">Tarea</Label><Input required value={form.title} onChange={(e) => set("title", e.target.value)} className={fieldClass} /></label>
      <label><Label className="mb-2 text-text-muted">Descripción</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`min-h-28 ${textareaClass}`} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><Label className="mb-2 text-text-muted">Categoría</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} className={fieldClass} /></label>
        <label><Label className="mb-2 text-text-muted">Fecha límite</Label><Input type="date" value={form.dueAt} onChange={(e) => set("dueAt", e.target.value)} className={fieldClass} /></label>
        <div><Label className="mb-2 text-text-muted">Prioridad</Label><Select value={form.priority} onValueChange={(value) => set("priority", value)}><SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}><SelectItem value="NONE">Sin prioridad</SelectItem><SelectItem value="URGENT">Urgente</SelectItem><SelectItem value="IMPORTANT">Importante</SelectItem></SelectContent></Select></div>
        <div><Label className="mb-2 text-text-muted">Estado</Label><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}>{statuses.map((status) => <SelectItem key={status} value={status}>{taskStatusLabels[status]}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label className="mb-2 text-text-muted">Cliente vinculado</Label><Select value={form.clinicId} onValueChange={(value) => set("clinicId", value)}><SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}><SelectItem value="NONE">Ninguno</SelectItem>{clinics.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {phaseLabels[item.phase]}</SelectItem>)}</SelectContent></Select></div>
      {clinic ? (
        <div className="rounded-lg border border-border bg-bg p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox checked={Boolean(blocksPhase)} onCheckedChange={(checked) => set("blocksPhase", checked ? defaultGate : "NONE")} className="mt-0.5" />
            <span><span className="text-sm font-medium text-text">Obligatoria para avanzar de fase</span><span className="mt-1 block text-xs leading-5 text-text-muted">{clinic.name} no podrá pasar de la fase elegida hasta que esta tarea esté completada.</span></span>
          </label>
          {blocksPhase ? (
            <div className="mt-3"><Label className="mb-2 text-text-muted">Bloquea el avance desde</Label><Select value={blocksPhase} onValueChange={(value) => set("blocksPhase", value)}><SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}>{gatePhases.map((phase) => <SelectItem key={phase} value={phase}>{phaseLabels[phase]}{phase === clinic.phase ? " (fase actual)" : ""}</SelectItem>)}</SelectContent></Select></div>
          ) : null}
        </div>
      ) : null}
    </div>
    <footer className="mt-auto flex items-center justify-between border-t border-border p-5">{task ? <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /> Eliminar</Button></AlertDialogTrigger><AlertDialogContent className="border-border bg-surface-raised text-text"><AlertDialogHeader><AlertDialogTitle>Eliminar tarea</AlertDialogTitle><AlertDialogDescription className="text-text-muted">Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => startTransition(async () => { await deleteTask(task.id); toast.success("Tarea eliminada"); onClose(); })}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : <span />}<Button disabled={pending} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Guardando…" : "Guardar tarea"}</Button></footer>
  </form>;
}

export function TasksWorkspace({ tasks, clinics }: { tasks: TaskData[]; clinics: ClinicOption[] }) {
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selected, setSelected] = useState<TaskData | null>(null);
  const [open, setOpen] = useState(false);
  const [moving, startMoving] = useTransition();
  const categories = useMemo(() => Array.from(new Set(tasks.map((task) => task.category).filter(Boolean) as string[])).sort(), [tasks]);
  const filtered = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()) && (category === "ALL" || task.category === category));
  const overdue = tasks.filter(isOverdue).length;
  const openTask = (task: TaskData | null) => { setSelected(task); setOpen(true); };
  const moveToStatus = (task: TaskData, status: TaskStatus) => startMoving(async () => { try { await moveTask(task.id, status); toast.success("Estado actualizado"); } catch { toast.error("No se pudo mover la tarea"); } });

  return <>
    <PageHeader title="Tareas" description="Operaciones · Pendientes" actions={<Button onClick={() => openTask(null)} className="bg-accent text-bg hover:bg-accent-hover"><Plus className="size-4" /> Nueva tarea</Button>} />
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Pendientes" value={String(tasks.filter((task) => task.status === "TODO").length)} icon={ListTodo} /><KpiCard label="En curso" value={String(tasks.filter((task) => task.status === "IN_PROGRESS").length)} tone="warning" icon={CircleDashed} /><KpiCard label="Retrasadas" value={String(overdue)} tone={overdue ? "danger" : "default"} icon={TimerReset} /><KpiCard label="Completadas" value={String(tasks.filter((task) => task.status === "DONE").length)} tone="success" icon={CheckCircle2} /></section>
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between"><ViewToggle value={view} onChange={setView} options={[{ value: "list", label: "Lista", icon: LayoutList }, { value: "kanban", label: "Kanban", icon: Columns3 }]} /><div className="flex gap-2"><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tareas…" className={`${fieldClass} w-60 pl-9`} /></label><Select value={category} onValueChange={setCategory}><SelectTrigger className={`${fieldClass} w-44`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}><SelectItem value="ALL">Todas las categorías</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
      {view === "kanban" ? (
        <KanbanBoard
          columns={statuses.map((status) => ({ id: status, header: <ToneChip tone={statusTone(status)}>{taskStatusLabels[status]}</ToneChip> }))}
          items={filtered}
          getItemId={(task) => task.id}
          getItemColumn={(task) => task.status}
          getItemLabel={(task) => task.title}
          getCardClassName={(task) => (isOverdue(task) ? "border-danger/50" : "border-border")}
          onMove={moveToStatus}
          busy={moving}
          emptyLabel="Sin tareas"
          renderCard={(task) => (
            <>
              <button type="button" onClick={() => openTask(task)} className="text-left"><p className="text-sm font-medium text-text">{task.title}</p><p className="mt-1 text-xs text-text-muted">{task.clinicName || task.category || "Agencia"}</p></button>
              {task.blocksPhase ? <div className="mt-3"><GateChip phase={task.blocksPhase} /></div> : null}
              <div className="mt-4 flex items-center justify-between gap-2"><PriorityChip priority={task.priority} />{task.dueAt ? <span className={`font-mono text-xs tabular-nums ${isOverdue(task) ? "text-danger" : "text-text-muted"}`}>{formatDate(task.dueAt)}</span> : null}</div>
            </>
          )}
        />
      ) : (
        <SortableTable rows={filtered} columns={taskColumns} getRowId={(task) => task.id} onRowClick={openTask} emptyMessage="No hay tareas que coincidan con la búsqueda." />
      )}
    </section>
    <SidePanel open={open} onOpenChange={setOpen} size="lg" title={selected ? selected.title : "Nueva tarea"} description="Organiza el trabajo y vincúlalo a una clínica cuando corresponda.">
      <TaskForm key={selected?.id ?? "new"} task={selected} clinics={clinics} onClose={() => setOpen(false)} />
    </SidePanel>
  </>;
}
