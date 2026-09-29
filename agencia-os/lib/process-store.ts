import type { Prisma } from "@prisma/client";
import { FIRST_PAYMENT_DESCRIPTION, isForwardMove, passesThrough, phaseGuides } from "./client-process";
import type { PipelinePhaseValue } from "./domain";

// Serializa los cambios de una clínica para impedir avances duplicados entre pestañas.
export async function lockClinic(tx: Prisma.TransactionClient, id: string, expectedPhase?: PipelinePhaseValue) {
  const rows = await tx.$queryRaw<{ phase: PipelinePhaseValue }[]>`SELECT "phase" FROM "Clinic" WHERE "id" = ${id} FOR UPDATE`;
  if (!rows[0]) throw new Error("Esta clínica ya no existe.");
  if (expectedPhase && rows[0].phase !== expectedPhase) throw new Error("La fase ha cambiado. Actualiza la página antes de continuar.");
  return tx.clinic.findUniqueOrThrow({ where: { id } });
}

export async function transitionClinic(tx: Prisma.TransactionClient, id: string, phase: PipelinePhaseValue, expectedPhase?: PipelinePhaseValue, requireChecklist = false) {
  const clinic = await lockClinic(tx, id, expectedPhase);
  if (clinic.phase === phase) return;
  // Vale para cualquier forma de avanzar (pasos guiados, Kanban o ficha): las
  // tareas obligatorias de la fase actual tienen que estar hechas.
  if (isForwardMove(clinic.phase, phase)) {
    const pending = await tx.task.findMany({ where: { clinicId: id, blocksPhase: clinic.phase, status: { not: "DONE" } }, select: { title: true }, orderBy: { createdAt: "asc" } });
    if (pending.length > 0) {
      throw new Error(`Completa antes las tareas obligatorias de esta fase: ${pending.map((task) => `«${task.title}»`).join(", ")}.`);
    }
  }
  if (requireChecklist) {
    const guide = phaseGuides[clinic.phase];
    if (guide.next !== phase) throw new Error("Solo puedes avanzar a la siguiente fase del proceso.");
    const checks = await tx.clinicProcessStep.findMany({ where: { clinicId: id, phase: clinic.phase, completedAt: { not: null } } });
    if (!guide.steps.every((step) => checks.some((check) => check.stepKey === step.key))) {
      throw new Error("Completa los pasos de esta fase antes de avanzar.");
    }
  }
  const now = new Date();
  await tx.clinic.update({ where: { id }, data: {
    phase,
    ...(!clinic.firstContactAt && phase === "CONTACTED" && requireChecklist ? { firstContactAt: now } : {}),
  } });
  // Llegar a Primer cobro registra ese ingreso en Finanzas (una sola vez por clínica).
  if (passesThrough(clinic.phase, phase, "FIRST_PAYMENT") && clinic.monthlyFeeCents > 0) {
    const alreadyRecorded = await tx.financeEntry.count({ where: { clinicId: id, type: "INCOME", description: { startsWith: FIRST_PAYMENT_DESCRIPTION } } });
    if (!alreadyRecorded) {
      await tx.financeEntry.create({ data: { type: "INCOME", description: `${FIRST_PAYMENT_DESCRIPTION} · ${clinic.name}`, amountCents: clinic.monthlyFeeCents, occurredAt: now, clinicId: id } });
    }
  }
  // Una fase reabierta comienza con una nueva lista pendiente.
  await tx.clinicProcessStep.deleteMany({ where: { clinicId: id, phase } });
  await tx.clinicStageEvent.create({ data: { clinicId: id, fromPhase: clinic.phase, toPhase: phase, changedAt: now } });
}
