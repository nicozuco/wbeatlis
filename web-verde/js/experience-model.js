export const scenarioIds = Object.freeze(['after-hours', 'reschedule', 'human']);
export const scenarioSlots = Object.freeze({
  'after-hours': Object.freeze(['Jueves · 17:00', 'Viernes · 10:30']),
  reschedule: Object.freeze(['Viernes · 10:30', 'Viernes · 12:00']),
  human: Object.freeze([]),
});

export function createScenario(id = 'after-hours') {
  return { id: scenarioIds.includes(id) ? id : 'after-hours', phase: 0, selected: null };
}

// Explicit transitions keep a request separate from a booking confirmed by a person.
export function transitionScenario(state, action, value) {
  if (action === 'reset') return createScenario(state.id);
  if (action === 'respond' && state.phase === 0) return { ...state, phase: 1 };
  if (action === 'choose' && state.phase === 1 && scenarioSlots[state.id]?.includes(value)) {
    return { ...state, phase: 2, selected: value };
  }
  if (action === 'review' && state.id === 'after-hours' && state.phase === 2) return { ...state, phase: 3 };
  if (action === 'confirm-change' && state.id === 'reschedule' && state.phase === 2 && state.selected) return { ...state, phase: 3 };
  if (action === 'show-context' && state.id === 'human' && state.phase === 1) return { ...state, phase: 2 };
  if (action === 'take-over' && state.id === 'human' && state.phase === 2) return { ...state, phase: 3 };
  return state;
}

export function scenarioOutcome(state) {
  const originalBooking = state.id === 'reschedule' ? 'Jueves · 17:00' : null;
  const humanHasConfirmed = state.id === 'reschedule' && state.phase === 3;
  return {
    originalBooking,
    activeBooking: humanHasConfirmed ? state.selected : originalBooking,
    requestedSlot: state.selected,
    requestPending: Boolean(state.selected) && !humanHasConfirmed,
    automationPaused: state.id === 'human' && state.phase > 0,
    humanHandling: state.id === 'human' && state.phase === 3,
    humanHasConfirmed,
  };
}
