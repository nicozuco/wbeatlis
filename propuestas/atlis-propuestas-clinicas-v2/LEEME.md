# Propuestas 42–46 · edición 03 (v2)

Copia mejorada de `../atlis-propuestas-clinicas/`, que se conserva intacta y sigue publicada en su URL. Esta versión está publicada aparte en el proyecto de Vercel `atlis-propuestas-clinicas-v2` (https://atlis-propuestas-clinicas-v2.vercel.app/). Las URL están en `urls-publicas.json`.

## Qué cambia respecto a la versión publicada

1. **Cierre útil.** Se quita el enlace al formulario de atlisclinicas.com, que no envía datos. El botón principal abre un correo ya redactado. Cuando se rellene `whatsapp` en `public/contacto.js`, pasa a abrir WhatsApp con el mensaje escrito. Si se rellena `bookingUrl`, aparece además «Reservar 15 minutos». El contacto se edita solo en ese archivo, común a las cinco páginas.
2. **«Lo que hemos visto en vuestra web».** Hay de 2 a 3 hallazgos por clínica, comprobados en sus webs públicas el 29/09/2026 (horarios, teléfonos, WhatsApp y el enlace `contact@mysite.com` de Déniz). Revisarlos antes de enviar, por si la clínica los ha cambiado.
3. **Una recomendación por clínica.** Aparece un bloque «Nuestra recomendación» y la tarjeta correspondiente lleva la etiqueta «Recomendado para empezar». La demo se abre en esa vista: Gemma, nueva portada; Such, Carmen Domingo y Déniz, WhatsApp; Odontology, agente en la web.
4. **El agente reserva directamente.** Todas las demos, las webs de ejemplo, las preguntas frecuentes y los formularios dicen que la cita queda reservada al momento. Un bloque nuevo explica las dos modalidades: reserva directa (recomendada) y con visto bueno de recepción, que se pueden combinar.
5. **Siguientes pasos.** En el cierre, tres pasos: llamada de 15 minutos, prueba con sus datos y empezar por una sola cosa sin permanencia.
6. Los huecos de ejemplo pasan del viernes al lunes, porque la clínica de Gemma cierra los viernes.

Los datos por clínica están en `public/<clinica>/client-presentations.js` (`findings`, `recTitle`, `recText` y `recView`). El código compartido (`client-view.js`, `bespoke.js`, `app.js` y `client-view.css`) es idéntico en las cinco carpetas: si se cambia en una, hay que copiarlo a las demás.

## Publicar

Opción A, sustituir la versión publicada: desplegar esta carpeta en el proyecto de Vercel `atlis-propuestas-clinicas`. Las URL de los correos no cambian.
Opción B, mantener las dos: crear otro proyecto de Vercel con esta carpeta y actualizar `urls-publicas.json`.
