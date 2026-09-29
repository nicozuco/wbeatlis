# Guía · De una clínica nueva a una propuesta enviada

Proceso completo para captar una clínica. Objetivo: unos 30 minutos por clínica.

| Paso | Qué | Tiempo |
|---|---|---|
| 1 | Investigar su web y rellenar la ficha | 20 min |
| 2 | Generar la propuesta con el script | 1 min |
| 3 | Revisarla en el móvil y publicarla | 5 min |
| 4 | Llamar y enviar los correos | 5 min + seguimiento |
| 5 | Reaccionar a los avisos y cerrar la demo | — |

---

## 1. Investigar y rellenar la ficha

Copia `fichas/_plantilla.json` como `fichas/<slug>.json`, por ejemplo `fichas/clinica-lopez.json`. Tienes una ficha completa de ejemplo en `fichas/ejemplo-deniz.json`.

**Qué mirar en su web** (apúntalo todo en la ficha y usa **solo datos comprobados**):

- **Horario publicado.** De ahí salen el hallazgo de "horas sin nadie que conteste", los huecos del calendario de la demo (`web.huecos`) y el pie (`web.horario`). No pongas huecos en días que la clínica cierra.
- **Canales de contacto:** teléfono, WhatsApp, formulario, reserva online.
- **2 o 3 hallazgos** (`propuesta.hallazgos`), del más llamativo al menos llamativo. Los que mejor funcionan:
  - Algo roto: un enlace de email que va a una plantilla, un formulario que no aparece.
  - Horas sin atención: "del viernes a las 19:00 al lunes a las 10:00 pasan 63 horas…".
  - Que falte WhatsApp o que el WhatsApp se abra sin contexto.
  - Un titular o una portada que no explica cómo pedir cita.
- **Quién decide** (`clinica.decisor`): la dueña o dueño o el director médico. Se usa en los correos.
- **Fotos** (`fotos`): la principal vertical (doctora, doctor o equipo) y dos de la clínica (fachada o recepción, y gabinete). Puedes poner la URL de la imagen de su web (clic derecho → "Copiar dirección de imagen"). El script la descarga.
- **Colores** (`colores.acento`): el color principal de su marca. En Chrome, clic derecho sobre un botón de su web → Inspeccionar, y copia el color.
- **Servicios y FAQ:** los tratamientos que publican y 2 o 3 preguntas con respuestas reales (dirección, cómo reservar).

**La recomendación** (`propuesta.recomendacion`): una sola cosa para empezar.
- `whatsapp`: tienen WhatsApp pero nadie contesta fuera de horario.
- `web`: no tienen WhatsApp o tienen muchas especialidades que orientar.
- `landing`: su web no explica cómo pedir cita.

**Número** (`numero`): uno que no esté usado. Las cinco actuales van del 42 al 46; sigue por el 47. El script avisa si está repetido.

## 2. Generar la propuesta

Desde la carpeta del repositorio:

```sh
python3 propuestas/nueva-propuesta.py propuestas/fichas/clinica-lopez.json
```

Crea `propuestas/atlis-propuestas-clinicas-v2/public/clinica-lopez/`:
- Copia el código común y descarga las fotos.
- Genera la web a medida con la plantilla, que tiene la misma estructura que la de Déniz, con los colores y textos de la ficha.
- Añade la URL a `urls-publicas.json`.

Si cambias la ficha, vuelve a generarla con `--sobrescribir`.

Si la ficha tiene errores (falta un campo obligatorio, el número está repetido, la vista no es válida…), el script dice cuál y no crea nada.

## 3. Revisar y publicar

**Revisar en local:**
```sh
cd propuestas/atlis-propuestas-clinicas-v2/public && python3 -m http.server 8080
```
Abre `http://localhost:8080/clinica-lopez/`. Mírala con el móvil en modo responsive (Chrome → F12 → icono del móvil) y comprueba:
- Hallazgos y recomendación bien escritos.
- Las tres pestañas funcionan.
- En "Nueva página" las fotos cargan y los huecos respetan su horario.

**Publicar:** sube los cambios a GitHub (`git add`, `git commit`, `git push`) y pídeme "publica la propuesta de clinica-lopez", o despliégala tú desde Vercel. Quedará en:

