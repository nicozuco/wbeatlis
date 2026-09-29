"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Check, CheckCheck, Circle, Clock3, History, ListChecks, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { advanceClinic, moveTask, saveTask, setProcessStep } from "@/app/actions";
import { fieldClass } from "@/components/shared/field-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhaseChip } from "@/components/shared/status-chip";
import { checklistProgress, isFollowUpOverdue, phaseAgeDays, phaseGuides, salesPhases, type GatePhase } from "@/lib/client-process";
import { MRR_PHASE, phaseLabels, pipelinePhases, servicePhases, type PipelinePhaseValue } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import type { ClientData } from "./clients-workspace";

export function ProcessOverview({ clients, phase, onPhaseChange }: { clients: ClientData[]; phase: string; onPhaseChange: (phase: string) => void }) {
  return (
    <section aria-label="Fases del proceso comercial" className="mt-6 rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3"><div><p className="section-label">De oportunidad a cliente</p><p className="mt-1 text-sm text-text-muted">Selecciona una fase para concentrarte en el siguiente paso.</p></div><button type="button" onClick={() => onPhaseChange("ALL")} className="shrink-0 text-xs text-accent">Ver todas</button></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-11">
        {pipelinePhases.map((value, index) => (
          <button key={value} type="button" aria-pressed={phase === value} onClick={() => onPhaseChange(phase === value ? "ALL" : value)} className={`rounded-lg border p-3 text-left transition-colors hover:border-accent/50 ${phase === value ? "border-accent bg-accent-soft" : "border-border bg-bg"}`}>
            <div className="flex items-center justify-between"><span className="text-xs text-text-faint">{value === "DISCARDED" ? "Cerradas" : `${(servicePhases as readonly string[]).includes(value) ? "Servicio · " : ""}${String(index + 1).padStart(2, "0")}`}</span><span className="font-mono text-lg tabular-nums">{clients.filter((client) => client.phase === value).length}</span></div>
            <p className="mt-2 text-xs font-medium">{phaseLabels[value]}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProcessCard({ client, now, onOpen }: { client: ClientData; now: Date; onOpen: () => void }) {
  const [pending, startTransition] = useTransition();
  const [taskDraft, setTaskDraft] = useState("");
  const [mandatory, setMandatory] = useState(true);
  const guide = phaseGuides[client.phase];
  const progress = checklistProgress(client.phase, client.processSteps);
  const gateTasks = client.tasks.filter((task) => task.blocksPhase === client.phase);
  // Todas las tareas pendientes de la clínica, más las obligatorias de esta fase ya hechas; las obligatorias primero.
  const clinicTasks = client.tasks
    .filter((task) => task.status !== "DONE" || task.blocksPhase === client.phase)
    .sort((a, b) => Number(b.blocksPhase === client.phase) - Number(a.blocksPhase === client.phase) || Number(a.status === "DONE") - Number(b.status === "DONE"));
  const pendingGateTasks = gateTasks.filter((task) => task.status !== "DONE").length;
  const canAdvance = progress.ready && pendingGateTasks === 0;
  const pendingSteps = progress.total - progress.completed;
  const advanceHint = canAdvance && guide.next
    ? `Siguiente: ${phaseLabels[guide.next]}${guide.next === "FIRST_PAYMENT" && client.monthlyFeeCents > 0 ? " · se registrará el primer cobro en Finanzas" : ""}`
    : [pendingSteps > 0 ? `los ${pendingSteps} pasos pendientes` : null, pendingGateTasks > 0 ? `${pendingGateTasks === 1 ? "la tarea obligatoria" : `las ${pendingGateTasks} tareas obligatorias`}` : null].filter(Boolean).join(" y ");
  const age = phaseAgeDays(client.createdAt, client.stageEvents, now);
  const overdue = isFollowUpOverdue(client.nextFollowUpAt, now);
  const run = (work: () => Promise<unknown>, success?: string) => startTransition(async () => {
    try { await work(); if (success) toast.success(success); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar. Inténtalo de nuevo."); }
  });
  return (
    <article aria-label={`Proceso de ${client.name}`} className="flex min-w-0 flex-col rounded-xl border border-border bg-bg p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0"><button type="button" onClick={onOpen} className="text-left font-heading text-lg font-semibold hover:text-accent">{client.name}</button><p className="mt-1 text-xs text-text-muted">{[client.city, client.contactName].filter(Boolean).join(" · ") || "Completa los datos de contacto en la ficha"}</p></div>
        <PhaseChip phase={client.phase} />
      </header>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{age} {age === 1 ? "día" : "días"} en esta fase</span>
        <button type="button" onClick={onOpen} className={overdue ? "text-danger" : !client.nextFollowUpAt && guide.next ? "text-warning" : ""}>{client.nextFollowUpAt ? `${overdue ? "Seguimiento vencido" : "Seguimiento"} · ${formatDate(client.nextFollowUpAt)}` : guide.next ? "Añadir fecha de seguimiento" : "Sin seguimiento programado"}</button>
      </div>
      <p className="mt-5 text-sm leading-6 text-text-muted">{guide.objective}</p>
      {guide.steps.length > 0 && <>
        <div className="mt-4 flex items-center justify-between text-xs"><span className="section-label">{guide.next ? "Para pasar de fase" : "Inicio del servicio"}</span><span className={progress.ready ? "text-accent" : "text-text-muted"}>{progress.completed}/{progress.total} completados</span></div>
        <div role="progressbar" aria-label="Pasos completados de la fase" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.completed} className="mt-2 h-1 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress.completed / progress.total * 100}%` }} /></div>
        <div className="my-4 space-y-2">
          {guide.steps.map((step) => {
            const checked = client.processSteps.some((check) => check.phase === client.phase && check.stepKey === step.key && check.completedAt);
            return <label key={step.key} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-5 transition-colors ${checked ? "border-accent/15 bg-accent/5 text-text-muted" : "border-border bg-surface text-text"} ${pending ? "pointer-events-none opacity-60" : ""}`}>
              <input type="checkbox" checked={checked} disabled={pending} onChange={(event) => run(() => setProcessStep({ clinicId: client.id, phase: client.phase, stepKey: step.key, completed: event.target.checked }))} className="mt-0.5 size-4 shrink-0 accent-accent" />
              <span>{step.label}</span>
            </label>;
          })}
        </div>
      </>}
      {client.phase !== "DISCARDED" && <div className="mb-4">
        <div className="flex items-center justify-between text-xs"><span className="section-label">Tareas de la clínica</span>{gateTasks.length > 0 && <span className={pendingGateTasks ? "text-warning" : "text-accent"}>{gateTasks.length - pendingGateTasks}/{gateTasks.length} obligatorias hechas</span>}</div>
        {clinicTasks.length > 0 ? <div className="mt-2 space-y-2">
          {clinicTasks.map((task) => {
            const done = task.status === "DONE";
            const gatesThisPhase = task.blocksPhase === client.phase;
            return <label key={task.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-5 transition-colors ${done ? "border-accent/15 bg-accent/5 text-text-muted line-through" : gatesThisPhase ? "border-warning/30 bg-warning/5 text-text" : "border-border bg-surface text-text"} ${pending ? "pointer-events-none opacity-60" : ""}`}>
              <input type="checkbox" checked={done} disabled={pending} onChange={(event) => run(() => moveTask(task.id, event.target.checked ? "DONE" : "TODO"))} className="mt-0.5 size-4 shrink-0 accent-accent" />
              <span className="min-w-0 flex-1">{task.title}</span>
              {task.blocksPhase ? <span className={`inline-flex shrink-0 items-center gap-1 text-xs no-underline ${gatesThisPhase ? "text-warning" : "text-text-faint"}`}><Lock className="size-3" />{gatesThisPhase ? "Obligatoria" : `Obligatoria · ${phaseLabels[task.blocksPhase]}`}</span> : null}
            </label>;
          })}
        </div> : <p className="mt-2 text-xs text-text-faint">Sin tareas pendientes.</p>}
        <form className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={(event) => {
          event.preventDefault();
          const title = taskDraft.trim();
          if (!title) return;
          const blocksPhase = mandatory && guide.next ? client.phase as GatePhase : null;
          run(async () => { await saveTask({ title, status: "TODO", clinicId: client.id, blocksPhase }); setTaskDraft(""); }, blocksPhase ? "Tarea obligatoria añadida" : "Tarea añadida");
        }}>
          <Input value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="Añadir tarea para esta clínica…" aria-label="Nueva tarea de la clínica" className={`${fieldClass} h-9 text-sm`} />
          {guide.next ? <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-text-muted"><input type="checkbox" checked={mandatory} onChange={(event) => setMandatory(event.target.checked)} className="size-3.5 accent-accent" /><Lock className="size-3" />Obligatoria</label> : null}
          <Button type="submit" variant="outline" disabled={pending || !taskDraft.trim()} className="h-9 border-border bg-surface text-text"><Plus className="size-4" />Añadir</Button>
        </form>
      </div>}
      <div className="mt-auto pt-2">
        {guide.next ? <>
          <Button disabled={pending || !canAdvance} onClick={() => run(() => advanceClinic({ clinicId: client.id, phase: client.phase }), `Cliente en ${phaseLabels[guide.next!]}`)} className="h-auto min-h-10 w-full whitespace-normal bg-accent py-2 text-bg hover:bg-accent-hover"><ArrowRight className="size-4 shrink-0" />{pending ? "Guardando…" : "Pasar a la siguiente fase"}</Button>
          <p aria-live="polite" className="mt-2 text-center text-xs text-text-muted">{canAdvance ? advanceHint : `Completa ${advanceHint} para avanzar a ${phaseLabels[guide.next]}.`}</p>
        </> : client.phase === MRR_PHASE ? <p className="flex items-center justify-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success"><CheckCheck className="size-4" />Cliente activo · su cuota cuenta en el MRR</p> : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs"><button type="button" onClick={onOpen} className="text-accent">Ficha, notas y seguimiento <span aria-hidden="true">↗</span></button><Link href="/tareas" className="text-text-muted">{client.tasks.filter((task) => task.status !== "DONE").length} tareas pendientes</Link></div>
        <details className="mt-3 text-xs text-text-muted"><summary className="flex cursor-pointer items-center gap-2"><History className="size-3.5" /> Historial de fases ({client.stageEvents.length})</summary><ol className="mt-3 space-y-2 border-l border-border pl-3">{[...client.stageEvents].sort((a, b) => b.changedAt.localeCompare(a.changedAt)).map((event) => <li key={event.id}><span className="text-text">{event.fromPhase ? `${phaseLabels[event.fromPhase]} → ` : "Alta · "}{phaseLabels[event.toPhase]}</span><span className="mt-1 block">{formatDate(event.changedAt, { year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></li>)}{client.stageEvents.length === 0 && <li>Aún no hay cambios de fase registrados.</li>}</ol></details>
      </div>
    </article>
  );
}

export function ProcessBoard({ clients, phase, now, onOpen }: { clients: ClientData[]; phase: string; now: string; onOpen: (client: ClientData) => void }) {
  const [attention, setAttention] = useState(false);
  const date = new Date(now);
  const needsAttention = (client: ClientData) => !!phaseGuides[client.phase].next && (isFollowUpOverdue(client.nextFollowUpAt, date) || !client.nextFollowUpAt);
  const visible = clients.filter((client) => !attention || needsAttention(client)).sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a)) || (a.nextFollowUpAt ?? "9999").localeCompare(b.nextFollowUpAt ?? "9999") || a.name.localeCompare(b.name, "es"));
  const guide = phase !== "ALL" ? phaseGuides[phase as PipelinePhaseValue] : null;
  return <div className="p-4">
    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-sm"><ListChecks className="size-4 text-accent" /><span>Plan de acción por cliente</span><span className="text-text-muted">· {visible.length}</span></div><button type="button" aria-pressed={attention} onClick={() => setAttention(!attention)} className={`rounded-lg border px-3 py-2 text-xs ${attention ? "border-warning/50 bg-warning/10 text-warning" : "border-border text-text-muted"}`}>Solo sin seguimiento o vencidos ({clients.filter(needsAttention).length})</button></div>
    {guide && <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-4"><p className="font-medium">{phaseLabels[phase as PipelinePhaseValue]}</p><p className="mt-1 text-sm text-text-muted">{guide.objective}</p>{visible.length === 0 && <ol className="mt-3 space-y-2 text-sm text-text-muted">{guide.steps.map((step, index) => <li key={step.key}>{index + 1}. {step.label}</li>)}</ol>}</div>}
    <div className="grid items-stretch gap-4 xl:grid-cols-2">{visible.map((client) => <ProcessCard key={client.id} client={client} now={date} onOpen={() => onOpen(client)} />)}</div>
    {visible.length === 0 && <div className="py-12 text-center"><Circle className="mx-auto size-7 text-text-faint" /><p className="mt-3 text-sm text-text-muted">No hay clientes en esta selección.</p><p className="mt-1 text-xs text-text-muted">Cambia los filtros o añade una clínica para iniciar su proceso.</p></div>}
    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-text-faint"><Check className="size-3.5" />Cada paso se guarda al marcarlo. {salesPhases.length} fases comerciales y {servicePhases.length} de servicio; los descartes se gestionan desde la ficha.</div>
  </div>;
}
