# Revisión móvil de Atlis · 16 de septiembre de 2026

Adaptación aplicada a la landing, la solicitud de demo y las dos páginas legales. La hoja `responsive.css` centraliza la composición móvil y se carga después de los estilos de cada página. El servidor local y la compilación incluyen esa hoja.

## Cambios

- Cabecera compacta, botón «Pedir demo», menú con áreas táctiles de al menos 44 px y acceso directo a la demostración. El menú admite desplazamiento en horizontal, cierra al navegar, al pulsar Escape y al pasar a escritorio.
- Corregido un fallo real del menú: sustituir su SVG durante el evento hacía que el manejador de clic exterior interpretase el toque en el icono como un clic fuera de la cabecera y cerrase inmediatamente el menú. Ahora se conserva el nodo y se comprueba la ruta del evento.
- Portada con tipografía equilibrada, márgenes consistentes y acción principal a todo el ancho en móvil. Se elimina la reducción involuntaria de la página a 320 px.
- Chat con letras más legibles y calendario de tres días en teléfono para que la cita se pueda leer y tocar.
- Beneficios en una columna en teléfono y composición de dos columnas en tablet. La tira de actividad se puede desplazar lateralmente y no consume una larga columna con movimiento reducido.
- Soluciones con selección claramente visible, botones amplios y ejemplos adaptados. Los casos interactivos apilan conversación y resultado; mantienen el enlace para saltar al cambio en la clínica.
- Calculadora con campos editables visibles, entradas de 16 px, deslizadores con área táctil de 44 px y cursores mayores. Las cifras se siguen trasladando a la solicitud de demo.
- Ajustes de preguntas frecuentes, método, caso ilustrativo, reglas, llamadas a la acción, pie y formulario. Campos de formulario de 16 px para evitar el zoom automático habitual de iOS al enfocarlos.
- Márgenes para las áreas seguras, menú con altura dinámica y respeto por la preferencia de movimiento reducido.

## Comprobaciones

- 14 de 14 pruebas de lógica existentes correctas (`npm test`).
- Compilación estática correcta (`npm run build`), incluyendo la nueva hoja de estilos.
- Chrome y WebKit: cuatro páginas a 320, 360, 375, 390, 430, 600, 700, 768, 800, 820, 1000, 1024 y 1440 px. Sin desbordamiento horizontal ni reducción del viewport.
- Interacciones a 320, 390 y 768 px en ambos motores: menú, Escape, navegación interna, canales, cita del calendario, las cuatro soluciones y sus acciones, los tres casos completos, reinicio, calculadora, fórmulas y preguntas frecuentes.
- Validación del formulario y recuperación de las cifras de la calculadora. Se utilizaron datos ficticios. Se comprobó el estado de conexión pendiente; no se enviaron datos a terceros.
- Menú en orientación horizontal de 844 × 390 y cierre al ampliar a escritorio.
- Sin errores JavaScript ni respuestas HTTP de error en el recorrido comprobado.
- Comparación a 1440 px con la versión anterior: dimensiones y posiciones de cabecera, título principal y secciones iguales.
- Comprobación adicional del contenido compilado de `dist/` con la misma batería en ambos motores. Resultados en `resultados.json`.

Las pruebas de teléfono son emulaciones de viewport y tacto con motores reales; no sustituyen una comprobación en un iPhone o Android físico. El formulario mantiene su conexión pendiente, como en la versión recibida. No se ha publicado el sitio.

## Capturas

- `movil-390.png`: portada a 390 px.
- `movil-320.png`: portada a 320 px.
- `menu-movil.png`: menú desplegado.
- `calculadora.png`: calculadora móvil.
- `formulario.png`: página de demo completa.
- `webkit-390.png`: portada en WebKit.

## Repetir la revisión de navegador

El sitio no necesita dependencias. El comprobador opcional `verificar.mjs` requiere Playwright, Chrome y el navegador WebKit de Playwright. Si Playwright se instala en una carpeta de herramientas separada, indicar la ruta absoluta de su `index.mjs`:

```sh
PLAYWRIGHT_MODULE_PATH=/ruta/a/playwright/index.mjs ATLIS_QA_URL=http://127.0.0.1:4317 node auditoria/responsive/verificar.mjs
```

El servidor se inicia con `ATLIS_PORT=4317 npm run dev`. El informe JSON se guarda junto al comprobador.
