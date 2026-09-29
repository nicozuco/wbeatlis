# Originales que no se publican

Esta carpeta queda fuera de `build.mjs`: nada de aquí llega a `dist/`.

- `atlis-logo-original.png` — logo entregado, 2184×720, 466 KB.
  En la web se sirve `assets/atlis-logo.png` (400×132, 29 KB), que basta para
  los 107 px a los que se muestra.
- `atlis-icon.png` — icono entregado, 1254×1254, 500 KB.
  En la web se sirve `assets/atlis-icon.png` (256×256, 34 KB), que cubre el favicon,
  el icono de iOS y la marca del encabezado.
- `atlis-logo-azul-original.png`, `atlis-icon-azul.png` — logo e icono con el isotipo en #1976F3 (versión azul).
- `atlis-logo-azul-blanco.png` — isotipo azul y texto blanco, para fondos oscuros.
- `og-card-fuente.html` — fuente de `assets/atlis-og.png`, la imagen 1200×630 que se ve
  al compartir el enlace. Para regenerarla:

      Chrome sin interfaz, ventana 1200×1200, y recortar la franja 190–820 (1200×630).

Si algún día hace falta el logo en SVG, partir del original: reduciría esos 29 KB
a menos de 5 KB y se vería nítido a cualquier tamaño.
