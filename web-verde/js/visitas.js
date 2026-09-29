// Contador de visitas de Atlis: envía a agencia-os (Analítica → Web) qué página
// se ve, de dónde viene la visita y si pulsa el botón de la demo. Sin cookies y
// sin datos personales: el id es aleatorio y dura mientras la pestaña está abierta.
// Tus visitas no cuentan si abres la web una vez con ?yo al final.
(function () {
  var ENDPOINT = 'https://agencia-os-eta.vercel.app/api/t';
  var host = location.hostname;
  if (!/(^|\.)atlisclinicas\.com$/.test(host)) return;
  var params = new URLSearchParams(location.search);
  try {
    if (params.has('yo')) localStorage.setItem('atlis_yo', '1');
    if (localStorage.getItem('atlis_yo') === '1') return;
  } catch (e) {}
  if (/bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent)) return;

  var site = /^propuestas\./.test(host) ? 'propuestas' : 'web';
  var id;
  try { id = sessionStorage.getItem('atlis_sid'); } catch (e) {}
  if (!id || !/^[a-z0-9]{12,40}$/.test(id)) {
    id = '';
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var bytes = new Uint8Array(20);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(bytes) : bytes.forEach(function (_, i) { bytes[i] = Math.random() * 256; });
    for (var i = 0; i < bytes.length; i++) id += chars[bytes[i] % chars.length];
    try { sessionStorage.setItem('atlis_sid', id); } catch (e) {}
  }

  function send(type, extra) {
    var data = { id: id, site: site, type: type, path: location.pathname };
    for (var key in extra || {}) data[key] = extra[key];
    var body = JSON.stringify(data);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
  }

  send('view', {
    ref: document.referrer || '',
    utm: { source: params.get('utm_source') || '', medium: params.get('utm_medium') || '', campaign: params.get('utm_campaign') || '' },
  });

  // Señal cada 30 segundos mientras la pestaña está a la vista: así agencia-os
  // sabe cuánta gente hay ahora mismo.
  setInterval(function () { if (document.visibilityState === 'visible') send('ping'); }, 30000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') send('ping'); });

  // Botones que llevan a reservar la demo.
  var sent = false;
  document.addEventListener('click', function (event) {
    if (sent || !event.target || !event.target.closest) return;
    var el = event.target.closest('a, button');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    if (/demo\.html|#demo-form/.test(href) || el.hasAttribute('data-cta') || /client-close-(primary|secondary)/.test(el.className || '')) {
      sent = true;
      send('cta');
    }
  }, true);
})();
