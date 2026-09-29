import assert from "node:assert/strict";
import test from "node:test";

import { addDays, addMonths, dayKey, isDayKey, monthGridKeys, startOfWeekKey, weekKeys } from "../lib/agenda";

test("agenda: el día se calcula en hora de Madrid, también con cambio de horario", () => {
  // 23:30 UTC del 14 de septiembre ya es día 15 en Madrid (UTC+2).
  assert.equal(dayKey("2026-09-14T23:30:00Z"), "2026-09-15");
  // Una fecha guardada a las 12:00 del servidor sigue en su día.
  assert.equal(dayKey("2026-10-25T12:00:00Z"), "2026-10-25");
  // Cruzar el cambio de hora de octubre no salta ni repite días.
  assert.equal(addDays("2026-10-24", 1), "2026-10-25");
  assert.equal(addDays("2026-10-25", 1), "2026-10-26");
});

test("agenda: semanas de lunes a domingo y rejilla de mes de 6 semanas", () => {
  assert.equal(startOfWeekKey("2026-09-15"), "2026-09-14");
  assert.equal(startOfWeekKey("2026-09-20"), "2026-09-14");
  assert.deepEqual(weekKeys("2026-09-15").at(-1), "2026-09-20");
  const grid = monthGridKeys("2026-09-15");
  assert.equal(grid.length, 42);
  assert.equal(grid[0], "2026-08-31");
  assert.equal(addMonths("2026-01-31", 1), "2026-02-01");
  assert.ok(isDayKey("2026-02-28"));
  assert.ok(!isDayKey("mañana"));
});
