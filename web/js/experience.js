import { createScenario, transitionScenario, scenarioSlots, scenarioOutcome } from './experience-model.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function tabs(selector, select) {
  const items = $$(selector);
  items.forEach((item, index) => {
    item.addEventListener('click', () => select(index));
    item.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % items.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = items.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      items[next].focus();
    });
  });
  return selected => items.forEach((item, index) => {
    item.setAttribute('aria-selected', String(index === selected));
    item.tabIndex = index === selected ? 0 : -1;
  });
}

// Each solution has its own example, with changes caused by a user action.
const solutions = [
  {
    label: '01 / ASISTENTE DE TEXTO CON IA',
    title: 'La clínica cierra.<br>La conversación puede empezar.',
    description: 'Un asistente recoge solicitudes y comparte la información administrativa que tu equipo ha aprobado.',
    points: ['Horarios, ubicación y preguntas habituales.', 'Solicitudes de cita con contexto.', 'Tu tono y las reglas de tu clínica.', 'Derivación a una persona cuando corresponde.'],
    note: 'La disponibilidad 24/7 corresponde al asistente configurado.',
    scene: 'assistant',
  },
  {
    label: '02 / SEGUIMIENTO DE CONSULTAS Y PACIENTES',
    title: 'Un mensaje pendiente.<br>Un siguiente paso definido.',
    description: 'Seguimientos para conversaciones y comunicaciones autorizadas, según su estado y las reglas de la clínica.',
    points: ['Consulta recibida, pendiente o atendida.', 'Mensajes según el momento de la conversación.', 'Avisos cuando necesita intervenir el equipo.', 'El seguimiento se detiene al responder, reservar o solicitar la baja.'],
    note: 'Prueba una respuesta y observa cómo se detiene el seguimiento.',
    scene: 'followup',
  },
  {
    label: '03 / AGENDA Y RECORDATORIOS',
    title: 'Recordar una cita<br>puede abrir una respuesta.',
    description: 'Un recordatorio sirve para confirmar, recoger una petición de cambio y dejar el estado claro para recepción.',
    points: ['Disponibilidad cuando la integración lo permita.', 'Recordatorios con la información acordada.', 'Confirmaciones que el equipo puede revisar.', 'Cambios gestionados según vuestras reglas.'],
    note: 'Una petición de cambio mantiene la cita original hasta que el equipo la valide.',
    scene: 'reminder',
  },
  {
    label: '04 / PREPARACIÓN Y SEGUIMIENTO DE PRESUPUESTOS',
    title: 'El borrador se prepara.<br>El profesional decide.',
    description: 'Información y tarifas aprobadas, una plantilla ordenada y un paso de revisión antes de compartir el documento.',
    points: ['Plantillas adaptadas a la clínica.', 'Conceptos y tarifas previamente validados.', 'Revisión por el profesional antes del envío.', 'Estado y siguiente paso del documento.'],
    note: 'La IA no diagnostica ni decide tratamientos a partir de síntomas.',
    scene: 'budget',
  },
];
const solutionStates = [null, null, null, null];
let currentSolution = 0;
const action = (key, label, secondary = false) => `<button type="button" class="scene-action${secondary ? ' secondary' : ''}" data-solution-action="${key}">${label}${icon('arrow')}</button>`;
const sceneTop = title => `<div class="scene-topline"><span>${title}</span><span>Ejemplo interactivo</span></div>`;

function assistantScene(state) {
  const responses = {
    appointment: ['Me gustaría pedir una cita.', '¡Genial! Tomo nota de tu primera visita y el equipo te confirma el hueco. ¿Te viene mejor por la mañana o por la tarde?'],
    hours: ['¿Puedo consultar vuestro horario?', 'Claro. Abrimos de lunes a viernes de 9:00 a 20:00. Si necesitas algo más, te paso con recepción.'],
  };
  return `${sceneTop('EL ASISTENTE EN TU WEB')}<div class="assistant-widget"><div class="widget-header">${icon('spark')}<div><strong>Tu clínica dental</strong><span>Responde al momento</span></div><span class="widget-caption">WEB</span></div><div class="widget-conversation"><span class="widget-speaker">TU CLÍNICA</span><p class="widget-bubble">¡Hola! ¿En qué te puedo ayudar? Te cuento nuestros horarios o te ayudo a pedir cita.</p>${state ? `<p class="widget-patient">${responses[state][0]}</p><p class="widget-bubble response-appears">${responses[state][1]}</p>` : '<span class="widget-prompt">¿Qué te gustaría consultar?</span>'}</div>${!state ? `<div class="widget-quick-replies">${action('appointment', 'Pedir una cita')}${action('hours', 'Consultar horarios', true)}</div>` : `<div class="widget-result">${icon('check')}Una conversación con contexto para tu equipo.</div>`}</div>`;
}

