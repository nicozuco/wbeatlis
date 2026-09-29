"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, CircleDashed, Clock3, ListChecks, Map, Target } from "lucide-react";
import { toast } from "sonner";

import { setGoalStepCompleted } from "@/app/actions";
import { GoalAnswerField, type GoalAttachmentData } from "@/components/goals/goal-answer-field";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { goalProgress } from "@/lib/goals";
import { goalStepFields } from "@/lib/goal-step-fields";

type GoalStepData = { id: string; title: string; description: string | null; answer: string | null; attachments: GoalAttachmentData[]; referenceUrl: string | null; completedAt: string | null };
type GoalSectionData = { id: string; title: string; description: string | null; steps: GoalStepData[] };
export type GoalData = { id: string; slug: string; title: string; description: string | null; sections: GoalSectionData[] };

function progressClass(percentage: number) {
  return percentage === 100 ? "[&_[data-slot=progress-indicator]]:bg-success" : "[&_[data-slot=progress-indicator]]:bg-accent";
}

export function GoalsWorkspace({ goals }: { goals: GoalData[] }) {
  const router = useRouter();
  const [localGoals, setLocalGoals] = useState(goals);
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  const goal = localGoals[0] ?? null;

  if (!goal) {
    return (
      <>
        <PageHeader title="Objetivos" description="Estrategia · Progreso" />
        <section className="mt-8 rounded-xl border border-dashed border-border py-20 text-center">
          <Target className="mx-auto size-8 text-text-faint" />
          <p className="mt-4 text-sm text-text-muted">Todavía no hay objetivos.</p>
        </section>
      </>
    );
  }

  const allSteps = goal.sections.flatMap((section) => section.steps);
  const overall = goalProgress(allSteps);

  const toggleStep = async (stepId: string, completed: boolean) => {
    const previousCompletedAt = allSteps.find((step) => step.id === stepId)?.completedAt ?? null;
    setLocalGoals((current) => current.map((item) => item.id !== goal.id ? item : ({
      ...item,
      sections: item.sections.map((section) => ({
        ...section,
        steps: section.steps.map((step) => step.id === stepId ? { ...step, completedAt: completed ? new Date().toISOString() : null } : step),
      })),
    })));
    setPending((current) => new Set(current).add(stepId));
    try {
      await setGoalStepCompleted({ id: stepId, completed });
      router.refresh();
    } catch (error) {
      setLocalGoals((current) => current.map((item) => item.id !== goal.id ? item : ({
        ...item,
        sections: item.sections.map((section) => ({
          ...section,
          steps: section.steps.map((step) => step.id === stepId ? { ...step, completedAt: previousCompletedAt } : step),
        })),
      })));
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el paso");
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(stepId);
        return next;
      });
    }
  };

  const setLocalAnswer = (stepId: string, answer: string | null) => {
    setLocalGoals((current) => current.map((item) => item.id !== goal.id ? item : ({
      ...item,
      sections: item.sections.map((section) => ({
        ...section,
        steps: section.steps.map((step) => step.id === stepId ? { ...step, answer } : step),
      })),
    })));
  };

  const setLocalAttachments = (stepId: string, attachments: GoalAttachmentData[]) => {
    setLocalGoals((current) => current.map((item) => item.id !== goal.id ? item : ({
      ...item,
      sections: item.sections.map((section) => ({
        ...section,
        steps: section.steps.map((step) => step.id === stepId ? { ...step, attachments } : step),
      })),
    })));
  };

  const jumpTo = (sectionId: string) => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <PageHeader
        title="Objetivos"
        description="Estrategia · Progreso"
        actions={(
          <Link href="/mapa?id=cmubgb9i10000p1mcsfzft1nz" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text">
            <Map className="size-4" /> Ver mapa de lanzamiento
          </Link>
        )}
      />

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid gap-6 border-b border-border bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_45%)] p-6 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-accent"><Target className="size-4" /><span className="section-label">Objetivo activo</span></div>
            <h2 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.02em] text-text sm:text-3xl">{goal.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">{goal.description}</p>
          </div>
          <div className="rounded-xl border border-border bg-bg/70 p-4">
            <div className="flex items-end justify-between gap-3"><span className="text-sm text-text-muted">Progreso total</span><span className="font-heading text-3xl font-semibold text-text">{overall.percentage}%</span></div>
            <Progress value={overall.percentage} aria-label={`${overall.percentage}% completado`} className={`mt-3 h-2.5 bg-surface-raised ${progressClass(overall.percentage)}`} />
            <p className="mt-3 text-xs text-text-faint">{overall.completed} de {overall.total} pasos · {overall.remaining} pendientes</p>
          </div>
        </div>
      </section>

      <section aria-label="Resumen del objetivo" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Fases" value={String(goal.sections.length)} note="subcategorías" icon={ListChecks} />
        <KpiCard label="Completados" value={String(overall.completed)} note="pasos cerrados" tone="success" icon={CheckCircle2} />
        <KpiCard label="Pendientes" value={String(overall.remaining)} note="por completar" tone={overall.remaining ? "warning" : "success"} icon={CircleDashed} />
        <KpiCard label="Progreso" value={`${overall.percentage}%`} note="del lanzamiento" icon={Clock3} />
      </section>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-surface p-3 lg:sticky lg:top-6">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-faint">Subcategorías</p>
          <nav aria-label="Fases del objetivo" className="space-y-1">
            {goal.sections.map((section) => {
              const sectionProgress = goalProgress(section.steps);
              return (
                <button key={section.id} type="button" onClick={() => jumpTo(section.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-surface-raised">
                  <span className={`grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${sectionProgress.percentage === 100 ? "border-success/40 bg-success/10 text-success" : "border-border bg-bg text-text-muted"}`}>{sectionProgress.percentage === 100 ? <CheckCircle2 className="size-3.5" /> : `${sectionProgress.completed}/${sectionProgress.total}`}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-text-muted">{section.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <Accordion type="multiple" defaultValue={goal.sections.map((section) => section.id)} className="space-y-3">
          {goal.sections.map((section) => {
            const sectionProgress = goalProgress(section.steps);
            return (
              <AccordionItem key={section.id} id={section.id} value={section.id} className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-surface">
                <AccordionTrigger className="px-5 py-5 hover:no-underline">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><h3 className="font-heading text-lg font-semibold text-text">{section.title}</h3>{section.description ? <p className="mt-1 text-xs text-text-muted">{section.description}</p> : null}</div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] ${sectionProgress.percentage === 100 ? "bg-success/10 text-success" : "bg-accent-soft text-accent"}`}>{sectionProgress.completed}/{sectionProgress.total} · {sectionProgress.percentage}%</span>
                    </div>
                    <Progress value={sectionProgress.percentage} className={`mt-4 h-1.5 bg-bg ${progressClass(sectionProgress.percentage)}`} />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border px-3 pt-3 pb-3 sm:px-5">
                  <div className="space-y-2">
                    {section.steps.map((step) => {
                      const checked = Boolean(step.completedAt);
                      const field = goalStepFields[step.id];
                      return (
                        <div key={step.id} className={`rounded-lg border p-3.5 transition-colors ${checked ? "border-success/20 bg-success/[0.04]" : "border-border bg-bg hover:border-border-strong"}`}>
                          <div className="flex items-start gap-3">
                            <Checkbox id={`goal-step-${step.id}`} checked={checked} disabled={pending.has(step.id)} onCheckedChange={(value) => void toggleStep(step.id, value === true)} aria-label={`${checked ? "Marcar como pendiente" : "Completar"}: ${step.title}`} className="mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <label htmlFor={`goal-step-${step.id}`} className={`block cursor-pointer text-sm font-medium ${checked ? "text-text-muted line-through" : "text-text"}`}>{step.title}</label>
                              {step.description ? <p className="mt-1 text-xs leading-5 text-text-muted">{step.description}</p> : null}
                              {step.referenceUrl ? <a href={step.referenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover">Abrir recurso <ArrowUpRight className="size-3" /></a> : null}
                              {field ? <GoalAnswerField stepId={step.id} answer={step.answer} attachments={step.attachments} field={field} onSaved={(answer) => setLocalAnswer(step.id, answer)} onAttachmentsChange={(attachments) => setLocalAttachments(step.id, attachments)} /> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </>
  );
}
