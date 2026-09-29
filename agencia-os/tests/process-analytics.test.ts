import assert from "node:assert/strict";
import test from "node:test";
import { checklistProgress, isForwardMove, isFollowUpOverdue, passesThrough, phaseAgeDays } from "../lib/client-process";
import { commercialAnalytics, financeAnalytics, highestReached, inPeriod, monthlyActivity, periodStart, type AnalyticsClient } from "../lib/analytics";
import { pipelineCounts } from "../lib/metrics";

const now = "2026-09-14T20:00:00.000Z";
const clinic = (overrides: Partial<AnalyticsClient> = {}): AnalyticsClient => ({ id: "test", name: "Test", phase: "UNCONTACTED", city: null, leadSource: null, createdAt: "2026-08-01T12:00:00.000Z", firstContactAt: null, nextFollowUpAt: null, monthlyFeeCents: 10000, stageEvents: [], ...overrides });

test("descartar sin contacto no infla el embudo ni las tasas", () => {
  const item = clinic({ phase: "DISCARDED", stageEvents: [{ fromPhase: "UNCONTACTED", toPhase: "DISCARDED", changedAt: now }] });
  assert.deepEqual(pipelineCounts([item]), { contacted: 0, responded: 0, contracted: 0 });
  assert.equal(highestReached(item), 0);
});

test("el historial conserva respuestas y contratos tras descartar o retroceder", () => {
  const item = clinic({ phase: "UNCONTACTED", stageEvents: [{ fromPhase: "CONTRACTED", toPhase: "UNCONTACTED", changedAt: now }] });
  const result = commercialAnalytics([item], now);
  assert.equal(result.responded, 1);
  assert.equal(result.contracted, 0);
  assert.equal(result.funnel[5].count, 1);
  assert.equal(result.funnel[5].conversion, 100);
});

test("los saltos de fase dan un embudo monótono con denominadores consistentes", () => {
  const result = commercialAnalytics([clinic(), clinic({ phase: "PROPOSAL_SENT" }), clinic({ phase: "CONTRACTED" }), clinic({ phase: "DISCARDED" })], now);
  assert.deepEqual(result.funnel.map((phase) => phase.count), [4, 2, 2, 2, 2, 1]);
  assert.equal(result.funnel[5].conversion, 50);
  assert.equal(result.contacted, 2);
});

test("las fases de servicio cuentan como contratadas y solo los clientes activos suman MRR", () => {
  const result = commercialAnalytics([clinic({ phase: "CONTRACTED" }), clinic({ phase: "FIRST_PAYMENT" }), clinic({ phase: "ACTIVE" })], now);
  assert.equal(result.contracted, 3);
  assert.equal(result.funnel[5].count, 3);
  assert.equal(result.active, 0);
  assert.equal(result.mrr, 10000);
  assert.ok(isForwardMove("CONTRACTED", "ACTIVE"));
  assert.ok(!isForwardMove("ACTIVE", "DISCARDED"));
  assert.ok(passesThrough("CONTRACT_SIGNED", "ACTIVE", "FIRST_PAYMENT"));
  assert.ok(!passesThrough("FIRST_PAYMENT", "ACTIVE", "FIRST_PAYMENT"));
});

test("sin datos no se inventan porcentajes ni duración del ciclo", () => {
  const result = commercialAnalytics([], now);
  assert.ok(result.funnel.every((phase) => phase.conversion === null));
  assert.equal(result.cycleDays, null);
  assert.equal(financeAnalytics([]).margin, null);
});

test("las listas aíslan fases e ignoran claves desconocidas y pasos desmarcados", () => {
  assert.deepEqual(checklistProgress("UNCONTACTED", [
    { phase: "CONTACTED", stepKey: "research", completedAt: now },
    { phase: "UNCONTACTED", stepKey: "unknown", completedAt: now },
    { phase: "UNCONTACTED", stepKey: "research", completedAt: null },
  ]), { completed: 0, total: 3, ready: false });
  assert.equal(checklistProgress("UNCONTACTED", ["research", "decision-maker", "outreach"].map((stepKey) => ({ phase: "UNCONTACTED", stepKey, completedAt: now }))).ready, true);
  assert.equal(checklistProgress("DISCARDED", []).ready, false);
});

test("el periodo incluye exactamente 30 días naturales de Madrid", () => {
  const start = periodStart("30", now);
  assert.equal(start, "2026-08-16");
  assert.equal(inPeriod("2026-08-15T22:00:00.000Z", start, now), true);
  assert.equal(inPeriod("2026-08-15T21:59:59.000Z", start, now), false);
  assert.equal(inPeriod("2026-09-15T12:00:00.000Z", start, now), false);
});

test("los seguimientos de hoy no están vencidos; se usa la fecha de Madrid", () => {
  assert.equal(isFollowUpOverdue("2026-09-13T22:00:00.000Z", new Date(now)), false);
  assert.equal(isFollowUpOverdue("2026-09-13T21:59:59.000Z", new Date(now)), true);
  assert.equal(isFollowUpOverdue(null, new Date(now)), false);
});

test("el tiempo de fase usa el último evento y nunca es negativo", () => {
  assert.equal(phaseAgeDays("2026-08-01T20:00:00Z", [{ changedAt: "2026-09-10T20:00:00Z" }], new Date(now)), 4);
  assert.equal(phaseAgeDays("2026-10-01T20:00:00Z", [], new Date(now)), 0);
});

test("el ciclo excluye fechas ausentes, invertidas y altas directamente contratadas", () => {
  const event = { fromPhase: "PROPOSAL_SENT" as const, toPhase: "CONTRACTED" as const, changedAt: "2026-09-10T12:00:00Z" };
  const result = commercialAnalytics([
    clinic({ firstContactAt: "2026-09-01T12:00:00Z", stageEvents: [event] }),
    clinic({ stageEvents: [event] }),
    clinic({ firstContactAt: now, stageEvents: [event] }),
    clinic({ firstContactAt: "2026-09-01T12:00:00Z", stageEvents: [{ ...event, fromPhase: null }] }),
  ], now);
  assert.equal(result.cycleSample, 1);
  assert.equal(result.cycleDays, 9);
});

test("los primeros contratos mensuales no cuentan dos veces una reapertura", () => {
  const item = clinic({ stageEvents: [
    { fromPhase: "PROPOSAL_SENT", toPhase: "CONTRACTED", changedAt: "2026-08-02T12:00:00Z" },
    { fromPhase: "PROPOSAL_SENT", toPhase: "CONTRACTED", changedAt: "2026-09-02T12:00:00Z" },
  ] });
  assert.deepEqual(monthlyActivity([item], now).map((month) => month.contratos), [0, 0, 0, 0, 1, 0]);
});

test("finanzas rellena meses vacíos y conserva márgenes negativos", () => {
  const result = financeAnalytics([
    { type: "INCOME", amountCents: 10000, occurredAt: "2026-01-01T12:00:00Z" },
    { type: "EXPENSE", amountCents: 15000, occurredAt: "2026-05-01T12:00:00Z" },
  ]);
  assert.equal(result.balance, -5000);
  assert.equal(result.margin, -50);
  assert.deepEqual(result.monthly.map((month) => month.month), ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05"]);
  assert.equal(result.monthly[1].ingresos, 0);
});