function followupScene(state) {
  const ended = Boolean(state);
  return `${sceneTop('UNA CONVERSACIÓN CON CONTINUIDAD')}<div class="followup-sheet"><div class="followup-heading">${icon('flow')}<strong>Seguimiento de una consulta</strong><span class="scene-state ${ended ? 'state-done' : ''}">${ended ? 'Detenido' : 'Pendiente'}</span></div><ol class="followup-history"><li class="complete"><span></span><div><strong>Consulta recibida</strong><p>Interés en una primera visita.</p></div></li><li class="complete"><span></span><div><strong>Información compartida</strong><p>La conversación queda a la espera.</p></div></li><li class="${ended ? 'complete' : 'history-pending'}"><span></span><div><strong>${ended ? (state === 'reply' ? 'El paciente ha respondido' : 'El paciente solicita la baja') : 'Siguiente mensaje preparado'}</strong><p>${ended ? 'No se envían más mensajes de este seguimiento.' : 'Se revisan las condiciones antes de enviar.'}</p></div></li></ol><div class="followup-message">${icon('chat')}<p>${ended ? (state === 'reply' ? '«Gracias, me gustaría pedir cita.»' : '«Prefiero no recibir más mensajes.»') : '«Hola. ¿Te gustaría que revisásemos tu solicitud de primera visita?»'}</p></div>${ended ? `<div class="scene-result response-appears">${icon('check')}<span><strong>Seguimiento automático detenido.</strong>${state === 'reply' ? 'La conversación vuelve al paso que corresponde.' : 'Se respeta la solicitud de baja.'}</span></div>` : `<div class="scene-action-row">${action('reply', 'Simular respuesta')}${action('stop', 'Simular baja', true)}</div>`}</div>`;
}

function reminderScene(state) {
  return `${sceneTop('UN RECORDATORIO AL QUE SE PUEDE RESPONDER')}<div class="reminder-scene"><div class="reminder-date"><span>JUEVES</span><strong>17</strong><span>17:00 · EJEMPLO</span></div><div class="reminder-whatsapp"><div class="reminder-sender"><img src="./assets/brands/whatsapp.svg" width="19" height="19" alt="WhatsApp"><span>Tu clínica dental</span></div><p>Hola. Te recordamos tu cita de ejemplo el jueves a las <strong>17:00</strong>. ¿Puedes confirmarla?<time class="chat-time">22:30</time></p>${!state ? `<div class="reminder-replies">${action('confirm', 'Confirmar asistencia')}${action('change', 'Solicitar cambio', true)}</div>` : `<div class="reminder-response response-appears">${icon(state === 'confirm' ? 'check' : 'calendar')}<span>${state === 'confirm' ? 'Sí, confirmo mi asistencia.' : 'Necesito cambiar la cita.'}</span><time class="chat-time">22:34${ticks(false)}</time></div>`}</div><div class="reminder-team" role="status">${icon(state === 'confirm' ? 'check' : 'calendar')}<div><span>LO QUE VE RECEPCIÓN</span><strong>${!state ? 'Pendiente de respuesta' : state === 'confirm' ? 'Asistencia confirmada en el ejemplo' : 'Cambio pendiente de revisión'}</strong><p>${state === 'change' ? 'La cita del jueves a las 17:00 se conserva hasta validar el cambio.' : state === 'confirm' ? 'La respuesta queda asociada a la cita de ejemplo.' : 'El estado se actualiza según la respuesta del paciente.'}</p></div></div></div>`;
}