`https://propuestas.atlisclinicas.com/clinica-lopez/`

## 4. Contactar

1. **Llamada de 30 segundos** (guion en `correos-captacion/SECUENCIA.md`, punto 2). Sirve para conseguir el permiso para enviar la propuesta y un email directo, no el `info@`. Apunta en agencia-os quién y cuándo dio el permiso.
2. **Correo 1** el mismo día: el hallazgo más llamativo y el enlace a su propuesta.
3. **Correos 2, 3 y 4** los días 3, 7 y 12, en el mismo hilo, solo si no responde.

Formato de los correos: texto plano, sin diseño, 80-120 palabras, un solo enlace. Envíalos desde tu email de dominio.

## 5. Avisos y cierre

Cada propuesta te avisa cuando la clínica:
- **la abre** (hace scroll, la toca o la tiene abierta 15 segundos),
- **llega a la oferta** de la demo gratuita,
- **pulsa "Pedir mi demo gratuita"**,
- **la comparte** con su equipo.

Los avisos llegan a GoHighLevel (ver "Activar los avisos" abajo). **Cuando llegue "abierta", llama ese mismo día:** "Os envié una propuesta para la clínica y he visto que la habéis abierto, ¿qué os ha parecido?".

**Tus visitas no deben contar.** Abre una vez cualquier propuesta en cada navegador y dispositivo tuyo con `?yo` al final (por ejemplo `https://propuestas.atlisclinicas.com/deniz/?yo`). Desde ese momento, tus visitas desde ese navegador se ignoran.

La demo la reservan en tu calendario de GoHighLevel (botón "Pedir mi demo gratuita" → atlisclinicas.com/demo.html).

---

## Activar los avisos (una sola vez)

1. En GoHighLevel: **Automatización → Crear flujo de trabajo → empezar de cero**.
2. **Disparador:** "Inbound Webhook" (Webhook entrante). Copia la URL que te da.
3. Pásame esa URL. La guardo como variable secreta del proyecto de Vercel (`GHL_WEBHOOK_URL`); no va en el código público.
4. Vuelve a GoHighLevel y pulsa "Obtener datos de muestra": abre cualquier propuesta **sin** `?yo` y haz scroll para que llegue un aviso de prueba.
5. **Acciones del flujo** (según prefieras):
   - "Enviar notificación interna" o "Enviar SMS/WhatsApp" a tu móvil. Por ejemplo: `{{inboundWebhookRequest.clinica}} ha {{inboundWebhookRequest.evento}} su propuesta ({{inboundWebhookRequest.dispositivo}}, {{inboundWebhookRequest.ciudad}}). {{inboundWebhookRequest.enlace}}`.
   - Opcional: buscar o crear el contacto de la clínica y ponerle la etiqueta `propuesta-abierta` para verlo en tu pipeline.

Datos que llegan con cada aviso: `slug`, `clinica`, `evento` (`abierta`, `leida`, `demo_pulsada`, `compartida`), `segundos` en la página, `dispositivo`, `ciudad`, `pais`, `enlace` y `fecha`.

---

## Referencia técnica

- `nueva-propuesta.py`: el generador.
- `fichas/`: una ficha por clínica, más `_plantilla.json` y `ejemplo-deniz.json`.
- `atlis-propuestas-clinicas-v2/public/plantilla.css`: estilos de la plantilla. Los colores son variables que salen de la ficha.
- `atlis-propuestas-clinicas-v2/public/contacto.js`: tu contacto, común a todas las propuestas (WhatsApp, calendario, email).
- `atlis-propuestas-clinicas-v2/api/visita.js`: recibe los avisos y los reenvía a GoHighLevel. Ignora escáneres de correo y vistas previas.
- **Código común:** `app.js`, `bespoke.js`, `client-view.js` y los CSS son idénticos en todas las carpetas. Si cambias uno, cópialo a todas; las nuevas los copian de `deniz/`.
- **Las cinco primeras propuestas** (42-46) tienen su web diseñada a mano. Las nuevas usan la plantilla. Si una clínica merece un diseño distinto, se puede hacer a mano sobre la generada.
