# Publicación · 17 de septiembre de 2026

- Sitio: https://atlisclinicas.com
- Proyecto Vercel: `nicozucos-projects/atlis-preview`.
- Despliegue: https://atlis-preview-y2gf25yeh-nicozucos-projects.vercel.app
- ID: `dpl_2qFJx91RsD6BL2ePia6vgiECxh5h`.
- Estado devuelto por Vercel: `READY`, producción.

Se publica exclusivamente `dist/`, generado con `npm run build`. La carpeta de auditoría, las pruebas y el servidor local no forman parte del sitio publicado.

La zona inferior tiene curvas dobles laterales propias para escritorio y otra geometría para móvil, con ondas visibles por encima del encabezado y a los lados de las preguntas frecuentes. Las líneas están detrás del contenido, no interceptan toques y respetan la preferencia de movimiento reducido. Se conserva el contraste intermedio solicitado y la cabecera de cristal con «Trabajemos juntos».

Comprobación: 14 pruebas de lógica correctas; revisión visual local a 390 y 1440 px; comprobación de geometría y animación. La verificación posterior del sitio público se registra en `publicacion-verificada.json`.

Para publicar futuras revisiones en el mismo proyecto:

```sh
npm test
npm run build
npx vercel deploy dist --project atlis-preview --scope nicozucos-projects --prod --yes
```

El formulario y los textos legales conservan el estado de revisión indicado en la propia web; este despliegue no configura un receptor de solicitudes.
