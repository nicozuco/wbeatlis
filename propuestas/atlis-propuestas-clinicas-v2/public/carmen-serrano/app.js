const proposals = window.ATLIS_PROPOSALS || {};
const clinic = proposals[document.body.dataset.clinic];
if (!clinic) throw new Error("No se encontraron los datos de esta clínica.");
document.body.classList.add(`theme-palette-${clinic.palette}`);

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

function landing({ withChat = false } = {}) {
  if (window.renderBespoke) return window.renderBespoke(clinic, { withChat });
  const initial = [...clinic.shortName][0]?.toUpperCase() || "D";
  return `<div class="browser-window" aria-label="Concepto de página para ${esc(clinic.shortName)}">
    <div class="browser-chrome"><span class="browser-dots"><i></i><i></i><i></i></span><span class="address">${esc(clinic.domain)}</span><span class="browser-lock">◌</span></div>
    <div class="clinic-site">
      <div class="clinic-nav"><div class="clinic-brand">${esc(clinic.brand)}<small>CLÍNICA DENTAL · VALENCIA</small></div><span class="clinic-nav-links">La clínica&nbsp;&nbsp;&nbsp; Tratamientos&nbsp;&nbsp;&nbsp; Equipo</span><button class="clinic-nav-cta" data-show="${clinic.hasBooking ? "web" : "whatsapp"}">${clinic.hasBooking ? "Cómo reservar" : "Solicitar cita"} <span>↗</span></button></div>
      <div class="clinic-hero"><div class="clinic-copy"><span class="clinic-eyebrow">${esc(clinic.eyebrow)}</span><h2>${esc(clinic.headline)}</h2><p>${esc(clinic.subtitle)}</p><div class="clinic-hero-actions"><button class="clinic-main-cta" data-show="${clinic.hasBooking ? "web" : "whatsapp"}">${clinic.hasBooking ? "Ver cómo reservar" : "Solicitar una visita"} <span>↗</span></button><span class="clinic-hero-note">${clinic.hasBooking ? "Se conserva el sistema de citas actual" : "Reserva directa en vuestra agenda"}</span></div></div><div class="clinic-art" aria-hidden="true"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-center"><span class="art-symbol">${esc(initial)}</span><span class="art-caption">${esc(clinic.shortName.toUpperCase().slice(0, 22))}</span></div><div class="art-card art-card-a">01<span>Escuchamos</span></div><div class="art-card art-card-b">02<span>Organizamos</span></div></div></div>
      <div class="clinic-proof">${clinic.features.map((feature, i) => `<div><span>0${i + 1}</span>${esc(feature)}</div>`).join("")}</div>
      <div class="clinic-bottom"><div><span class="clinic-eyebrow">PRIMER CONTACTO</span><h3>${esc(clinic.sectionTitle)}</h3><p>${esc(clinic.sectionCopy)}</p></div><button data-show="web">Resolver una duda <span>↗</span></button></div>
      ${withChat ? `<div class="web-chat" aria-label="Ejemplo de asistente web"><div class="web-chat-head"><span class="web-chat-avatar">${esc(initial)}</span><span><strong>Asistente de ${esc(clinic.shortName)}</strong><small>Atención administrativa · demo</small></span><span class="web-chat-close">×</span></div><div class="web-chat-body"><div class="chat-bubble question">${esc(clinic.webQuestion)}</div><div class="chat-bubble answer">${esc(clinic.webReply)}</div><div class="chat-chips">${clinic.webChips.map(chip => `<span>${esc(chip)}</span>`).join("")}</div></div><div class="web-chat-composer">Escribe tu pregunta <span>↗</span></div></div>` : `<button class="web-chat-fab" data-show="web" aria-label="Ver asistente web">✳</button>`}
      <div class="concept-watermark">CONCEPTO VISUAL · NO ES LA WEB ACTUAL</div>
    </div>
  </div>`;
}