function budgetScene(state) {
  const approved = state === 'approved';
  return `${sceneTop('DEL BORRADOR A LA REVISIÓN')}<div class="budget-scene"><div class="budget-paper"><div class="budget-letterhead"><span>CLÍNICA DENTAL<br><strong>Documento de ejemplo</strong></span>${icon('file')}</div><span class="budget-type">PROPUESTA ADMINISTRATIVA</span><h4>Presupuesto</h4><div class="budget-fields"><div><span>Conceptos</span><strong>Aprobados por el profesional</strong></div><div><span>Tarifas</span><strong>Validadas por la clínica</strong></div><div><span>Paciente</span><strong>Sin datos personales</strong></div></div><div class="budget-review"><span>REVISIÓN PROFESIONAL</span>${!state ? `<p>Comprobar los conceptos, las tarifas y las condiciones antes del envío.</p>` : `<ul><li>${icon('check')}Conceptos revisados en el ejemplo</li><li>${icon('check')}Tarifas y condiciones verificadas</li></ul>`}<div class="budget-stamp ${approved ? 'approved' : ''}">${icon(approved ? 'check' : 'user')}${approved ? 'Ejemplo validado' : state ? 'En revisión' : 'Pendiente de revisión'}</div></div></div><div class="budget-action">${approved ? `<span class="scene-result response-appears">${icon('check')}Listo para el siguiente paso. No se ha enviado ningún documento.</span>` : action(state ? 'approve' : 'review', state ? 'Validar este ejemplo' : 'Revisar el borrador de ejemplo')}</div></div>`;
}
const solutionScenes = [assistantScene, followupScene, reminderScene, budgetScene];
function renderSolution(index, focus = false) {
  currentSolution = index;
  selectSolution(index);
  const data = solutions[index];
  const panel = $('#solution-panel');
  panel.setAttribute('aria-labelledby', `solution-tab-${index}`);
  panel.innerHTML = `<div class="solution-story"><span class="editorial-index">${data.label}</span><h3>${data.title}</h3><p>${data.description}</p><ul class="check-list">${data.points.map(point => `<li>${point}</li>`).join('')}</ul><p class="solution-note">${data.note}</p></div><div class="solution-scene scene-${data.scene}">${solutionScenes[index](solutionStates[index])}<div class="scene-footer"><span>Simulación sin envíos ni reservas.</span><button type="button" data-solution-action="reset">${icon('reset')}Reiniciar ejemplo</button></div></div>`;
  if (focus) panel.focus({ preventScroll: true });
}
const selectSolution = tabs('[data-solution]', index => renderSolution(index));
$('#solution-panel').addEventListener('click', event => {
  const button = event.target.closest('[data-solution-action]');
  if (!button) return;
  const key = button.dataset.solutionAction;
  if (key === 'reset') solutionStates[currentSolution] = null;
  else if (currentSolution === 0 && ['appointment', 'hours'].includes(key)) solutionStates[0] = key;
  else if (currentSolution === 1 && ['reply', 'stop'].includes(key)) solutionStates[1] = key;
  else if (currentSolution === 2 && ['confirm', 'change'].includes(key)) solutionStates[2] = key;
  else if (currentSolution === 3 && key === 'review') solutionStates[3] = 'review';
  else if (currentSolution === 3 && key === 'approve' && solutionStates[3] === 'review') solutionStates[3] = 'approved';
  else return;
  renderSolution(currentSolution, true);
});
renderSolution(0);

