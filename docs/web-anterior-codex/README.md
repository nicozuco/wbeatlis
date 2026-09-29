# ATLIS · Web de la agencia

Landing independiente para responsables de clínicas dentales. Todo el código, los recursos y la configuración están en esta carpeta. No depende de la aplicación `AGENCIA IA` y no utiliza su base de datos, credenciales, rutas ni paquetes.

## Vista local

Requiere Node 22 o posterior. No hace falta instalar dependencias.

```sh
npm run dev
```

Abrir [la landing local](http://127.0.0.1:4317). Puerto independiente: `4317`.

## Archivos

- `dist/index.html`: contenido, metadatos y estructura completa.
- `dist/styles.css`: identidad visual, diseño adaptable y accesibilidad visual.
- `dist/site.js`: menú, recorrido interactivo, formulario y diálogos de revisión.
- `dist/assets/`: copias de los logotipos y fuentes locales.
- `server.mjs`: servidor local y servicio preparado para enviar solicitudes.
- `tests/server.test.mjs`: ocho pruebas del contrato de recepción y sus protecciones.
- `docs/brief-original.md`: briefing facilitado por el propietario.
- `docs/PENDIENTES.md`: datos y conexiones necesarios antes de publicar.
- `docs/VERIFICACION.md`: comprobaciones realmente realizadas y límites.

## Estado del formulario

Por defecto está en **revisión**, con el botón de envío desactivado y sin envío ni almacenamiento de solicitudes. Se pueden probar la introducción de datos y los errores de validación. No hay calendarios reales conectados.

Para activarlo, copiar `.env.example` a `.env` y completar los valores reales. El servidor solo lo habilita cuando están configurados el receptor HTTPS, la política de privacidad, el aviso legal y la información resumida de privacidad. Reiniciar `npm run dev` después de cambiar `.env`.

El receptor recibirá JSON con `name`, `clinic`, `email`, `phone`, `interest` y `source: "atlis-landing"`. Debe aceptar o guardar la solicitud antes de devolver HTTP 2xx y `{"received":true}`. El token opcional se envía como `Authorization: Bearer …` exclusivamente desde el servidor. No se expone al navegador.

El servidor incluye validación, límite de tamaño de 8 KB, campo trampa, validación del origen y límite de cinco intentos por dirección en diez minutos. El límite actual vive en memoria: al definir el alojamiento público habrá que adaptar el control de IP al proxy de confianza y usar un límite persistente si se despliegan varias instancias. No se guardan datos personales en logs ni archivos.

El servidor se inicia en `127.0.0.1`, accesible solo desde el equipo. No es un despliegue público.

## Analítica

Se preparan eventos locales `atlis:analytics`: `cta_click` (ubicación del botón), `form_start` y `demo_request_success`. Ninguno incluye el contenido del formulario. No hay cookies, almacenamiento en el navegador, rastreadores ni conexiones a proveedores de analítica. Un adaptador futuro deberá activarse según las preferencias de consentimiento acordadas. No se emite `demo_booked`: no hay reserva de calendario confirmada.

## Comprobaciones

```sh
npm run check
npm test
```

El contenido principal y las preguntas frecuentes permanecen disponibles sin JavaScript. La demostración muestra un resumen alternativo de sus pasos en ese caso. La confirmación de envío necesita el servidor y JavaScript.

## Marca y fuentes

Se conservan los archivos oficiales sin filtros, deformaciones ni sustitución tipográfica. El logotipo completo disponible tiene letras blancas: se utiliza sobre una superficie verde petróleo hasta recibir una versión oficial para fondo claro.

Manrope e Inter se sirven localmente en WOFF2, con caracteres latinos para español. Sus licencias OFL están en `docs/`. No se solicita contenido a Google Fonts durante la navegación.

## Publicación

No se ha publicado ni registrado un nuevo alojamiento. La revisión lleva `noindex, nofollow`. Antes de publicar, completar `docs/PENDIENTES.md`, probar una solicitud real y elegir el dominio y el alojamiento. La opción estática permite revisar la página, pero el envío requiere desplegar también el servidor o adaptar `/api/config` y `/api/demo` al alojamiento elegido.