const receiptIcon = state => `<svg viewBox="0 0 24 18" aria-hidden="true"><path d="m2 9 4 4L17 2"/>${state==='sent'?'':'<path d="m11 11 2 2L24 2"/>'}</svg>`;
const receipt = state => `<span class="wa-receipt ${state}" role="img" aria-label="${{sent:'Enviado',delivered:'Recibido',read:'Leído'}[state]}">${receiptIcon(state)}</span>`;
let waTimers=[];
let waScenario="book";
function stopWhatsAppDemo(){waTimers.forEach(clearTimeout);waTimers=[];}
function playWhatsAppDemo(){
  stopWhatsAppDemo();
  const stage=document.querySelector('.wa-layout');if(!stage)return;
  const demo=window.getReceptionScenarios(clinic)[waScenario];
  const messages=[...stage.querySelectorAll('[data-message]')];
  messages.forEach((m,i)=>m.hidden=i!==0);
  const mark=(index,state)=>{const old=messages[index].querySelector('.wa-receipt');if(old)old.outerHTML=receipt(state);};
  mark(0,'sent');mark(2,'sent');
  const status=stage.querySelector('.automation-status'),card=stage.querySelector('.handoff-card');
  card.classList.add('is-preparing');stage.querySelector('.pending-chip').textContent='Preparando';
  stage.querySelector('[data-summary-preference]').textContent='Pendiente de confirmar';
  stage.querySelector('[data-summary-change]').textContent='Sin cambios todavía';
  stage.querySelectorAll('.automation-steps li').forEach(e=>e.classList.remove('done'));
  status.textContent='El paciente envía su consulta.';
  const after=(ms,fn)=>waTimers.push(setTimeout(()=>{if(stage.isConnected)fn();},ms));
  const show=i=>{messages[i].hidden=false;const list=stage.querySelector('.wa-messages');list.scrollTop=list.scrollHeight;};
  after(1000,()=>{mark(0,'delivered');status.textContent='Mensaje recibido por el asistente.';});
  after(2300,()=>{mark(0,'read');status.textContent='El asistente lee la consulta y prepara la respuesta.';});
  after(3500,()=>{show(1);stage.querySelector('[data-step="1"]').classList.add('done');status.textContent=demo.progress;});
  after(4900,()=>{show(2);status.textContent='El paciente confirma la operación.';});
  after(6000,()=>mark(2,'delivered'));
  after(7200,()=>{mark(2,'read');stage.querySelector('[data-step="2"]').classList.add('done');stage.querySelector('[data-summary-preference]').textContent=demo.when;status.textContent='Confirmación recibida. Actualizando la agenda de ejemplo.';});
  after(8600,()=>{show(3);stage.querySelector('[data-step="3"]').classList.add('done');card.classList.remove('is-preparing');stage.querySelector('.pending-chip').textContent=demo.result;stage.querySelector('[data-summary-change]').textContent=demo.change;status.textContent=demo.operation;});
}
function whatsapp() {
 const initial=[...clinic.shortName][0]?.toUpperCase()||'D';
 const scenarios=window.getReceptionScenarios(clinic),demo=scenarios[waScenario];
 return `<div class="wa-layout"><div class="wa-demo-column"><div class="wa-scenarios" role="group" aria-label="Gestión de citas">${Object.entries(scenarios).map(([key,item])=>`<button data-wa-scenario="${key}" aria-pressed="${key===waScenario}">${item.label} cita</button>`).join('')}</div><p class="wa-guided-note">Recorrido guiado de ejemplo. En la demo funcional podréis probar preguntas abiertas.</p><div class="phone-frame"><div class="phone-notch"></div><div class="phone-screen"><div class="wa-top"><span class="wa-back">‹</span><span class="wa-avatar">${esc(initial)}</span><span class="wa-contact"><strong>${esc(clinic.shortName)}</strong><small>Agente de recepción · demo</small></span><span class="wa-dots">⋮</span></div><div class="wa-messages"><div class="wa-day">AGENDA DE EJEMPLO</div><div class="wa-bubble sent" data-message="0">${esc(demo.patient)}<span class="wa-message-meta"><time>${esc(clinic.time)}</time>${receipt('sent')}</span></div><div class="wa-bubble received" data-message="1" hidden>${esc(demo.reply)}<span class="wa-message-meta"><time>${esc(clinic.time)}</time></span></div><div class="wa-bubble sent" data-message="2" hidden>${esc(demo.answer)}<span class="wa-message-meta"><time>${esc(clinic.time)}</time>${receipt('sent')}</span></div><div class="wa-bubble received" data-message="3" hidden>${esc(demo.confirmation)}<span class="wa-message-meta"><time>${esc(clinic.time)}</time></span></div></div><div class="wa-compose"><span>＋</span><span>Escribe un mensaje…</span><span>➤</span></div></div></div><button class="wa-replay" data-replay-whatsapp>↻ Volver a ver la automatización</button></div>
 <div class="handoff-panel"><span class="section-kicker">MENOS INTERRUPCIONES. CITAS RESUELTAS.</span><h2>Agenda, cambia y cancela.<br>Como tu recepción.</h2><p>Un agente que conversa con el paciente y gestiona su cita. Conectado a tu agenda y siguiendo las reglas de la clínica, resuelve las gestiones habituales y deriva al equipo lo que necesita atención personal.</p><ol class="automation-steps">${demo.steps.map(([title,copy],i)=>`<li data-step="${i+1}"><span>0${i+1}</span><div><strong>${title}</strong><small>${copy}</small></div></li>`).join('')}</ol><p class="automation-status" role="status">El paciente envía su consulta.</p><div class="handoff-card is-preparing"><div class="handoff-head"><span class="handoff-dot"></span><strong>Agenda de ejemplo</strong><span class="pending-chip">Preparando</span></div><dl><div><dt>Motivo</dt><dd>${esc(clinic.request)}</dd></div><div><dt>Cita</dt><dd data-summary-preference>Pendiente de confirmar</dd></div><div><dt>Cambio en agenda</dt><dd data-summary-change>Sin cambios todavía</dd></div></dl></div><div class="channel-note">${esc(clinic.waStatus)}</div><div class="handoff-foot">Demo con paciente identificado y disponibilidad ficticia. En producción requiere integración con la agenda y reglas de autorización, cambios y cancelación de la clínica.</div></div></div>`;
}

