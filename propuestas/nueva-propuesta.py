#!/usr/bin/env python3
"""Crea la propuesta de una clínica nueva a partir de su ficha.

Uso:
    python3 propuestas/nueva-propuesta.py propuestas/fichas/mi-clinica.json
    python3 propuestas/nueva-propuesta.py propuestas/fichas/mi-clinica.json --sobrescribir

Genera propuestas/atlis-propuestas-clinicas-v2/public/<slug>/ con:
  - los archivos comunes (copiados de la carpeta de Déniz, que hace de referencia),
  - las fotos de la ficha (descargadas si son URL, copiadas si son rutas locales),
  - data.js, client-presentations.js e index.html propios de la clínica.
Y añade la URL a urls-publicas.json.

Explicación completa en propuestas/GUIA-NUEVA-CLINICA.md.
"""
import json
import re
import shutil
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent / 'atlis-propuestas-clinicas-v2'
PUBLIC = RAIZ / 'public'
REFERENCIA = PUBLIC / 'deniz'  # carpeta de la que se copian los archivos comunes
DOMINIO = 'https://propuestas.atlisclinicas.com'
COMUNES = ['app.js', 'bespoke.js', 'client-view.js', 'styles.css', 'bespoke.css', 'refinement.css', 'client-view.css']
ASSETS_COMUNES = ['Inter-LICENSE.txt', 'Manrope-LICENSE.txt', 'atlis-icon.png', 'atlis-logo-blanco.png',
                  'atlis-logo.png', 'inter-latin.woff2', 'manrope-latin.woff2', 'whatsapp-dental-pattern.svg']

OBLIGATORIOS = [
    'slug', 'numero', 'clinica.nombre', 'clinica.dominio', 'clinica.web', 'colores.acento', 'fotos.principal',
    'propuesta.titulo', 'propuesta.intro', 'propuesta.hallazgos', 'propuesta.recomendacion.vista',
    'propuesta.recomendacion.titulo', 'propuesta.recomendacion.texto', 'web.heroTitulo', 'web.heroTexto',
    'web.servicios', 'web.direccion', 'web.telefono', 'web.huecos',
]


def dato(ficha, ruta):
    valor = ficha
    for parte in ruta.split('.'):
        if not isinstance(valor, dict) or parte not in valor:
            return None
        valor = valor[parte]
    return valor


def fallo(msg):
    print(f'ERROR: {msg}')
    sys.exit(1)


def validar(ficha):
    faltan = [r for r in OBLIGATORIOS if dato(ficha, r) in (None, '', [], {})]
    if faltan:
        fallo('Faltan campos obligatorios en la ficha:\n  - ' + '\n  - '.join(faltan))
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', ficha['slug']):
        fallo('El slug solo puede tener minúsculas, números y guiones (p. ej. "clinica-lopez").')
    if ficha['propuesta']['recomendacion']['vista'] not in ('whatsapp', 'web', 'landing'):
        fallo('propuesta.recomendacion.vista debe ser "whatsapp", "web" o "landing".')
    if not isinstance(ficha['propuesta']['titulo'], list) or not 1 <= len(ficha['propuesta']['titulo']) <= 2:
        fallo('propuesta.titulo debe ser una lista con una o dos frases.')
    if not 1 <= len(ficha['propuesta']['hallazgos']) <= 3:
        fallo('propuesta.hallazgos debe tener entre 1 y 3 hallazgos comprobados.')
    usados = {}
    for carpeta in PUBLIC.iterdir():
        d = carpeta / 'data.js'
        if d.is_file() and carpeta.name != ficha['slug']:
            m = re.search(r'"number":\s*(\d+)', d.read_text(encoding='utf-8'))
            if m:
                usados[int(m.group(1))] = carpeta.name
    if int(ficha['numero']) in usados:
        fallo(f'El número {ficha["numero"]} ya lo usa "{usados[int(ficha["numero"])]}". Elige otro.')


