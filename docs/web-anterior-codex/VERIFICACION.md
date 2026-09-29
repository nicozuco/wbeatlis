# Verificación de la landing

Fecha: 15 de septiembre de 2026.

## Realizado

- Sintaxis de `server.mjs` y `dist/site.js`: correcta (`npm run check`).
- Pruebas del servidor: **8 aprobadas, 0 fallidas** (`npm test`). Cubren modo sin configurar, respuesta 200 sin recepción explícita, confirmación válida, lista de campos enviados y no exposición del token, validación del servidor, rechazo de origen ajeno, límite de intentos, error de transporte y límite de tamaño del cuerpo.
- Las pruebas del receptor utilizan respuestas controladas en memoria y datos ficticios. No envían solicitudes a servicios externos ni acreditan una conexión comercial real.
- Comprobación de estructura HTML: un H1, IDs únicos, anclas existentes y archivos locales presentes.
- Navegador real: navegación por anclas, menú móvil y cierre tras elegir una sección, acordeón de preguntas, pasos de la demostración y cambio por flechas de teclado.
- Formulario: un email inválido muestra su error asociado; botón de envío desactivado mientras falta configuración.
- Anchos revisados: **320, 390, 768, 1024 y 1440 px**. No se detectó desplazamiento horizontal.
- Inspección visual de hero, soluciones, demostración y formulario en escritorio y móvil.
- Recursos de imagen cargados; ningún ancla rota; consola sin errores ni avisos durante la revisión.
- Logotipo completo idéntico al archivo original mediante comparación binaria. No se aplican filtros ni cambios de proporción.
- Las fuentes se sirven localmente. No se instalan proveedores de analítica ni se establecen cookies.
- El contenido principal está escrito en HTML; los acordeones usan `details/summary`. Se incluye alternativa sin JavaScript para los pasos de la demostración y CSS para respetar movimiento reducido.

## Límites y pendientes

- No se ha conectado un receptor real ni se ha enviado una solicitud real.
- Los estados de éxito y error del receptor se han comprobado con respuestas de prueba, no con un proveedor de ATLIS.
- No se ha conectado ni confirmado una reserva de calendario.
- No se ha ejecutado Lighthouse: no se informa de una puntuación ficticia. Debe medirse en el alojamiento definitivo.
- Las comprobaciones de accesibilidad son funcionales y visuales; no sustituyen una auditoría con lectores de pantalla y varios navegadores.
- Falta la versión oficial del logo con letras oscuras para usarlo directamente sobre blanco. La versión disponible se muestra intacta sobre verde petróleo.
- Faltan datos empresariales y textos legales reales; se detallan en `PENDIENTES.md`.
- El sitio sigue en revisión local y no se ha publicado.

## Separación respecto a la app

La landing está en la carpeta hermana `ATLIS WEB`, no dentro de `AGENCIA IA`. Los únicos accesos a la app durante este trabajo fueron lecturas de instrucciones, configuración y logotipos. No se modificó ningún archivo de la app ni se utilizaron su servidor, datos o credenciales.
