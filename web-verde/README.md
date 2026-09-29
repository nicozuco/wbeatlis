# Atlis — web publicada (versión verde)

> **Esta carpeta es la web real de https://atlisclinicas.com** (proyecto Vercel `atlis-preview`), reconstruida el 29/09/2026 a partir de los archivos publicados más los internos (build, servidor, pruebas y documentos) de `../web/`, que es la variante azul descartada.
>
> **Reserva de demo:** `demo.html` ya no usa el formulario sin conexión: incrusta el calendario de GoHighLevel «Captacion lead web» (ID `LFnngfSNEFfJTJnJSIYb`, 30 min). Las reservas llegan a GoHighLevel. `js/demo.js` se conserva, pero esa página ya no lo carga.
>
> **Publicar:** `npm run build` genera `dist/`; se despliega el contenido de `dist/` en el proyecto `atlis-preview`.
>
> **Pendiente:** completar identidad, aviso legal y política de privacidad (responsable, finalidad, transferencias a LeadConnector/HighLevel) ahora que la web recoge datos.

# Atlis — test landing

> **Versión azul** (25 de septiembre de 2026): copia de `test landing version v.1 prime - copia de seguridad 2026-09-16_213733` con el color principal **#1976F3**. La carpeta original no se ha modificado.
> - Variables en `:root` de `styles.css`: `--cta`/`--teal` #1976F3 (marca), `--teal-dark` #1464D6 (texto pequeño sobre claro), `--accent-on-dark` #5AA2FF (texto sobre azul marino), `--petrol` #0B1B33.
> - El resto de verdes se giró al azul conservando su luminosidad. Los colores propios de WhatsApp (burbuja verde, fondo beige, checks) se mantienen a propósito.
> - Logo, icono e imagen social en azul; originales en `_originales/`.
> - Vista local: `ATLIS_PORT=4340 npm run dev` → http://127.0.0.1:4340

Landing independiente de la aplicación de agencia. Todos sus archivos están dentro de esta carpeta. No comparte base de datos, variables de entorno, paquetes, autenticación ni scripts con el proyecto principal.

## Abrir en local

Requiere Node.js 20 o posterior. No necesita instalar dependencias.

```sh
cd '/Users/nicozuco/Desktop/X/01_Proyectos activos/AGENCIA IA/test landing'
npm run dev
```

Abre **http://127.0.0.1:4310**. Para utilizar otro puerto: `ATLIS_PORT=4311 npm run dev`.

El servidor solo escucha en la máquina local. La vista previa iniciada durante la creación utiliza el puerto 4310; si ya está funcionando, abre esa dirección directamente.

## Qué incluye

- Diseño adaptable, cabecera flotante y menú móvil accesible.
- Logo original sin alteraciones y tipografías Manrope e Inter alojadas localmente.
- Panel panorámico con selector de WhatsApp/chatbot web y representación semanal de Google Calendar. La solicitud de ejemplo permite desplegar sus detalles.
- Escena de recepción con cuatro pendientes explorables: consulta, cita, presupuesto y contexto disperso.
- Cuatro soluciones con ejemplos propios: chatbot web, seguimiento que se detiene al responder, recordatorio con respuesta y presupuesto con revisión profesional.
- Demo con tres casos: consulta fuera de horario, cambio de cita y atención por recepción. Conversación y estado del equipo avanzan juntos, con reinicio y controles de teclado.
- Calculadora de primeras visitas con cuatro deslizadores y cifras editables: citas mensuales, asistencia, aceptación del tratamiento y valor medio. Muestra facturación potencial mensual y anual, y visitas perdidas.
- Sección «Caso de éxito» con cifras, antes y después y cita del cliente, con un caso ilustrativo (clínica y cifras ficticias, etiquetadas) hasta tener uno real.
- Método presentado en pasos editoriales; control humano e indicadores unidos en un bloque oscuro con llamada a la acción; preguntas frecuentes desplegables.
- Color: el verde intenso se reserva para botones y datos; etiquetas e iconos decorativos van en gris verdoso (`--label`) y un acento ámbar (`--warm`) marca solo 3 puntos de atención.
- Página independiente de solicitud de demo (`demo.html`), a la que llevan todos los botones de la landing, con los tres puntos que se revisarán durante la demo.
- Formulario validado y estado explícito de conexión pendiente. Si se ha ajustado la calculadora, la solicitud incluye esas cifras.
- Páginas de revisión del aviso legal y de privacidad, enlazadas desde la landing.
- Movimiento reducido, foco visible, enlaces de salto y metadatos en español.

## Archivos

