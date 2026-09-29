import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenario, transitionScenario, scenarioOutcome } from '../js/experience-model.js';

test('una primera visita se mantiene como solicitud al pasar a revisión humana', () => {
  let state = createScenario('after-hours');
  state = transitionScenario(state, 'respond');
  state = transitionScenario(state, 'choose', 'Jueves · 17:00');
  state = transitionScenario(state, 'review');
  assert.equal(state.phase, 3);
  assert.equal(scenarioOutcome(state).requestPending, true);
  assert.equal(scenarioOutcome(state).requestedSlot, 'Jueves · 17:00');
  assert.equal(scenarioOutcome(state).activeBooking, null);
  assert.equal(scenarioOutcome(state).humanHasConfirmed, false);
});

test('solicitar un cambio conserva la cita original hasta la confirmación explícita', () => {
  let state = createScenario('reschedule');
  state = transitionScenario(state, 'respond');
  state = transitionScenario(state, 'choose', 'Viernes · 10:30');
  assert.equal(scenarioOutcome(state).activeBooking, 'Jueves · 17:00');
  assert.equal(scenarioOutcome(state).requestedSlot, 'Viernes · 10:30');
  assert.equal(scenarioOutcome(state).requestPending, true);
  state = transitionScenario(state, 'confirm-change');
  assert.equal(scenarioOutcome(state).activeBooking, 'Viernes · 10:30');
  assert.equal(scenarioOutcome(state).requestPending, false);
  assert.equal(scenarioOutcome(state).humanHasConfirmed, true);
});

test('la derivación humana detiene la automatización y nunca crea una cita', () => {
  let state = createScenario('human');
  state = transitionScenario(state, 'respond');
  assert.equal(scenarioOutcome(state).automationPaused, true);
  assert.equal(scenarioOutcome(state).humanHandling, false);
  state = transitionScenario(state, 'show-context');
  state = transitionScenario(state, 'take-over');
  assert.equal(scenarioOutcome(state).humanHandling, true);
  assert.equal(scenarioOutcome(state).automationPaused, true);
  assert.equal(scenarioOutcome(state).activeBooking, null);
});

test('no se puede confirmar sin solicitud ni seleccionar un horario ajeno al caso', () => {
  let state = createScenario('reschedule');
  assert.deepEqual(transitionScenario(state, 'confirm-change'), state);
  assert.deepEqual(transitionScenario(state, 'choose', 'Viernes · 10:30'), state);
  state = transitionScenario(state, 'respond');
  assert.deepEqual(transitionScenario(state, 'choose', 'Lunes · 09:00'), state);
  assert.equal(transitionScenario(createScenario('human'), 'choose', 'Viernes · 10:30').selected, null);
});

test('reiniciar restaura el caso y elimina la selección anterior', () => {
  let state = createScenario('reschedule');
  state = transitionScenario(state, 'respond');
  state = transitionScenario(state, 'choose', 'Viernes · 12:00');
  state = transitionScenario(state, 'confirm-change');
  state = transitionScenario(state, 'reset');
  assert.deepEqual(state, createScenario('reschedule'));
  assert.equal(scenarioOutcome(state).activeBooking, 'Jueves · 17:00');
  assert.equal(scenarioOutcome(state).requestedSlot, null);
});