def traer_foto(origen, destino, base):
    if re.match(r'https?://', origen):
        req = urllib.request.Request(origen, headers={'User-Agent': 'Mozilla/5.0 (Atlis propuestas)'})
        with urllib.request.urlopen(req, timeout=30) as r:
            destino.write_bytes(r.read())
    else:
        ruta = (base / origen).resolve()
        if not ruta.is_file():
            fallo(f'No encuentro la foto {origen}')
        shutil.copyfile(ruta, destino)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 1:
        print(__doc__)
        sys.exit(1)
    ruta_ficha = Path(args[0]).resolve()
    ficha = json.loads(ruta_ficha.read_text(encoding='utf-8'))
    validar(ficha)

    slug, num = ficha['slug'], int(ficha['numero'])
    cl, col, prop, web = ficha['clinica'], ficha['colores'], ficha['propuesta'], ficha['web']
    destino = PUBLIC / slug
    if destino.exists():
        if '--sobrescribir' not in sys.argv:
            fallo(f'Ya existe {destino.relative_to(RAIZ.parent)}. Usa --sobrescribir para rehacerla.')
        shutil.rmtree(destino)
    (destino / 'assets' / 'clinics').mkdir(parents=True)

    for nombre in COMUNES:
        shutil.copyfile(REFERENCIA / nombre, destino / nombre)
    for nombre in ASSETS_COMUNES:
        shutil.copyfile(REFERENCIA / 'assets' / nombre, destino / 'assets' / nombre)

    fotos = {}
    for clave, origen in (ficha.get('fotos') or {}).items():
        if not origen:
            continue
        ext = Path(origen.split('?')[0]).suffix.lower() or '.jpg'
        archivo = f'{num}-{clave}{ext}'
        traer_foto(origen, destino / 'assets' / 'clinics' / archivo, ruta_ficha.parent)
        fotos[clave] = archivo

    nombre = cl['nombre']
    corto = cl.get('nombreCorto') or nombre
    tema = prop.get('tema', 'primera visita')
    rec = prop['recomendacion']
    titulo = '<br>'.join(prop['titulo'])

    site = dict(web)
    site['colores'] = col
    site['fotos'] = fotos

    data = {
        'number': num, 'name': nombre, 'shortName': corto, 'brand': web.get('marca', nombre.upper()),
        'domain': cl['dominio'], 'source': cl['web'], 'sourceContact': cl.get('contacto', cl['web']),
        'pageType': 'ajuste', 'pageLabel': 'Nueva página',
        'pageDescription': prop.get('textoNuevaPagina', 'Una web más clara con reserva directa de la primera visita.'),
        'waStatus': 'WhatsApp propuesto', 'waMode': 'visible',
        'improvement': rec['texto'], 'observation': prop['hallazgos'][0],
        'headline': web['heroTitulo'], 'subtitle': web['heroTexto'], 'eyebrow': 'PROPUESTA DE PÁGINA',
        'features': web.get('servicios', [])[:3], 'topic': tema,
        'sectionTitle': 'El siguiente paso, sin fricción.',
        'sectionCopy': 'La cita se reserva directamente en vuestra agenda.',
        'caseLabel': 'conversación de ejemplo', 'time': '18:42', 'request': tema.capitalize(),
        'preference': 'Tarde · reservada',
        'patient': f'Hola, me gustaría pedir una {tema}.',
        'reply': f'Hola, soy un asistente virtual ilustrativo de {corto}. Puedo reservarte la {tema} ahora mismo. ¿Te viene mejor por la mañana o por la tarde?',
        'patientTwo': 'Preferiría la tarde, si es posible.',
        'replyTwo': 'Perfecto. Tengo hueco el jueves a las 17:00 o el lunes a las 18:30. Dime cuál prefieres y te la dejo reservada. La valoración clínica la hará el equipo profesional.',
        'webQuestion': f'¿Puedo pedir una {tema} desde aquí?',
        'webReply': 'Sí. Te pregunto el motivo, te enseño los huecos libres y la cita queda reservada al momento. Cualquier duda clínica la resuelve el equipo profesional.',
        'webChips': ['Pedir cita', 'Horarios', 'Contactar con recepción'], 'palette': 1, 'site': site,
    }
    presentacion = {
        'slug': slug, 'name': nombre,
        'eyebrow': prop.get('etiqueta', 'PROPUESTA PERSONALIZADA'),
        'title': titulo, 'intro': prop['intro'],
        'benefit': prop.get('beneficio', 'Más tiempo para atender.<br>Menos interrupciones para coordinar.'),
        'pain': prop.get('problema', 'Pedir, mover o cancelar una cita no debería requerir varios mensajes y llamadas. El agente resuelve esos pasos y pasa al equipo lo que salga de las reglas acordadas.'),
        'web': prop.get('textoNuevaPagina', 'Una web con vuestra identidad y un recorrido claro hasta la primera visita.'),
        'agent': prop.get('textoWhatsapp', 'Atiende las gestiones de reserva, cambio y cancelación. La valoración clínica sigue siendo cosa de vuestro equipo.'),
        'photo': fotos.get('principal'), 'accent': col['acento'],
        'question': prop.get('pregunta', '¿Qué gestiones de agenda os gustaría delegar primero?'),
        'findings': prop['hallazgos'], 'recView': rec['vista'], 'recTitle': rec['titulo'], 'recText': rec['texto'],
    }
    (destino / 'data.js').write_text(
        'window.ATLIS_PROPOSALS = ' + json.dumps({str(num): data}, ensure_ascii=False) + ';\n', encoding='utf-8')
    (destino / 'client-presentations.js').write_text(
        'window.ATLIS_CLIENT_PRESENTATIONS = ' + json.dumps({str(num): presentacion}, ensure_ascii=False) + ';\n',
        encoding='utf-8')

    index = (REFERENCIA / 'index.html').read_text(encoding='utf-8')
    index = re.sub(r'<title>.*?</title>', f'<title>Una propuesta para {nombre} · Atlis</title>', index)
    index = index.replace('data-clinic="46"', f'data-clinic="{num}"')
    index = index.replace('<link rel="stylesheet" href="client-view.css',
                          '<link rel="stylesheet" href="../plantilla.css?v=1"><link rel="stylesheet" href="client-view.css')
    (destino / 'index.html').write_text(index, encoding='utf-8')

    urls_path = RAIZ / 'urls-publicas.json'
    urls = json.loads(urls_path.read_text(encoding='utf-8'))
    urls[slug] = f'{DOMINIO}/{slug}/'
    urls_path.write_text(json.dumps(urls, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(f'Propuesta creada: {destino.relative_to(RAIZ.parent)}')
    print(f'Fotos: {", ".join(fotos.values()) or "ninguna"}')
    print(f'Se publicará en: {DOMINIO}/{slug}/')


if __name__ == '__main__':
    main()
