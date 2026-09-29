import assert from "node:assert/strict";
import test from "node:test";

import { goalProgress } from "../lib/goals";
import { goalStepFields, hasGoalStepField } from "../lib/goal-step-fields";

test("objetivos: calcula completados, pendientes y porcentaje", () => {
  assert.deepEqual(goalProgress([{ completedAt: new Date() }, { completedAt: null }, { completedAt: "2026-09-21T12:00:00.000Z" }, { completedAt: null }]), {
    completed: 2,
    total: 4,
    remaining: 2,
    percentage: 50,
  });
});

test("objetivos: un objetivo sin pasos empieza al cero por ciento", () => {
  assert.deepEqual(goalProgress([]), { completed: 0, total: 0, remaining: 0, percentage: 0 });
});

test("objetivos: solo las decisiones seleccionadas muestran un campo de respuesta", () => {
  assert.equal(hasGoalStepField("launch-step-01-04"), true);
  assert.equal(goalStepFields["launch-step-01-04"].label, "Micronicho elegido");
  assert.equal(hasGoalStepField("launch-step-01-10"), true);
  assert.equal(goalStepFields["launch-step-01-10"].multiline, true);
  assert.equal(hasGoalStepField("launch-step-01-13"), true);
  assert.equal(goalStepFields["launch-step-01-13"].label, "Análisis de anuncios activos");
  assert.equal(hasGoalStepField("launch-step-00-01"), false);
  assert.equal(hasGoalStepField("toString"), false);
});
