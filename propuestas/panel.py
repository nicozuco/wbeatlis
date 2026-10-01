#!/usr/bin/env python3
"""Genera el panel privado con todas las propuestas publicadas.

Uso: python3 propuestas/panel.py
Escribe atlis-propuestas-clinicas-v2/public/<carpeta secreta>/index.html. La carpeta se guarda en
panel-ruta.txt la primera vez y se reutiliza, para que el enlace no cambie. Los enlaces llevan ?yo
para que tus visitas no cuenten en la analítica.
"""
import html
import json
import re
import secrets
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI / 'atlis-propuestas-clinicas-v2'
PUBLIC = RAIZ / 'public'
RUTA = AQUI / 'panel-ruta.txt'
DOMINIO = 'https://propuestas.atlisclinicas.com'


def datos(slug):
    d = PUBLIC / slug / 'data.js'
    if not d.is_file():
        return None
    m = re.search(r'=\s*(\{.*\});?\s*$', d.read_text(encoding='utf-8'), re.S)
    return next(iter(json.loads(m.group(1)).values())) if m else None


def main():
    if not RUTA.exists():
        RUTA.write_text('equipo-' + secrets.token_hex(5) + '\n', encoding='utf-8')
    carpeta = RUTA.read_text(encoding='utf-8').strip()
    urls = json.loads((RAIZ / 'urls-publicas.json').read_text(encoding='utf-8'))
    fichas = {}
    for f in (AQUI / 'fichas').glob('*.json'):
        try:
            j = json.loads(f.read_text(encoding='utf-8'))
            fichas[j.get('slug')] = j
        except Exception:
            pass
    filas = []
    for slug, url in urls.items():
        if slug.startswith('_'):
            continue
        d = datos(slug) or {}
        num = int(d.get('number') or fichas.get(slug, {}).get('numero') or 0)
        f = fichas.get(slug, {})
        dire = f.get('web', {}).get('direccion', '')
        m = re.search(r'\b\d{5}\s+([^·(,]+)', dire)
        lugar = m.group(1).strip() if m else ''
        vista = {'whatsapp': 'WhatsApp', 'web': 'Agente web', 'landing': 'Nueva web'}.get(d.get('recView') or f.get('propuesta', {}).get('recomendacion', {}).get('vista'), '')
        filas.append({'num': num, 'slug': slug, 'nombre': d.get('name') or slug, 'web': d.get('source', ''),
                      'lugar': lugar, 'dom': re.sub(r'^https?://(www\.)?', '', d.get('source', '')).strip('/'), 'vista': vista, 'url': url, 'tanda': f.get('tanda') or (1 if num <= 65 else 2)})
    filas.sort(key=lambda x: x['num'])
    tandas = sorted({f['tanda'] for f in filas})
    e = html.escape
    items = '\n'.join(
        f'<a class="card" href="{e(f["url"])}?yo" target="_blank" rel="noopener" data-t="{f["tanda"]}" '
        f'data-q="{e((f["nombre"] + " " + f["lugar"] + " " + f["slug"]).lower())}">'
        f'<span class="num">{f["num"]:03d}</span><span class="main"><strong>{e(f["nombre"])}</strong>'
        f'<span class="meta">{e(f["lugar"] or f["dom"])}</span></span>'
        f'<span class="tag">{e(f["vista"])}</span><span class="arrow">↗</span></a>' for f in filas)
    botones = ''.join(f'<button data-f="{t}">Tanda {t} <em>{sum(1 for f in filas if f["tanda"] == t)}</em></button>' for t in tandas)
    page = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Propuestas · Atlis</title>
<link rel="icon" href="../deniz/assets/atlis-icon.png"><style>
@font-face{{font-family:Manrope;src:url(../deniz/assets/manrope-latin.woff2) format("woff2");font-weight:200 800}}
:root{{--bg:#f4f6f5;--card:#fff;--ink:#102f32;--mut:#5f7070;--line:#dde6e4;--acc:#2e6b69;--soft:#e7f0ee}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 Manrope,system-ui,sans-serif}}
header{{background:var(--ink);color:#fff;padding:28px 16px 22px}}.wrap{{max-width:980px;margin:0 auto}}
h1{{margin:0;font-size:26px;letter-spacing:-.02em}}header p{{margin:6px 0 0;color:#b9cfcc;font-size:14px}}
.bar{{position:sticky;top:0;z-index:2;background:var(--bg);padding:14px 16px;border-bottom:1px solid var(--line)}}
.bar .wrap{{display:flex;gap:8px;flex-wrap:wrap;align-items:center}}
input{{flex:1;min-width:200px;font:inherit;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink)}}
button{{font:inherit;font-size:13px;padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}}
button em{{font-style:normal;color:var(--mut);margin-left:4px}}button.on{{background:var(--acc);border-color:var(--acc);color:#fff}}button.on em{{color:#cfe3e0}}
main{{padding:16px}}.grid{{display:grid;gap:8px}}
.card{{display:grid;grid-template-columns:48px 1fr auto 20px;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 16px;color:inherit;text-decoration:none;transition:border-color .15s,transform .15s}}
.card:hover{{border-color:var(--acc);transform:translateY(-1px)}}.num{{font:600 13px ui-monospace,monospace;color:var(--mut)}}
.main{{min-width:0;display:flex;flex-direction:column}}.main strong{{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.meta{{font-size:13px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.tag{{font-size:12px;background:var(--soft);color:var(--acc);border-radius:999px;padding:3px 10px;white-space:nowrap}}.arrow{{color:var(--acc)}}
.count{{color:var(--mut);font-size:13px;margin:0 0 10px}}
@media(max-width:560px){{.card{{grid-template-columns:36px 1fr 16px;padding:12px}}.tag{{display:none}}}}
</style></head><body>
<header><div class="wrap"><h1>Propuestas de Atlis</h1><p>Todas las propuestas publicadas. Uso interno: los enlaces llevan ?yo para que tus visitas no cuenten.</p></div></header>
<div class="bar"><div class="wrap"><input id="q" type="search" placeholder="Buscar clínica o ciudad…" autocomplete="off"><button data-f="all" class="on">Todas <em>{len(filas)}</em></button>{botones}</div></div>
<main><div class="wrap"><p class="count" id="c"></p><div class="grid" id="g">
{items}
</div></div></main>
<script>
const q=document.getElementById('q'),cs=[...document.querySelectorAll('.card')],c=document.getElementById('c');let f='all';
function run(){{const t=q.value.trim().toLowerCase();let n=0;cs.forEach(x=>{{const ok=(f==='all'||x.dataset.t===f)&&(!t||x.dataset.q.includes(t));x.style.display=ok?'':'none';if(ok)n++}});c.textContent=n+' propuestas'}}
q.addEventListener('input',run);document.querySelectorAll('button[data-f]').forEach(b=>b.onclick=()=>{{document.querySelectorAll('button[data-f]').forEach(x=>x.classList.remove('on'));b.classList.add('on');f=b.dataset.f;run()}});run();
</script></body></html>'''
    out = PUBLIC / carpeta / 'index.html'
    out.parent.mkdir(exist_ok=True)
    out.write_text(page, encoding='utf-8')
    print(f'Panel: {DOMINIO}/{carpeta}/  ({len(filas)} propuestas)')


if __name__ == '__main__':
    main()
