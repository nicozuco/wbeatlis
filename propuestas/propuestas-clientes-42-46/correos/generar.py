from pathlib import Path
from html import escape
from urllib.parse import urlparse
import csv
import json
import zipfile

root = Path(__file__).resolve().parent
items = [
    {
        "slug": "gemma-martinez",
        "name": "Ortodoncia Gemma Martínez Asúnsolo",
        "to": "info@ortodonciamartinezasunsolo.com",
        "subject": "Una propuesta para facilitar vuestras primeras valoraciones",
        "greeting": "Hola, equipo de Ortodoncia Gemma Martínez:",
        "paragraphs": [
            "He preparado una propuesta visual pensando en quien os escribe para una primera valoración de ortodoncia, tanto para sí mismo como para sus hijos.",
            "Podéis ver una página más clara para ese primer paso y un ejemplo de cómo un agente de recepción ayudaría a resolver dudas habituales y coordinar citas sin interrumpir continuamente al equipo.",
        ],
        "question": "Si os interesa, os preparo una demo gratuita con ejemplos de vuestra clínica para probar preguntas abiertas y ver cómo se adaptaría a vuestra agenda. ¿Os encaja que la comentemos en una llamada breve?",
    },
    {
        "slug": "clinica-such",
        "name": "Clínica Dental Such",
        "to": "info@clinicadentalsuch.com",
        "subject": "Una idea para las consultas de ortodoncia en Clínica Such",
        "greeting": "Hola, equipo de Clínica Such:",
        "paragraphs": [
            "Vuestra web ya presenta los tratamientos y al equipo. He preparado una propuesta para acortar el paso entre el interés por la ortodoncia y la solicitud de una valoración.",
            "Incluye una página centrada en ese recorrido y un ejemplo de agente de recepción que podría responder consultas administrativas y gestionar reservas, cambios y cancelaciones según vuestras reglas.",
        ],
        "question": "La propuesta es una maqueta guiada. Si os encaja la idea, os ofrezco una demo gratuita adaptada a la clínica para probar una conversación abierta. ¿Podemos verla juntos en una llamada breve?",
    },
    {
        "slug": "odontology",
        "name": "Odontology IGS Clinic",
        "to": "info@odontologyclinic.com",
        "subject": "Una propuesta para orientar las consultas de Odontology",
        "greeting": "Hola, equipo de Odontology:",
        "paragraphs": [
            "Al tener varias especialidades, cada consulta necesita llegar al siguiente paso adecuado. He preparado una propuesta que mantiene vuestra identidad visual y facilita que el paciente encuentre cómo empezar.",
            "También podéis ver un ejemplo de agente de recepción para atender preguntas administrativas y coordinar citas, mientras las decisiones clínicas permanecen en vuestro equipo.",
        ],
        "question": "La interacción actual es una maqueta guiada. Me gustaría enseñaros una demo gratuita con preguntas abiertas y ejemplos ajustados a vuestra clínica. ¿Os vendría bien una llamada breve?",
    },
    {
        "slug": "carmen-domingo",
        "name": "Centro Odontológico Carmen Domingo",
        "to": "hola@carmendomingocentroodontologico.com",
        "subject": "Una propuesta para cuidar también el primer contacto",
        "greeting": "Hola, equipo de Carmen Domingo:",
        "paragraphs": [
            "He preparado una propuesta para que la cercanía de vuestra clínica se perciba también antes de la visita, en la web y en las conversaciones de cita.",
            "Podéis recorrer una página renovada y ver cómo un agente de recepción podría atender primeras visitas, cambios y cancelaciones, dejando al equipo las situaciones que necesitan trato personal.",
        ],
        "question": "Por ahora es una maqueta guiada. Si os interesa, os preparo una demo gratuita adaptada a vuestra forma de trabajar para probar preguntas libres y el recorrido de las citas. ¿La vemos en una llamada breve?",
    },
    {
        "slug": "deniz",
        "name": "Déniz Clínica Dental",
        "to": "consulta@denizclinicadental.com",
        "subject": "Una propuesta para facilitar las citas de Déniz",
        "greeting": "Hola, equipo de Déniz:",
        "paragraphs": [
            "La atención personal es parte de vuestra identidad. He preparado una propuesta para que pedir, cambiar o cancelar una cita resulte más sencillo sin perder ese trato cercano.",
            "Podéis ver una nueva presentación de la clínica y un ejemplo de agente de recepción que se ocuparía de las gestiones habituales, con las dudas clínicas y los casos especiales derivados a vuestro equipo.",
        ],
        "question": "Esta vista es una maqueta guiada. Si os encaja, os ofrezco una demo gratuita con ejemplos de Déniz para probar cómo respondería el agente a preguntas abiertas. ¿Os la enseño en una llamada breve?",
    },
]

