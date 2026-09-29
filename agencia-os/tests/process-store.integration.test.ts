import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { phaseGuides } from "../lib/client-process";
import { transitionClinic } from "../lib/process-store";

test("proceso persistente: validación, avance, reapertura e historial (con rollback)", { skip: process.env.PROCESS_INTEGRATION !== "1" }, async () => {
  const db = new PrismaClient();
  const rollback = new Error("ROLLBACK_TEST");
  const id = `process-test-${crypto.randomUUID()}`;
  try {
    await assert.rejects(db.$transaction(async (tx) => {
      await tx.clinic.create({ data: { id, name: "Verificación de proceso · rollback" } });
      await assert.rejects(transitionClinic(tx, id, "CONTACTED", "UNCONTACTED", true), /Completa los pasos/);
      for (const step of phaseGuides.UNCONTACTED.steps) {
        await tx.clinicProcessStep.create({ data: { clinicId: id, phase: "UNCONTACTED", stepKey: step.key, completedAt: new Date() } });
      }
      // Una tarea obligatoria pendiente bloquea cualquier avance, también saltando fases desde el Kanban.
      const gate = await tx.task.create({ data: { title: "Enviar dossier", clinicId: id, blocksPhase: "UNCONTACTED" } });
      await assert.rejects(transitionClinic(tx, id, "CONTACTED", "UNCONTACTED", true), /tareas obligatorias/);
      await assert.rejects(transitionClinic(tx, id, "RESPONDED"), /«Enviar dossier»/);
      await tx.task.update({ where: { id: gate.id }, data: { status: "DONE" } });
      await transitionClinic(tx, id, "CONTACTED", "UNCONTACTED", true);
      const updated = await tx.clinic.findUniqueOrThrow({ where: { id } });
      assert.equal(updated.phase, "CONTACTED");
      assert.ok(updated.firstContactAt);
      await assert.rejects(transitionClinic(tx, id, "CONTACTED", "UNCONTACTED", true), /La fase ha cambiado/);
      await assert.rejects(transitionClinic(tx, id, "CONTRACTED", "CONTACTED", true), /Solo puedes avanzar/);
      assert.equal(await tx.clinicStageEvent.count({ where: { clinicId: id } }), 1);
      await transitionClinic(tx, id, "UNCONTACTED", "CONTACTED");
      assert.equal(await tx.clinicProcessStep.count({ where: { clinicId: id, phase: "UNCONTACTED" } }), 0);
      assert.equal(await tx.clinicStageEvent.count({ where: { clinicId: id } }), 2);
      // Llegar a Primer cobro (también saltando fases) registra el ingreso una sola vez.
      await tx.clinic.update({ where: { id }, data: { phase: "CONTRACT_SIGNED", monthlyFeeCents: 50000 } });
      await transitionClinic(tx, id, "ACTIVE");
      await transitionClinic(tx, id, "CONTRACT_SIGNED");
      await transitionClinic(tx, id, "FIRST_PAYMENT");
      const firstPayments = await tx.financeEntry.findMany({ where: { clinicId: id, type: "INCOME" } });
      assert.equal(firstPayments.length, 1);
      assert.equal(firstPayments[0].amountCents, 50000);
      await tx.clinic.update({ where: { id }, data: { phase: "UNCONTACTED" } });
      // Descartar no es avanzar: una tarea obligatoria pendiente no lo impide.
      await tx.task.create({ data: { title: "Pendiente", clinicId: id, blocksPhase: "UNCONTACTED" } });
      await transitionClinic(tx, id, "DISCARDED");
      assert.equal((await tx.clinic.findUniqueOrThrow({ where: { id } })).phase, "DISCARDED");
      throw rollback;
    }, { timeout: 20000 }), (error) => error === rollback);
    assert.equal(await db.clinic.count({ where: { id } }), 0);
  } finally {
    await db.$disconnect();
  }
});