// Scenario demonstration: messages and the clinical team's state move together.
const scenarioOrder = ['after-hours', 'reschedule', 'human'];
const cases = {
  'after-hours': {
    title: 'La clínica ha cerrado.<br>Llega un mensaje.',
    patient: 'Hola, me gustaría pedir una primera visita.',
    assistant: '¡Hola! Claro, te ayudo con la cita. Tengo estos huecos, ¿cuál te viene mejor?',
  },
  reschedule: {
    title: 'El paciente necesita<br>cambiar su cita.',
    patient: 'Tengo una cita el jueves a las 17:00, pero no puedo ir. ¿Podría cambiarla al viernes?',
    assistant: 'Sin problema. Tu cita del jueves se mantiene hasta que recepción confirme el cambio. ¿Cuál de estos huecos te va bien?',
  },
  human: {
    title: 'Una persona quiere<br>hablar con otra persona.',
    patient: 'Hola, prefiero hablar directamente con recepción.',
    assistant: '¡Claro! Ahora mismo la clínica está cerrada, pero ya he dejado aviso a recepción. Mañana, en cuanto abramos, te escriben por aquí.',
  },
};
let state = createScenario();
const caseButton = (key, label, value = '') => `<button type="button" class="case-action" data-case-action="${key}"${value ? ` data-case-value="${value}"` : ''}>${label}${icon('arrow')}</button>`;
function nextActions(current) {
  if (current.phase === 0) return `<span class="case-action-hint">EMPIEZA POR AQUÍ</span>${caseButton('respond', 'Ver respuesta del asistente')}`;
  if (current.phase === 1 && current.id !== 'human') return `<span class="case-action-hint">ELIGE UN HORARIO FICTICIO</span><div class="case-slot-options">${scenarioSlots[current.id].map(slot => caseButton('choose', slot, slot)).join('')}</div>`;
  if (current.phase === 1) return caseButton('show-context', 'Ver contexto para recepción');
  if (current.phase === 2 && current.id === 'after-hours') return caseButton('review', 'Ver qué recibe el equipo');
  if (current.phase === 2 && current.id === 'reschedule') return caseButton('confirm-change', 'Simular confirmación del equipo');
  if (current.phase === 2) return caseButton('take-over', 'Simular el relevo a recepción');
  return `<a class="case-action case-contact" href="./demo.html">Valorar este flujo en mi clínica${icon('diagonal')}</a>`;
}
// WhatsApp-style send times: the automated replies happen late at night; reception answers the next morning.
const caseTimes = { 'after-hours': ['23:26', '23:26', '23:27', '23:27'], reschedule: ['22:48', '22:48', '22:49', '22:49'], human: ['23:05', '23:05'] };
// Patient messages show WhatsApp ticks: grey while unanswered (delivered), blue once the clinic has replied (read).
const ticks = read => `<svg class="icon chat-ticks${read ? ' is-read' : ''}" aria-hidden="true"><use href="#i-ticks"/></svg><span class="sr-only">${read ? 'Leído' : 'Entregado'}</span>`;
const chatTime = (time, status) => `<time class="chat-time">${time}${status ? ticks(status === 'read') : ''}</time>`;
function conversation(current) {
  const data = cases[current.id];
  const times = caseTimes[current.id];
  let messages = `<div class="case-message patient"><span>PACIENTE · EJEMPLO</span><p>${data.patient}</p>${chatTime(times[0], current.phase >= 1 ? 'read' : 'delivered')}</div>`;
  if (current.phase >= 1) messages += `<div class="case-message assistant"><span>TU CLÍNICA</span><p>${data.assistant}</p>${chatTime(times[1])}</div>`;
  if (current.selected) messages += `<div class="case-message patient compact"><p>${current.selected} me viene bien.</p>${chatTime(times[2], current.phase >= 2 ? 'read' : 'delivered')}</div>`;
  if (current.phase >= 2 && current.id !== 'human') messages += `<div class="case-message assistant compact"><p>¡Apuntado! Recepción revisa la agenda y te confirma ${current.id === 'reschedule' ? 'el cambio' : 'la cita'} por aquí.</p>${chatTime(times[3])}</div>`;
  if (current.phase === 3 && current.id === 'reschedule') messages += `<div class="case-team-response">${icon('user')}El equipo ha validado el cambio en este ejemplo.</div>`;
  if (current.phase === 3 && current.id === 'human') messages += `<div class="case-message team"><span>RECEPCIÓN · EJEMPLO</span><p>Hola, soy Laura, de recepción. Ya he leído tu conversación, ¿en qué te ayudo?</p>${chatTime('09:02')}</div>`;
  return `<div class="scenario-chat"><div class="case-view-label"><img src="./assets/brands/whatsapp.svg" width="17" height="17" alt="WhatsApp"><span>LO QUE VE EL PACIENTE</span></div><h3>${data.title}</h3><div class="case-thread">${messages}</div><div class="case-actions">${nextActions(current)}</div></div>`;
}
function caseStatus(current) {
  if (current.phase === 0) return { heading: 'Una consulta entra en el proceso.', body: 'El mensaje todavía no tiene un siguiente paso.', label: 'Consulta recibida', icon: 'chat' };
  if (current.id === 'human') return { heading: current.phase === 3 ? 'El equipo toma el relevo.' : 'Aquí entra una persona.', body: 'La conversación se deriva con su contexto y el seguimiento automático se detiene.', label: current.phase === 3 ? 'Atendiendo por recepción' : 'Pendiente del equipo', icon: 'user' };
  if (current.phase === 1) return { heading: 'La respuesta sigue vuestras reglas.', body: 'Disponibilidad e información de ejemplo, sujetas a la configuración acordada.', label: 'Esperando elección', icon: 'sliders' };
  if (current.id === 'reschedule' && current.phase === 3) return { heading: 'El cambio lo confirma el equipo.', body: 'Solo tras esa validación se sustituye el horario original en este ejemplo.', label: 'Cambio validado en la demo', icon: 'check' };
  return { heading: current.phase === 3 ? 'Todo listo para revisar.' : 'El horario espera confirmación.', body: 'El horario elegido y el contexto quedan juntos para que recepción pueda decidir.', label: 'Pendiente de confirmación', icon: 'clock' };
}
function teamContext(current) {
  const outcome = scenarioOutcome(current);
  const status = caseStatus(current);
  let detail;
  if (current.id === 'reschedule') {
    detail = `<div class="case-agenda"><div class="case-document-label"><img src="./assets/brands/google-calendar.png" width="24" height="24" alt="">AGENDA DE EJEMPLO</div><div class="case-booking ${outcome.humanHasConfirmed ? 'old-booking' : ''}"><span>${outcome.humanHasConfirmed ? 'HORARIO ANTERIOR' : 'CITA ACTUAL · SE CONSERVA'}</span><strong>Jueves · 17:00</strong><p>Primera visita de ejemplo</p></div>${current.selected ? `<div class="case-booking proposed-booking ${outcome.humanHasConfirmed ? 'validated-booking' : ''}"><span>${outcome.humanHasConfirmed ? 'VALIDADO POR EL EQUIPO · EJEMPLO' : 'SOLICITUD DE CAMBIO'}</span><strong>${current.selected}</strong><p>${outcome.humanHasConfirmed ? 'La cita original se sustituye tras validar.' : 'Pendiente de confirmar. Aún no sustituye la cita actual.'}</p></div>` : '<p class="case-empty-note">Aún no se ha seleccionado una alternativa.</p>'}</div>`;
  } else if (current.id === 'human') {
    detail = `<div class="case-handover"><div class="case-document-label">${icon('user')}PARA RECEPCIÓN</div><dl><div><dt>Motivo</dt><dd>Prefiere atención personal.</dd></div><div><dt>Seguimiento automático</dt><dd class="${outcome.automationPaused ? 'context-emphasis' : ''}">${outcome.automationPaused ? 'Detenido en este ejemplo' : 'A la espera de procesar la consulta'}</dd></div><div><dt>Responsable del siguiente paso</dt><dd>${outcome.humanHandling ? 'Recepción ha tomado el relevo.' : current.phase ? 'Tu equipo.' : 'Por definir.'}</dd></div></dl>${current.phase >= 2 ? '<div class="case-context-note"><strong>Contexto que recibe el equipo</strong><p>El paciente ha pedido hablar con recepción. No se ha propuesto ningún tratamiento ni creado ninguna cita.</p></div>' : ''}</div>`;
  } else {
    detail = `<div class="case-request"><div class="case-document-label">${icon('file')}SOLICITUD DE EJEMPLO</div><dl><div><dt>Motivo</dt><dd>Primera visita</dd></div><div><dt>Horario solicitado</dt><dd>${current.selected || 'Aún sin seleccionar'}</dd></div><div><dt>Estado de la cita</dt><dd>${current.selected ? 'Pendiente de confirmación' : 'No hay una cita registrada'}</dd></div></dl>${current.phase === 3 ? `<div class="case-context-note">${icon('check')}<p>Recepción tiene la solicitud y el contexto. El recordatorio solo se prepararía para envío después de confirmar la cita.</p></div>` : ''}</div>`;
  }
  return `<div class="scenario-outcome"><div class="case-view-label">${icon('flow')}<span>LO QUE OCURRE EN LA CLÍNICA</span></div><div class="case-status-heading"><span class="case-state-icon">${icon(status.icon)}</span><h3>${status.heading}</h3></div><p class="case-explanation">${status.body}</p>${detail}<div class="case-current-state">${icon(status.icon)}<span>${status.label}</span></div></div>`;
}
function renderScenario(focus = false, announce = true) {
  const index = scenarioOrder.indexOf(state.id);
  selectScenario(index);
  $('#scenario-panel').setAttribute('aria-labelledby', `scenario-${state.id}`);
  $('#scenario-content').innerHTML = conversation(state) + teamContext(state);
  const labels = ['Consulta', 'Respuesta', 'Siguiente paso', 'Equipo'];
  $('#scenario-route').innerHTML = labels.map((label, i) => `<span class="${i < state.phase ? 'complete' : i === state.phase ? 'current' : ''}"${i === state.phase ? ' aria-current="step"' : ''}>${i < state.phase ? icon('check') : `<b>0${i + 1}</b>`}${label}</span>${i < 3 ? `<i class="${i < state.phase ? 'complete' : ''}"></i>` : ''}`).join('');
  if (announce) $('#scenario-announcement').textContent = `Paso ${state.phase + 1} de 4. ${caseStatus(state).heading} ${caseStatus(state).body}`;
  if (focus) $('#scenario-panel').focus({ preventScroll: true });
}
// In the reception case, Laura's reply arrives on its own two seconds after the clinic's answer.
let receptionTimer;
function cancelReceptionReply() { clearTimeout(receptionTimer); }
const selectScenario = tabs('[data-scenario]', index => {
  cancelReceptionReply();
  state = createScenario(scenarioOrder[index]);
  renderScenario();
});
// Marks what an action added or changed, so the update is noticed on both sides.
// Marks stay until the next step; motion is only a first cue.
const trackedParts = ['.case-thread > *', '.case-status-heading', '.case-explanation', '.case-request dl > div', '.case-handover dl > div', '.case-booking', '.case-context-note', '.case-empty-note', '.case-current-state'];
function snapshotScenario() {
  const root = $('#scenario-content');
  return new Map(trackedParts.flatMap(selector => [...root.querySelectorAll(selector)].map((node, i) => [`${selector}|${i}`, node.textContent])));
}
function markScenarioChanges(previous, previousPhase) {
  const root = $('#scenario-content');
  let clinicChanged = false;
  let arrivals = 0;
  for (const selector of trackedParts) {
    root.querySelectorAll(selector).forEach((node, i) => {
      const before = previous.get(`${selector}|${i}`);
      if (before === node.textContent) return;
      node.classList.add(before === undefined ? 'is-new' : 'is-updated');
      if (node.closest('.case-thread')) node.style.setProperty('--arrive-delay', `${arrivals++ * 0.35}s`);
      else clinicChanged = true;
    });
  }
  if (clinicChanged) {
    $('.scenario-outcome .case-view-label', root).insertAdjacentHTML('beforeend', '<span class="case-update-badge" aria-hidden="true">Actualizado</span>');
    $('.case-actions', root).insertAdjacentHTML('beforeend', `<button type="button" class="case-outcome-link" data-case-scroll>Mira qué ha cambiado en la clínica${icon('arrow')}</button>`);
  }
  if (state.phase !== previousPhase) $('#scenario-route .current')?.classList.add('is-updated');
}
$('#scenario-content').addEventListener('click', event => {
  if (event.target.closest('[data-case-scroll]')) {
    $('.scenario-outcome').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  const button = event.target.closest('[data-case-action]');
  if (!button) return;
  const previous = snapshotScenario();
  const previousPhase = state.phase;
  state = transitionScenario(state, button.dataset.caseAction, button.dataset.caseValue);
  renderScenario(true);
  markScenarioChanges(previous, previousPhase);
  if (state.id === 'human' && state.phase === 1) {
    cancelReceptionReply();
    receptionTimer = setTimeout(() => {
      if (state.id !== 'human' || state.phase === 3) return;
      const before = snapshotScenario();
      const beforePhase = state.phase;
      state = transitionScenario(transitionScenario(state, 'show-context'), 'take-over');
      renderScenario();
      markScenarioChanges(before, beforePhase);
    }, 2000);
  }
});
$('.scenario-reset').addEventListener('click', () => {
  cancelReceptionReply();
  state = transitionScenario(state, 'reset');
  renderScenario();
});
renderScenario(false, false);