links_path = root / "urls-publicas.json"
if not links_path.exists():
    links_path.write_text(json.dumps({item["slug"]: "" for item in items}, indent=2, ensure_ascii=False) + "\n")
links = json.loads(links_path.read_text())
preview = root / "vista-previa"
send = root / "para-enviar"
preview.mkdir(exist_ok=True)
send.mkdir(exist_ok=True)

def validate_public(url):
    parsed = urlparse(url)
    return parsed.scheme == "https" and bool(parsed.netloc) and parsed.hostname not in {"127.0.0.1", "localhost"}

def email_html(item, href, preview_mode):
    url = escape(href, quote=True)
    paras = "".join(
        '<p style="margin:0 0 18px;color:#2f4748;font:15px/1.7 Arial,Helvetica,sans-serif;">'
        + escape(paragraph) + "</p>" for paragraph in item["paragraphs"]
    )
    if preview_mode:
        warning = ('<p style="margin:0 0 18px;padding:12px 14px;background:#fff4dc;color:#795500;'
                   'font:12px/1.5 Arial,Helvetica,sans-serif;">VISTA PREVIA LOCAL · El botón solo '
                   'funciona en este ordenador. No envíes este archivo.</p>')
    elif href.startswith("{{URL_PUBLICA_"):
        warning = ('<p style="margin:0 0 18px;padding:12px 14px;background:#fff0ed;color:#9b332b;'
                   'font:12px/1.5 Arial,Helvetica,sans-serif;">BORRADOR SIN ENLACE PÚBLICO · '
                   'Publica la propuesta antes de enviar este correo.</p>')
    else:
        warning = ""
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(item["subject"])}</title>
</head>
<body style="margin:0;padding:0;background:#f5f8f7;color:#142d30;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f8f7;">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border:1px solid #d7e5e1;">
<tr><td style="padding:32px 38px 24px;border-top:5px solid #01c5bd;">
<div style="font:bold 22px/1 Arial,Helvetica,sans-serif;letter-spacing:-1px;color:#102f32;">ATLIS<span style="color:#01c5bd;">.</span></div>
<div style="margin-top:9px;font:11px/1.4 Arial,Helvetica,sans-serif;color:#56736f;">UNA PROPUESTA PREPARADA PARA {escape(item["name"].upper())}</div>
</td></tr>
<tr><td style="padding:0 38px 36px;">
{warning}
<p style="margin:0 0 20px;color:#142d30;font:15px/1.6 Arial,Helvetica,sans-serif;">{escape(item["greeting"])}</p>
{paras}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
<tr><td bgcolor="#0c6f6a" style="border-radius:5px;">
<a href="{url}" style="display:inline-block;padding:15px 22px;border:1px solid #0c6f6a;border-radius:5px;background:#0c6f6a;color:#ffffff;text-decoration:none;font:bold 14px/1.4 Arial,Helvetica,sans-serif;">Ver vuestra propuesta &nbsp;↗</a>
</td></tr></table>
<p style="margin:0 0 20px;color:#2f4748;font:15px/1.7 Arial,Helvetica,sans-serif;">{escape(item["question"])}</p>
<p style="margin:0;color:#142d30;font:15px/1.7 Arial,Helvetica,sans-serif;">Un saludo,<br><strong>Nico</strong><br>Atlis · IA y automatización para clínicas</p>
</td></tr>
<tr><td style="padding:18px 38px;background:#f2f8f6;border-top:1px solid #d7e5e1;">
<p style="margin:0 0 7px;color:#4d6467;font:11px/1.6 Arial,Helvetica,sans-serif;">Si el botón no se abre, copia este enlace:</p>
<a href="{url}" style="color:#0c6f6a;word-break:break-all;font:11px/1.6 Arial,Helvetica,sans-serif;">{url}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>
"""

def email_text(item, href, preview_mode):
    lines = [f"Para: {item['to']}", f"Asunto: {item['subject']}", "", item["greeting"], ""]
    for paragraph in item["paragraphs"]:
        lines += [paragraph, ""]
    lines += [
        "Ver vuestra propuesta:", href, "", item["question"], "",
        "Un saludo,", "Nico", "Atlis · IA y automatización para clínicas",
    ]
    if preview_mode:
        lines += ["", "VISTA PREVIA LOCAL: este enlace no funciona fuera de este ordenador."]
    elif href.startswith("{{URL_PUBLICA_"):
        lines.insert(0, "BORRADOR SIN ENLACE PÚBLICO: no enviar hasta publicar la propuesta.")
    return "\n".join(lines) + "\n"

with (root / "destinatarios-y-asuntos.csv").open("w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["clinica", "destinatario", "asunto", "url_publica", "estado"])
    writer.writeheader()
    for item in items:
        slug = item["slug"]
        public_url = links.get(slug, "").strip()
        ready = validate_public(public_url)
        preview_url = f"../../propuesta-{slug}.html"
        production_url = public_url if ready else f"{{{{URL_PUBLICA_{slug.upper().replace('-', '_')}}}}}"
        (preview / f"correo-{slug}.html").write_text(email_html(item, preview_url, True))
        (preview / f"correo-{slug}.txt").write_text(email_text(item, preview_url, True))
        (send / f"correo-{slug}.html").write_text(email_html(item, production_url, False))
        (send / f"correo-{slug}.txt").write_text(email_text(item, production_url, False))
        writer.writerow({
            "clinica": item["name"], "destinatario": item["to"], "asunto": item["subject"],
            "url_publica": public_url, "estado": "Listo para revisar" if ready else "Pendiente de URL pública",
        })

readme = """# Correos personalizados para las clínicas 42–46

