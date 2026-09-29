// Recibe los avisos de las propuestas (abierta, demo pulsada…) y los reenvía a:
// - agencia-os (se guardan y se ven en Analítica → Propuestas): AGENCIA_OS_EVENTS_URL y
//   AGENCIA_OS_EVENTS_SECRET (el mismo valor que PROPUESTAS_EVENTS_SECRET en agencia-os).
// - GoHighLevel, opcional: GHL_WEBHOOK_URL.
// Todo va en variables de entorno del proyecto de Vercel, nunca en el código público.
// Sin ninguna configurada, el aviso se ignora sin error.
const EVENTOS = new Set(['abierta', 'leida', 'demo_pulsada', 'compartida']);
const BOTS = /bot|crawl|spider|preview|scan|headless|lighthouse|facebookexternalhit|whatsapp|slack|telegram|outlook|office|safelinks|proofpoint|mimecast|barracuda/i;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const slug = String(body.slug || '').slice(0, 60);
  const evento = String(body.evento || '');
  const ua = String(req.headers['user-agent'] || '');
  if (!/^[a-z0-9-]+$/.test(slug) || !EVENTOS.has(evento) || BOTS.test(ua)) return res.status(204).end();

  const { AGENCIA_OS_EVENTS_URL: appUrl, AGENCIA_OS_EVENTS_SECRET: appSecret, GHL_WEBHOOK_URL: ghlUrl } = process.env;
  const destinos = [];
  if (appUrl && appSecret) destinos.push({ url: appUrl, headers: { Authorization: `Bearer ${appSecret}` } });
  if (ghlUrl) destinos.push({ url: ghlUrl, headers: {} });
  if (!destinos.length) return res.status(204).end();

  const aviso = {
    slug,
    clinica: String(body.clinica || '').slice(0, 120),
    evento,
    segundos: Number(body.segundos) || 0,
    dispositivo: /mobile|iphone|android/i.test(ua) ? 'móvil' : 'ordenador',
    ciudad: decodeURIComponent(req.headers['x-vercel-ip-city'] || ''),
    pais: req.headers['x-vercel-ip-country'] || '',
    enlace: `https://propuestas.atlisclinicas.com/${slug}/`,
    fecha: new Date().toISOString(),
  };
  // Un fallo de un destino nunca debe afectar a la propuesta ni al otro destino.
  await Promise.allSettled(destinos.map((d) => fetch(d.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...d.headers },
    body: JSON.stringify(aviso),
    signal: AbortSignal.timeout(8000),
  })));
  return res.status(204).end();
};