| Archivo | Función |
| --- | --- |
| `index.html` | Estructura y contenido de la landing |
| `demo.html` | Página independiente con el formulario de solicitud de demo |
| `styles.css` | Paleta, tipografía, componentes, adaptación y movimiento |
| `channel-preview.css` | Representaciones de WhatsApp, chatbot web y Google Calendar |
| `js/channel-preview.js` | Selector de canal y detalle de la solicitud de ejemplo |
| `experience.css` | Escenas interactivas y composición de las secciones renovadas |
| `demo.css` | Composición de la página de solicitud de demo |
| `responsive.css` | Composición móvil y tablet, controles táctiles y áreas seguras |
| `js/experience.js` | Recepción, soluciones y casos interactivos |
| `js/experience-model.js` | Estados y transiciones de los tres casos |
| `js/main.js` | Navegación y calculadora |
| `js/demo.js` | Envío del formulario de la página de demo |
| `js/calculation-handoff.js` | Traslado de las cifras de la calculadora a la solicitud |
| `js/final-cta.js` | Animación del cursor en la llamada final |
| `js/calculator.js` | Fórmulas y límites de entradas |
| `js/form.js` | Validación y comprobación de recepción real |
| `js/config.js` | Conexión del formulario, desactivada de origen |
| `server.mjs` | Servidor local sin dependencias |
| `build.mjs` | Copia de los archivos públicos a `dist/` |
| `PENDIENTES.md` | Información necesaria para activar y publicar |
| `REVISION.md` | Comprobaciones realizadas |

## Preparar archivos estáticos

```sh
npm run build
```

Genera `dist/`, listo para servir mediante un alojamiento estático. La carpeta solo contiene los archivos públicos. Esta entrega es una revisión local: no se ha publicado ni reemplazado otra web.

La página utiliza módulos JavaScript, por lo que debe abrirse mediante el servidor HTTP, no haciendo doble clic en el HTML.

## Comprobar la lógica

```sh
npm test
```

Catorce pruebas comprueban las fórmulas, ceros, decimales, límites, validación del formulario, recepción explícita, traslado de las cifras de la calculadora, enlaces entre páginas, destinos internos y estados de las demostraciones. El ejemplo de la calculadora (80 citas, 60 % de asistencia, 50 % de aceptación y 1200 € por tratamiento) muestra 4800 € mensuales, 57.600 € anuales y 32 primeras visitas perdidas. Simula hasta 10 puntos porcentuales más de asistencia, sin superar el 100 %. Es facturación potencial antes de costes e impuestos. El cambio de cita conserva el horario original hasta la confirmación simulada del equipo; la derivación humana detiene el seguimiento automático.

## Copia de seguridad previa a las mejoras

Antes de modificar la versión anterior se duplicó íntegramente en la carpeta hermana `test landing - copia de seguridad 2026-09-15 21.14.54`. Sus 46 archivos se verificaron mediante SHA-256 contra los originales antes de editar. La copia conserva aquella versión, incluida su compilación.

## Activar el formulario

1. Completar y aprobar los contenidos legales, contacto y condiciones del tratamiento.
2. Implementar un receptor de solicitudes con validación en servidor, límites de uso, gestión de errores y entrega al canal acordado.
3. Configurar `endpoint` y `privacyReady` en `js/config.js`. No incluir claves ni secretos en archivos públicos.
4. El receptor debe devolver HTTP 2xx y JSON `{ "accepted": true, "receiptId": "identificador-real" }` **solo tras recibir y aceptar de verdad la solicitud**. No basta un HTTP 200.
5. Verificar el envío completo, el error, la recuperación y la recepción real antes de retirar la nota de revisión.

El servidor local de esta carpeta sirve archivos; no procesa formularios. Mientras no esté configurado un receptor, el formulario no hace ninguna petición de envío. Las pruebas no han transmitido contactos a terceros.

## Activos y referencias

El logo completo y el icono se copiaron de `logo atlis.png` y `Logo icono atlis.png`, entregados por el usuario en la carpeta padre. Se conservan todos sus bytes, transparencia y proporciones; no se aplica filtro, mezcla ni opacidad a las imágenes. El logo aparece en cabecera, pie y páginas legales; el icono se usa como favicon, icono de acceso y marca del encabezado principal.

SHA-256 del logo: `48a46749d0de42ab84371c22a8edb6f395e9f6f98c95c8b0590df6471b7e6755`.

SHA-256 del icono: `ec9b8a45545d4baa3c4a858be6018ca30bef4840dd50a1151e5f4db5be832269`.

La calculadora sigue la composición, los campos y los textos de la captura facilitada por el usuario de AIAutomatiza, con la paleta de Atlis. Las fórmulas se explican en el desplegable de la propia calculadora.

Las fuentes se descargaron de Google Fonts para servirlas localmente; sus licencias OFL se incluyen en `assets/fonts/`.

Se revisaron las referencias del encargo: [Climadent](https://www.climadent.com/), [Kura](https://getkura.ai/), [AIAutomatiza](https://www.aiautomatiza.com/) y [Automation Talks](https://automationtalks.es/). No se reutilizan sus resultados, clientes, garantías ni condiciones comerciales.

## Revisión móvil de septiembre de 2026

La adaptación móvil y tablet se documenta en [auditoria/responsive/REVISION.md](auditoria/responsive/REVISION.md), con capturas, resultados de Chrome y WebKit y un comprobador de navegador opcional. La nueva hoja `responsive.css` se sirve localmente y se incluye en `dist/`.