function setTab(tab) {
  stopWhatsAppDemo();
  const content = document.querySelector("#stage-content");
  document.querySelectorAll("[data-tab]").forEach(button => {
    const selected = button.dataset.tab === tab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  content.className = `stage-content view-${tab}`;
  content.innerHTML = tab === "whatsapp" ? whatsapp() : landing({ withChat: tab === "web" });
  window.mountReceptionAssistant?.(tab === "whatsapp" ? null : clinic, tab === "web");
  if(tab === "whatsapp")playWhatsAppDemo();
  document.querySelector("#stage-label").textContent = tab === "whatsapp" ? "01 · WHATSAPP" : tab === "web" ? "02 · ASISTENTE EN LA WEB" : `03 · ${clinic.pageLabel.toUpperCase()}`;
  document.querySelector("#stage-intro").textContent = tab === "whatsapp" ? "Prueba las tres gestiones: reservar una cita, cambiarla o cancelarla, con confirmación del agente." : tab === "web" ? "Esta vista usa tres recorridos guiados. El agente final responderá a preguntas abiertas según la información y las reglas de vuestra clínica." : (window.ATLIS_DESIGN_NOTES?.[clinic.number] || clinic.pageDescription);
}

document.querySelector("#app").innerHTML = `<div class="site-shell"><header class="atlis-header"><a class="atlis-logo" href="index.html" aria-label="Volver al índice"><img src="assets/atlis-logo.png" alt="ATLIS"></a><span class="header-divider"></span><span class="header-title">Propuesta visual para clínicas</span><a class="header-index" href="index.html">← Índice de clínicas</a><span class="header-note">DEMOSTRACIÓN ILUSTRATIVA</span></header>
  <main><div class="intro-row"><div><span class="intro-kicker">CLIENTE ${esc(clinic.number)} <span class="kicker-line"></span> VALENCIA</span><h1>${esc(clinic.name)}<span>.</span></h1><p>${esc(clinic.observation)}</p></div><div class="intro-aside"><span>ENFOQUE RECOMENDADO</span><strong>${esc(clinic.improvement)}</strong></div></div>
  <div class="demo-toolbar"><div class="tab-list" role="tablist" aria-label="Vistas de la propuesta"><button role="tab" data-tab="whatsapp" type="button">01 <strong>${clinic.waMode === "no_prioritario" ? "WhatsApp opcional" : "WhatsApp"}</strong></button><button role="tab" data-tab="web" type="button">02 <strong>Asistente web</strong></button><button role="tab" data-tab="landing" type="button">03 <strong>Página propuesta</strong></button></div><div class="toolbar-pill"><span></span> Ejemplo ficticio</div></div>
  <section class="demo-stage"><div class="stage-heading"><div><span id="stage-label" class="section-kicker"></span><p id="stage-intro"></p></div><span class="stage-source">Basado en información pública de la clínica</span></div><div id="stage-content" aria-live="polite"></div></section>
  <div class="closing-row"><div><img src="assets/atlis-icon.png" alt="" aria-hidden="true"><span><strong>Cada consulta merece un siguiente paso.</strong><small>Concepto preparado por Atlis · 28 de septiembre de 2026</small></span></div><p>Esta propuesta muestra una experiencia posible. No es un canal activo de la clínica y los mensajes son ficticios.</p></div></main>
  <footer><span>ATLIS · AGENCIA PARA CLÍNICAS PRIVADAS</span><div><a href="diagnostico-y-correos.md#cliente-${esc(clinic.number)}">Diagnóstico y correo ↗</a><a href="${esc(clinic.source)}" target="_blank" rel="noopener noreferrer">Web actual ↗</a><a href="${esc(clinic.sourceContact)}" target="_blank" rel="noopener noreferrer">Contacto actual ↗</a></div></footer></div>`;

document.addEventListener("click", event => {
  const scenario=event.target.closest("[data-wa-scenario]");
  if(scenario){waScenario=scenario.dataset.waScenario;setTab("whatsapp");}
  if(event.target.closest("[data-replay-whatsapp]"))playWhatsAppDemo();
  const tab = event.target.closest("[data-tab]");
  const show = event.target.closest("[data-show]");
  if (tab) setTab(tab.dataset.tab);
  if (show && document.body.classList.contains("direct-site")) { window.setReceptionOpen?.(true,true); return; }
  if (show) {
    setTab(show.dataset.show);
    document.querySelector(".demo-stage").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
setTab("landing");
if(new URLSearchParams(location.search).has("vista")){document.body.classList.add("direct-site");const html=window.renderBespoke(clinic);document.querySelector("#app").innerHTML=html;window.mountReceptionAssistant?.(clinic,false);}

if(!document.body.classList.contains("direct-site") && location.hash === "#asistente") setTab("web");

if(!document.body.classList.contains("direct-site") && location.hash === "#whatsapp") setTab("whatsapp");