Cada clínica tiene un correo HTML y otro en texto en la carpeta para-enviar. La vista visual local está en vista-previa; su botón abre el archivo local de la propuesta en este ordenador.

Antes de enviar:
1. Las cinco propuestas ya están publicadas en las URL de urls-publicas.json.
2. Abrir y probar los cinco botones de para-enviar antes de cada campaña.
3. Revisar destinatario, asunto y copia. Ningún correo se ha enviado.

Los cinco ZIP de las propuestas están en la carpeta hermana presentaciones-individuales; cada uno contiene la página y los recursos necesarios para alojarla.

El HTML del correo usa un botón que apunta a la propuesta publicada. No conviene adjuntar la página como HTML al mensaje: sus scripts, imágenes y rutas relativas necesitan alojamiento web para funcionar de forma fiable.
"""
(root / "LEEME.md").write_text(readme)
cards = "".join(
    '<article><span>CLÍNICA ' + str(i + 42) + '</span><h2>' + escape(item["name"]) + '</h2>'
    '<p>' + escape(item["subject"]) + '<br><small>Para: ' + escape(item["to"]) + '</small></p>'
    '<a href="para-enviar/correo-' + item["slug"] + '.html">Ver correo final ↗</a>'
    '<a class="secondary" href="../propuesta-' + item["slug"] + '.html">Ver propuesta ↗</a></article>'
    for i, item in enumerate(items)
)
index = ('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
         '<title>Correos de presentación · Atlis</title><style>'
         'body{font:15px/1.6 Arial,sans-serif;margin:0;background:#f5f8f7;color:#142d30}'
         'main{max-width:1050px;margin:auto;padding:45px 24px}h1{font-size:38px;line-height:1.15;margin:0 0 12px}'
         '.intro{max-width:700px;color:#4d6467;margin:0 0 30px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:15px}'
         'article{background:white;border:1px solid #d7e5e1;border-radius:12px;padding:23px}article span{font-size:10px;font-weight:700;letter-spacing:.12em;color:#0c6f6a}'
         'h2{font-size:19px;margin:12px 0}article p{min-height:48px;color:#4d6467}article a{display:inline-block;color:#0c6f6a;font-weight:bold;margin-right:15px}'
         '.notice{background:#fff4dc;border-left:4px solid #c79738;padding:15px;margin-top:30px}'
         '</style><main><small>ATLIS · REVISIÓN DE ENVÍO</small><h1>Cinco correos, cinco propuestas.</h1>'
         '<p class="intro">Abre cada correo para revisar su diseño aproximado y probar el botón que recibirá la clínica.</p>'
         '<div class="grid">' + cards + '</div><p class="notice">Los botones de los correos abren las propuestas públicas. '
         'Antes de enviarlos, revisa el destinatario y el asunto indicados en cada tarjeta. Ningún correo se ha enviado.</p></main></html>')
(root / "index.html").write_text(index)
zip_path = root.parent.parent / "ATLIS-correos-personalizados-42-46.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for file in sorted(root.rglob("*")):
        if file.is_file() and file != Path(__file__):
            z.write(file, file.relative_to(root))
print(root)
print(zip_path)
print("URLs publicadas:", sum(validate_public(links.get(item["slug"], "").strip()) for item in items), "/ 5")
