(() => {
 const c=window.ATLIS_CLIENT_PRESENTATIONS[clinic.number];
 stopWhatsAppDemo();window.mountReceptionAssistant(null);
 document.documentElement.style.setProperty('--client-accent',c.accent);
 const contact=Object.assign({name:'Nico',whatsapp:'',bookingUrl:'',email:'atlisclinicas@gmail.com'},window.ATLIS_CONTACT||{});
 const replyText=`Hola, ${contact.name}:\n\nHemos visto la propuesta para ${c.name} y nos gustaría ver la demo gratuita adaptada a nuestra clínica. ¿Cuándo podríamos hablar 15 minutos?\n\nUn saludo,`;
 const mailHref=`mailto:${contact.email}?subject=${encodeURIComponent(`Propuesta Atlis · ${c.name}`)}&body=${encodeURIComponent(replyText)}`;
 const waNumber=String(contact.whatsapp||'').replace(/\D/g,'');
 const waHref=waNumber?`https://wa.me/${waNumber}?text=${encodeURIComponent(replyText)}`:'';
 const primary=contact.bookingUrl
  ?`<a class="client-close-primary" href="${esc(contact.bookingUrl)}" target="_blank" rel="noopener noreferrer">Pedir mi demo gratuita <span aria-hidden="true">↗</span></a>`
  :waNumber
  ?`<a class="client-close-primary" href="${waHref}" target="_blank" rel="noopener noreferrer">Pedir mi demo gratuita <span aria-hidden="true">↗</span></a>`
  :`<a class="client-close-primary" href="${esc(mailHref)}">Pedir mi demo gratuita <span aria-hidden="true">↗</span></a>`;
 const secondary=contact.bookingUrl&&waNumber
  ?`<a class="client-close-secondary" href="${waHref}" target="_blank" rel="noopener noreferrer">Prefiero escribir por WhatsApp <span aria-hidden="true">↗</span></a>`
  :'';
 const note=contact.bookingUrl?'Elegís día y hora en nuestro calendario: 30 minutos, sin compromiso.':waNumber?'Se abre WhatsApp con el mensaje ya escrito.':'Se abre un correo ya escrito; solo tenéis que enviarlo.';
 const ctaActions=`<div class="client-close-actions">${primary}${secondary}</div><small class="client-close-contact">${note} También podéis escribir a <a href="${esc(mailHref)}">${esc(contact.email)}</a>.</small>`;
 const viewNames={whatsapp:'01 / WHATSAPP',web:'02 / AGENTE EN LA WEB',landing:'03 / NUEVA PÁGINA'};
 const badge=v=>v===c.recView?'<em class="client-rec-badge">Recomendado para empezar</em>':'';
 const findings=(c.findings||[]).map((f,i)=>`<li><span>0${i+1}</span><p>${esc(f)}</p></li>`).join('');
 const findingsBlock=findings?`<section class="client-findings"><div><span class="client-eyebrow">LO QUE HEMOS VISTO EN VUESTRA WEB</span><h2>Antes de proponer,<br>hemos mirado.</h2><p class="client-findings-note">Revisado en la web pública de ${esc(c.name)}.</p></div><ol>${findings}</ol></section><section class="client-rec"><span class="client-eyebrow">NUESTRA RECOMENDACIÓN</span><h2>${esc(c.recTitle)}</h2><p>${esc(c.recText)}</p><div class="client-rec-actions"><button type="button" class="client-rec-link" data-client-view="${c.recView}">Verlo funcionando →</button><a class="client-rec-link" href="#demo-gratuita">Probarlo con vuestros datos, gratis →</a></div></section>`:'';
 const modes=`<section class="client-modes"><div><span class="client-eyebrow">CÓMO SE GESTIONAN LAS CITAS</span><h2>El agente reserva.<br>Vosotros decidís cómo.</h2></div><div class="client-modes-grid"><article><em>Recomendado</em><h3>Reserva directa</h3><p>El agente consulta vuestra agenda, reserva, cambia o cancela la cita y envía la confirmación al paciente. Recepción lo ve todo en la agenda, sin tener que intervenir.</p></article><article><h3>Con visto bueno de recepción</h3><p>El agente propone el hueco y deja la cita preparada; recepción la confirma con un clic. Útil para primeras visitas largas o tratamientos concretos.</p></article></div><p class="client-modes-note">Se puede combinar: reserva directa para revisiones y cambios, visto bueno para lo que prefiráis revisar. Lo dudoso o clínico siempre pasa a una persona.</p></section>`;
 const steps=`<ol class="client-steps"><li><b>01</b><strong>Llamada de 30 minutos</strong><span>Nos contáis cómo os llegan hoy las citas.</span></li><li><b>02</b><strong>Prueba con vuestros datos</strong><span>En pocos días, con vuestras preguntas, horarios y tono. La probáis vosotros.</span></li><li><b>03</b><strong>Empezamos por una sola cosa</strong><span>La que más tiempo os quite, sin permanencia. Ampliamos solo si funciona.</span></li></ol>`;
 document.querySelector('#app').innerHTML=`<header class="client-header"><img src="assets/atlis-logo.png" alt="Atlis"><span>Preparado para <strong>${esc(c.name)}</strong></span><a href="#recorrido">Ver propuesta ↗</a></header><main class="client-main"><section class="client-hero"><div><span class="client-eyebrow">${c.eyebrow}</span><h1>${c.title.split('<br>').map((t,i)=>i?`<span class="client-hero-sub">${t}</span>`:`<span>${t}</span>`).join('<br>')}</h1><p>${c.intro}</p><div class="client-hero-actions"><a class="client-cta" href="#recorrido">Descubrir la propuesta <span>↓</span></a><a class="client-cta-alt" href="#demo-gratuita">Pedir demo gratuita <span>→</span></a></div><small>Una presentación de Atlis, personalizada para vuestra clínica.</small></div><figure><img src="assets/clinics/${c.photo}" alt="Imagen de ${esc(c.name)}"><figcaption>${esc(c.name)}<span>Vuestra identidad, una experiencia más sencilla.</span></figcaption></figure></section><section class="client-value"><h2>${c.benefit}</h2><p>${c.pain}</p></section>${findingsBlock}<section class="client-tour" id="recorrido"><span class="client-eyebrow">QUÉ OS HEMOS PREPARADO</span><h2>Tres formas de verlo.<br>Una experiencia conectada.</h2><p>Empezad por la recomendada o por lo que más os interese. Cada vista se puede probar.</p><div class="client-cards"><button data-client-view="whatsapp"><span>01 / WHATSAPP</span>${badge('whatsapp')}<h3>La cita, resuelta por chat.</h3><p>${c.agent}</p><strong>Ver cómo funciona →</strong></button><button data-client-view="web"><span>02 / AGENTE EN LA WEB</span>${badge('web')}<h3>Atender mientras atendéis.</h3><p>Resuelve dudas administrativas y reserva la cita desde vuestra web. Este ejemplo muestra tres gestiones guiadas; el agente real entenderá preguntas abiertas.</p><strong>Probar el agente →</strong></button><button data-client-view="landing"><span>03 / NUEVA PÁGINA</span>${badge('landing')}<h3>Una web que invita a dar el paso.</h3><p>${c.web}</p><strong>Explorar el diseño →</strong></button></div></section><section class="client-demo" id="demo"><div class="demo-toolbar"><div class="tab-list" role="tablist" aria-label="Explorar la propuesta"><button role="tab" data-tab="whatsapp">01 <strong>WhatsApp</strong></button><button role="tab" data-tab="web">02 <strong>Agente web</strong></button><button role="tab" data-tab="landing">03 <strong>Nueva página</strong></button></div></div><section class="demo-stage"><div class="stage-heading"><div><span id="stage-label" class="section-kicker"></span><p id="stage-intro"></p></div><span class="client-demo-tag">Demo interactiva</span></div><div id="stage-content"></div></section><p class="client-demo-note"><strong>Lo que estáis viendo es una maqueta guiada.</strong> El agente definitivo no se limita a estas respuestas: podrá interpretar preguntas abiertas, elaborar respuestas propias con la información de vuestra clínica y gestionar las citas según las reglas y la agenda que conectemos. Las consultas clínicas o fuera de alcance pasarán al equipo.</p></section>${modes}<section class="client-close" id="demo-gratuita"><div class="client-close-grid"><div class="client-close-copy"><span class="client-eyebrow">EL SIGUIENTE PASO · DEMO GRATUITA</span><h2>Probadlo gratis<br>en vuestra clínica.</h2><p>${c.question} Os preparamos una demo con vuestra información para que lo comprobéis antes de decidir nada.</p>${steps}</div><aside class="client-offer"><span class="client-offer-tag">Gratis · sin compromiso</span><h3>Vuestra demo,<br>con vuestros datos.</h3><ul><li>Con vuestras preguntas, horarios y tono</li><li>La probáis vosotros antes de decidir</li><li>Sin permanencia: empezáis por una sola cosa</li></ul>${ctaActions}<button type="button" class="client-share client-share-offer" data-share><span aria-hidden="true">↗</span> Compartir con mi equipo</button></aside></div></section><div class="client-sticky" aria-hidden="true"><span><strong>Demo gratuita</strong> con los datos de ${esc(c.name)}</span><a href="#demo-gratuita" tabindex="-1">Pedirla →</a></div></main><footer class="client-footer"><img src="assets/atlis-logo-blanco.png" alt="Atlis"><span>Web, agentes y automatización para clínicas.</span><small>Propuesta de Atlis · imágenes de la web pública de ${esc(c.name)}.</small></footer>`;
 const syncWidget=()=>{const box=document.querySelector('#demo').getBoundingClientRect();const active=document.body.classList.contains('expanded-preview')||(box.top<innerHeight&&box.bottom>0);document.body.classList.toggle('client-demo-visible',active);};
 const syncSticky=()=>{const hero=document.querySelector('.client-hero').getBoundingClientRect();const close=document.querySelector('#demo-gratuita').getBoundingClientRect();document.body.classList.toggle('client-sticky-on',hero.bottom<0&&close.top>innerHeight*.85);};
 window.addEventListener('scroll',syncSticky,{passive:true});syncSticky();
 window.addEventListener('scroll',syncWidget,{passive:true});
 window.addEventListener('resize',syncWidget);
 const internalSetTab=window.setTab;
 window.setTab=(tab)=>{
  internalSetTab(tab);
  syncWidget();
  document.querySelector('.bp-design-note>span')?.remove();
  const note=document.querySelector('.bp-design-note p');if(note)note.textContent=tab==='web'?'Aquí veis una maqueta guiada. En la demo gratuita podréis plantear preguntas abiertas al agente configurado con información de vuestra clínica.':c.web;
  const source=document.querySelector('.bp-source-note');if(source)source.textContent=tab==='web'?'Recorrido ilustrativo: el agente final se adapta a los servicios, horarios y criterios de vuestra clínica.':'Diseño propuesto por Atlis para vuestra clínica. Podéis recorrer las secciones y probar el agente.';
  const channel=document.querySelector('.channel-note');if(channel)channel.remove();
  const head=document.querySelector('.handoff-panel h2');if(head)head.innerHTML='Vuestras citas,<br>gestionadas en la conversación.';
  const subtitle=document.querySelector('.handoff-panel>p');if(subtitle)subtitle.textContent=c.agent;
  const title=document.querySelector('.section-kicker');
  if(tab==='landing'){document.querySelector('#stage-label').textContent='03 · UNA NUEVA PÁGINA PARA VUESTRA CLÍNICA';document.querySelector('#stage-intro').textContent=c.web;}
 };
 const collapseSite=()=>{document.body.classList.remove('client-site-open');const win=document.querySelector('.bespoke-window');if(!win||innerWidth>600||win.dataset.collapsible)return;win.dataset.collapsible='1';const bleed=()=>{if(!win.isConnected)return;win.style.marginLeft='0px';win.style.width='';const r=win.getBoundingClientRect();win.style.marginLeft=(-r.left)+'px';win.style.width=document.documentElement.clientWidth+'px';};win.classList.add('is-open');document.body.classList.add('client-site-open');bleed();requestAnimationFrame(bleed);addEventListener('resize',bleed);};
 const baseSetTab=window.setTab;window.setTab=(tab)=>{baseSetTab(tab);collapseSite();};
 document.addEventListener('click',async e=>{const b=e.target.closest('[data-share]');if(!b)return;const data={title:`Propuesta de Atlis para ${c.name}`,text:`Mira la propuesta que nos ha preparado Atlis para ${c.name}:`,url:location.href.split('#')[0]};try{if(navigator.share){await navigator.share(data);return;}await navigator.clipboard.writeText(data.url);const old=b.innerHTML;b.textContent='Enlace copiado ✓';setTimeout(()=>{b.innerHTML=old;},2200);}catch(err){}});
 // Avisos de visita (van a /api/visita y de ahí a GoHighLevel). Las visitas propias no cuentan:
 // abre una vez cualquier propuesta con ?yo al final del enlace y este navegador queda excluido.
 (()=>{const safe=f=>{try{return f();}catch(e){return null;}};
  if(/[?&]yo\b/.test(location.search))safe(()=>localStorage.setItem('atlis_yo','1'));
  if(safe(()=>localStorage.getItem('atlis_yo'))==='1')return;
  const t0=Date.now();const sent={};
  const send=evento=>{if(sent[evento])return;sent[evento]=1;const k='atlis_'+c.slug+'_'+evento;if(safe(()=>sessionStorage.getItem(k)))return;safe(()=>sessionStorage.setItem(k,'1'));
   safe(()=>fetch('/api/visita',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({slug:c.slug,clinica:c.name,evento,segundos:Math.round((Date.now()-t0)/1000)})}).catch(()=>{}));};
  const opened=()=>send('abierta');
  addEventListener('scroll',()=>{if(scrollY>250)opened();},{passive:true});
  addEventListener('pointerdown',opened,{once:true});
  setTimeout(()=>{if(document.visibilityState==='visible')opened();},15000);
  const close=document.querySelector('#demo-gratuita');
  if(close&&'IntersectionObserver'in window)new IntersectionObserver((es,o)=>{if(es.some(e=>e.isIntersecting)){send('leida');o.disconnect();}},{threshold:.35}).observe(close);
  document.addEventListener('click',e=>{if(e.target.closest('.client-close-primary,.client-close-secondary'))send('demo_pulsada');if(e.target.closest('[data-share]'))send('compartida');});
 })();
 const realPlay=window.playWhatsAppDemo;let waIO=null; window.playWhatsAppDemo=function(){if(waIO){waIO.disconnect();waIO=null;}const el=document.querySelector('#stage-content .phone-frame');if(!el||!('IntersectionObserver'in window))return realPlay();waIO=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){waIO.disconnect();waIO=null;if(el.isConnected)realPlay();}},{threshold:.45});waIO.observe(el);};
 const focusDemo=()=>{const d=document.querySelector('#demo');if(!d)return;window.scrollTo({top:d.getBoundingClientRect().top+scrollY-8,behavior:'smooth'});};
 document.addEventListener('click',e=>{if(e.target.closest('#demo [data-tab]'))requestAnimationFrame(focusDemo);});
 setTab(c.recView||'landing');
 document.addEventListener('click',e=>{
  const view=e.target.closest('[data-client-view]');
  if(view){setTab(view.dataset.clientView);requestAnimationFrame(focusDemo);}
 });
})();
