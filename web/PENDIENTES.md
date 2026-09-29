# Conexiones y contenidos pendientes

La landing se puede revisar y utilizar en local. Estos puntos requieren información real de Atlis para pasar de la revisión a la captación de solicitudes.

## 1. Receptor del formulario

- Elegir el destino real de las solicitudes: CRM, backend o servicio de formularios.
- Implementar y comprobar recepción, validación del servidor, errores, límites de uso y deduplicación de reintentos.
- Configurar el endpoint en `js/config.js` después de validar la privacidad.
- Comprobar que el receptor confirma con `accepted: true` y un `receiptId` real.

**Estado actual:** desactivado. La web avisa de que no envía datos. No se simula una recepción correcta.

## 2. Identidad y contacto

- Razón social o nombre del titular, NIF, domicilio y datos registrales aplicables.
- Email y teléfono públicos de Atlis.
- Completar el pie y las páginas legales con esos datos.

**Estado actual:** identificado como pendiente; no hay teléfonos ni correos inventados.

## 3. Privacidad

- Responsable, finalidad, base jurídica, conservación, derechos y contacto.
- Proveedores del receptor y alojamiento, destinatarios y transferencias, si corresponden.
- Revisar los registros técnicos y servicios que incorpore el despliegue final.
- Si se quieren comunicaciones comerciales, añadir autorización independiente, opcional y desmarcada.

**Estado actual:** página informativa de revisión. Sin cookies de seguimiento, analítica, publicidad ni solicitudes a fuentes externas desde el navegador.

## 4. Publicación

- Dominio: `atlisclinicas.com` (registrado en Hostinger, DNS en Cloudflare). Alojamiento: Vercel, proyecto `atlis-preview`. Cloudflare Pages se descartó porque las operadoras españolas bloquean sus IP durante los partidos de LaLiga.
- Completar lo anterior antes de retirar las notas de revisión.
- Sustituir `noindex, nofollow` en las cuatro páginas HTML y quitar el `Disallow: /` de `robots.txt`.
- Actualizar `lastmod` en `sitemap.xml`.

**Estado actual:** publicada en Vercel y conectada a `atlisclinicas.com`, pero todavía cerrada a
buscadores (`noindex` y `Disallow: /`). Los metadatos de compartición, el JSON-LD y el sitemap ya usan
el dominio real.

## 5. Evidencia e integraciones

- Confirmar las herramientas e integraciones realmente compatibles antes de mostrar sus marcas.
- Incorporar casos, testimonios o cifras únicamente cuando haya evidencia documentada y autorización.
- Sustituir el caso ilustrativo (`#caso`, debajo de la calculadora) por uno real: la «Clínica Dental Ejemplo», sus cifras y su cita son ficticias y están etiquetadas como tales. Hace falta un cliente real, cifras medidas, su cita textual y autorización escrita para usar su nombre, cargo y foto. Mientras sea ilustrativo, mantener la etiqueta y la nota visibles.

**Estado actual:** solo ejemplos ilustrativos e indicadores que revisar en conjunto. La sección de caso muestra un caso ilustrativo con clínica y cifras ficticias, etiquetado como tal en la propia web; no se presenta como cliente real.
