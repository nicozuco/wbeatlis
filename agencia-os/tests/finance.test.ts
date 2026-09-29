import assert from "node:assert/strict";
import test from "node:test";

import { expenseSummaryForMonth, type ExpenseRecord } from "../lib/finance";

const expense = (overrides: Partial<ExpenseRecord> = {}): ExpenseRecord => ({
  type: "EXPENSE",
  amountCents: 1000,
  occurredAt: "2026-07-15T12:00:00.000Z",
  expenseFrequency: "ONE_TIME",
  expensePayer: "SHARED",
  ...overrides,
});

test("un gasto puntual solo cuenta en el mes en que se realizó", () => {
  const entries = [expense()];
  assert.equal(expenseSummaryForMonth(entries, "2026-07-20T12:00:00.000Z").total, 1000);
  assert.equal(expenseSummaryForMonth(entries, "2026-08-20T12:00:00.000Z").total, 0);
});

test("una suscripción cuenta cada mes desde su inicio", () => {
  const entries = [expense({ amountCents: 2500, expenseFrequency: "SUBSCRIPTION", expensePayer: "NICO" })];
  assert.equal(expenseSummaryForMonth(entries, "2026-06-20T12:00:00.000Z").total, 0);
  assert.equal(expenseSummaryForMonth(entries, "2026-07-20T12:00:00.000Z").subscriptions, 2500);
  assert.equal(expenseSummaryForMonth(entries, "2027-01-20T12:00:00.000Z").byPayer.NICO, 2500);
});

test("el resumen separa gastos puntuales, recurrentes y pagadores", () => {
  const summary = expenseSummaryForMonth([
    expense({ amountCents: 1200, expensePayer: "JOEL" }),
    expense({ amountCents: 3000, expenseFrequency: "SUBSCRIPTION", expensePayer: "SHARED", occurredAt: "2026-01-01T12:00:00.000Z" }),
    expense({ type: "INCOME", amountCents: 9999, expenseFrequency: null, expensePayer: null }),
  ], "2026-07-20T12:00:00.000Z");

  assert.deepEqual(summary, {
    total: 4200,
    oneTime: 1200,
    subscriptions: 3000,
    byPayer: { NICO: 0, JOEL: 1200, SHARED: 3000 },
  });
});
