// Recibe los avisos de las propuestas (abierta, demo pulsada…) y los reenvía a GoHighLevel.
// La URL del webhook de GoHighLevel va en la variable de entorno GHL_WEBHOOK_URL del proyecto
// de Vercel, nunca en el código público. Sin esa variable, el aviso se ignora sin error.
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

  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) return res.status(204).end();

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
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aviso) });
  } catch (e) {
    // Un fallo del aviso nunca debe afectar a la propuesta.
  }
  return res.status(204).end();
};
