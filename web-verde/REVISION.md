# Revisión realizada

## Sistema de diseño, peso y metadatos (16-09-2026)

Copia de seguridad previa en `test landing - copia de seguridad 2026-09-16 09.19.00`,
59 archivos verificados con SHA-256 antes de tocar nada.

**Imágenes.** El logo (466 KB, 2184×720) y el icono (500 KB, 1254×1254) se servían a tamaño
completo para mostrarse a 107 px y a 22 px. Redimensionados a 400×132 y 256×256: de 966 KB a 62 KB
(−93 %). Los originales quedan fuera de `assets/`, en `_originales/`, para que no viajen al build.

**Paleta.** Convivían dos familias de color: la teal/petróleo de marca y una verde oliva residual
(#7a8b72, #929e85, #a1ad98…) repartida por FAQ, formulario, avisos y pie. Se han remapeado por tono
284 ocurrencias (269 colores distintos) a la familia de marca, respetando el verde de WhatsApp y los
azules de Google Calendar, que imitan productos reales.

**Tokens.** `:root` pasa de 11 a 24 variables: color de acción con sus estados, tres niveles de texto
verificados contra WCAG AA y una escala de radios. Antes había 435 colores distintos y un 70 % de
valores escritos a mano.

**Tipografía.** De 97 tamaños distintos a 21 sobre una escala, con desviación máxima de 2 px. Los
147 textos por debajo de 11 px (había incluso 7,5 px) suben a 11 px.

**Radios.** De unos 20 valores sueltos a una escala de cinco pasos más la píldora, todos por token.

**Botones.** Había cuatro sistemas con tres radios y dos verdes de primario. Ahora todos comparten
`--cta` (#0c6f6a, blanco encima = 6.0:1), radio, alto y estados completos de reposo, hover, active y
focus. El primario deja de ser cian saturado con texto verde oscuro.

**Contraste.** Auditados los estilos computados de todos los nodos de texto en el navegador, incluidas
las cuatro soluciones, los tres casos, la escena de recepción y el canal web: 0 fallos de WCAG AA.

**CSS muerto.** 95 de 193 clases de `styles.css` no aparecían en el HTML ni en el JavaScript.
Purgadas: 64,1 KB → 35,8 KB (−44 %). Verificado comparando 27 propiedades computadas y la caja de los
797 elementos de la página antes y después: 0 diferencias.

**Descargos.** De 26 avisos sobre la propia web a 12, dejando uno por sección. Se quitaron los cuatro
recordatorios internos del panel del hero, que ya está rotulado como ejemplo ilustrativo.

**Compartir y buscadores.** Añadidos canonical, Open Graph, Twitter Card, una imagen social de
1200×630 generada a partir del logo (`assets/atlis-og.png`), `sitemap.xml` y JSON-LD con Organization,
WebSite, WebPage y FAQPage con las ocho preguntas literales de la sección. Todo con el dominio de
ejemplo marcado como pendiente.

**Calculadora.** La solicitud de demo viaja ahora con las cifras simuladas, en un campo oculto y con
una nota visible en el formulario. Cuando se conecte el receptor, cada lead llegará con su propio
escenario.

**Build.** `build.mjs` minifica el CSS sin dependencias (−8,6 KB), copia el sitemap y no arrastra los
originales. El `dist/` pasa de unos 2 MB a 405 KB. Verificado que el CSS minificado produce estilos
computados idénticos al legible.

**Comprobaciones.** Las 12 pruebas de `npm test` siguen pasando. Sin errores de consola. Sin desbordamiento
horizontal a 320, 375 ni escritorio. Pestañas, escena de recepción, casos, FAQ, calculadora y validación
del formulario ejercitados uno a uno.

**No modificado.** El receptor del formulario, los datos legales y la prueba social siguen pendientes:
requieren información real de Atlis.

## Logos aportados y calculadora de primeras visitas

- Logo completo actualizado en cabecera, pie y páginas legales. Icono añadido como favicon, icono de acceso y marca del encabezado principal. Copias idénticas a los dos PNG entregados por el usuario.
- Calculadora con los cuatro campos, estructura y textos de la captura facilitada; colores de Atlis. Valores ajustables mediante deslizadores, teclado y edición numérica directa.
- El ejemplo inicial produce 4800 € al mes, 57.600 € al año y 32 visitas perdidas. El supuesto es aumentar la asistencia hasta 10 puntos porcentuales, con un límite del 100 %.
- El resultado se explica como facturación potencial antes de costes e impuestos. Se contemplan ceros, medias fraccionarias, límites y valores no finitos.
- Doce pruebas automatizadas; sintaxis JavaScript, compilación, referencias locales y recursos HTTP comprobados.
- Revisión mediante código y pruebas de lógica. Las pruebas visuales de navegador de este documento corresponden a la versión inicial.

## Renovación de las escenas y la composición

- Copia de seguridad completa previa a cualquier cambio en `test landing - copia de seguridad 2026-09-15 21.14.54`; 46 archivos idénticos comprobados mediante SHA-256.
- Escena de recepción con cuatro elementos seleccionables y explicación contextual.
- Cuatro soluciones con interacciones diferentes: chatbot, seguimiento, recordatorio y revisión de presupuesto.
- Tres casos de demostración con conversación y estado del equipo sincronizados; navegación por teclado y reinicio.
- Método en pasos verticales, cabecera de calculadora asimétrica y agenda de la demo junto al formulario.
- Once pruebas automatizadas superadas: las seis originales y cinco de estados de las demostraciones.
- Las pruebas nuevas verifican que una solicitud sigue pendiente, que una cita se conserva hasta validar su cambio, que el relevo humano pausa la automatización, que se rechazan transiciones inválidas y que cada caso se reinicia sin heredar el estado anterior.
- Sintaxis JavaScript, compilación, IDs, destinos ARIA y referencias locales comprobados. Los recursos nuevos se sirven correctamente por HTTP.
- Esta iteración se ha comprobado mediante código y pruebas de lógica; las comprobaciones visuales de navegador descritas más abajo corresponden a la versión inicial.

## Cambio del panel de canales

- Sustituido el panel genérico por una representación de WhatsApp con selector de chatbot web y un calendario semanal inspirado en Google Calendar.
- La cita de ejemplo despliega información de su estado pendiente de confirmación.
- Navegación de pestañas mediante flechas, Inicio y Fin; estados `aria-selected` y `aria-expanded`.
- El calendario simplifica la semana a miércoles–viernes en pantallas de hasta 360 px, conservando el jueves de la solicitud.
- Verificados sintaxis de JavaScript, compilación y HTTP 200 para el nuevo CSS, JavaScript e iconos; las seis pruebas existentes siguen pasando.
- Las comprobaciones de navegador detalladas más abajo corresponden a la revisión inicial.

## Lógica de la versión inicial

Seis pruebas automatizadas completadas correctamente con `npm test`:

- Ejemplo del encargo: 300 citas, 10 % de inasistencias, 20 % de reducción relativa y 60 € → 30 inasistencias, 6 visitas recuperadas y 360 €.
- Reducción relativa: el 10 % pasa al 8 %. Se admiten ceros y resultados fraccionarios.
- Límites de porcentajes, valores negativos y entradas no finitas.
- Validación de obligatorios y teléfono opcional.
- La confirmación exige respuesta afirmativa e identificador del receptor.
- Un único H1 y enlaces internos con destino existente.

## Navegador — versión inicial

Comprobaciones realizadas en el navegador integrado:

- Anchos de 320, 390, 768 y 1440 px: sin desbordamiento horizontal de contenido.
- Inspección visual del hero en escritorio y móvil, soluciones, demo y calculadora.
- Las cuatro soluciones actualizan el panel y los estados seleccionados.
- Teclas de flecha cambian la solución y trasladan el foco.
- Apertura del menú móvil y cierre con Escape, devolviendo el foco al botón.
- Demo: conversación, elección de tarde, selección de 18:30 y solicitud pendiente de confirmación.
- Repetición de solicitud a las 16:00 en móvil.
- Derivación humana muestra contexto y seguimiento detenido.
- Calculadora en navegador: margen cero → 0 €; escenario de 25 citas, 10 %, reducción del 50 % y margen de 60 € → 1,25 visitas y 75 €; restablecer → 360 €.
- El formulario vacío señala el nombre; con valores ficticios válidos muestra que no está conectado y no envía información.
- Preguntas frecuentes se expanden y muestran su respuesta.
- Recursos de imagen cargados y sin advertencias ni errores JavaScript en las comprobaciones realizadas.
- Revisión de colores de texto calculados y corrección del contraste del día seleccionado en la agenda.

## Identidad y entrega

- SHA-256 de la copia del logo idéntico al original encontrado.
- Logo sobre blanco, proporciones originales y sin filtros, opacidad ni mezcla CSS.
- Fuentes locales y sus licencias incluidas.
- Compilación estática mediante `npm run build`.
- Todo el trabajo queda dentro de `test landing/`.

## Límites de la revisión

- No se ha hecho un envío a un servicio real porque no existe una conexión configurada.
- Las páginas legales son documentos de revisión pendientes de los datos de Atlis.
- La revisión visual se hizo en el navegador integrado, no en dispositivos físicos ni en todos los navegadores.
- El modo de movimiento reducido está implementado mediante `prefers-reduced-motion`; no se ha cambiado la preferencia del sistema del usuario.
