# Propuestas 42–46 · mejoras recomendadas

Revisión del 29 de septiembre de 2026 sobre las cinco páginas publicadas en `atlis-propuestas-clinicas.vercel.app`. Son las mismas que hay en `propuestas/atlis-propuestas-clinicas/public/`. Se revisaron en ordenador (1440 px) y en móvil (390 px).

## Lo que está bien

- El diseño es de calidad y cada clínica tiene su identidad: sus colores, sus fotos y su forma de hablar.
- La estructura en tres vistas (WhatsApp, agente web y nueva página) es clara y se puede probar.
- Los límites están bien dichos: nada clínico, y se deriva al equipo.
- No hay errores de JavaScript ni imágenes rotas.

## Lo que cambiaría, por orden de impacto

**1. Los dos botones finales no llevan a ninguna parte útil.** Es lo más urgente.
- «Quiero contaros mi caso» abre `atlisclinicas.com/demo.html`, y ese formulario **no envía nada**. La clínica que se interese se queda sin respuesta.
- «Quiero probarlo en mi clínica» abre un `mailto:` a `atlisclinicas@gmail.com`. En muchos ordenadores no abre nada (quien usa Gmail en el navegador no tiene cliente de correo) y el gmail resta seriedad.
- **Propuesta:** botón principal «Hablar con Nico por WhatsApp» (`wa.me/34XXXXXXXXX` con el mensaje ya escrito) y botón secundario «Reservar 15 minutos» (con una página de reservas de Google Calendar o Cal.com). Arreglarlo en `client-view.js` (`contactEmail` y `contactFormUrl`).

**2. Falta lo más persuasivo: lo que hemos visto en su web.** Tenéis un diagnóstico por clínica en `diagnostico-y-correos.md`, pero la página no lo muestra.
- **Propuesta:** un bloque corto al principio, «Lo que hemos visto en vuestra web», con 2-3 hallazgos comprobados:
  - Gemma: el titular de la portada es el número de teléfono, y la clínica está cerrada del jueves a las 20:30 al lunes.
  - Déniz: el enlace del email apunta a `contact@mysite.com`.
  - Such: WhatsApp visible, pero sin nadie que conteste del viernes a las 19:00 al lunes.
- Demuestra que la propuesta está hecha a mano y justifica la solución.

**3. Las cinco dicen lo mismo.** Las cinco ofrecen el mismo paquete de tres (WhatsApp, agente web y web nueva). Vuestro propio diagnóstico recomienda cosas distintas: Gemma, rehacer la portada; Such, un asistente web; Odontology, un ajuste y no una web nueva; Déniz, corregir enlaces y simplificar la cita.
- **Propuesta:** abrir con «Nuestra recomendación para [clínica]: empezar por X», y dejar las otras dos vistas como «y más adelante». Un solo primer paso es más fácil de aceptar que tres.

**4. Se contradice sobre quién confirma la cita.** En la de Déniz, por ejemplo:
- La demo de WhatsApp dice «Agenda y confirma» y «Vuestras citas, gestionadas en la conversación».
- En la misma página, la web propuesta dice «Recepción te ayuda a coordinar la visita y confirmar la disponibilidad», el formulario «La cita requiere confirmación de la clínica» y la agenda de ejemplo «Pendiente de confirmar».
- **Propuesta:** decidir una versión y usarla en todo. Si el agente reserva directamente, que se vea reservando. Si confirma recepción, que se diga así desde el principio.

**5. No se sabe quién hay detrás.** No hay foto, apellido ni teléfono.
- **Propuesta:** un bloque final «Quién os escribe», con foto de Nico (y del socio), una frase y el WhatsApp. En una propuesta en frío, poner cara vale más que otra animación.

**6. «Agente de recepción» asusta a quien la abre primero.** Los correos van a `info@`, que lee recepción.
- **Propuesta:** hablar de «asistente de citas» o «ayuda para recepción», y reforzar la idea de que recepción gana tiempo, no que se la sustituye.

**7. Falta el «y ahora qué».** La página termina con «os explicaremos… el presupuesto».
- **Propuesta:** tres pasos visibles: llamada de 15 minutos, prueba con vuestros datos en pocos días y empezar con un solo proceso sin permanencia. Si lo aprobáis, un «desde» de precio da confianza y filtra.

**8. No sabéis quién la abre.**
- **Propuesta:** activar Vercel Web Analytics en el proyecto `atlis-propuestas-clinicas`. Cada clínica tiene su ruta (`/deniz/`, `/gemma-martinez/`…), así que veréis quién la ha abierto y podréis llamar ese mismo día.

**9. El dominio.** `atlis-propuestas-clinicas.vercel.app` parece provisional y, en un correo en frío, sospechoso.
- **Propuesta:** configurar `propuestas.atlisclinicas.com`, como indica el LEEME, y actualizar `urls-publicas.json` y los correos.

**10. Longitud en móvil.** Entre 8.500 y 9.600 px en móvil, unas 11 pantallas. Con los puntos 3 y 7 se puede acortar sin perder nada.

## Orden sugerido

1. Botones finales, WhatsApp de Nico y analítica (puntos 1 y 8). Sin esto no se debería enviar ningún correo.
2. Bloque de hallazgos y recomendación única por clínica (puntos 2 y 3).
3. Coherencia sobre quién confirma, «quién os escribe» y siguientes pasos (puntos 4, 5 y 7).
4. Dominio propio (punto 9).
