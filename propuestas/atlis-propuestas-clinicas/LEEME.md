# Publicación de las cinco propuestas de Atlis

Esta carpeta es un sitio estático separado de la web principal. Las cinco páginas están publicadas en https://atlis-propuestas-clinicas.vercel.app/; no modifica atlisclinicas.com ni el formulario.

1. Proyecto Vercel: atlis-propuestas-clinicas. La carpeta public/ se sirve sin proceso de build.
2. Rutas publicadas: /gemma-martinez/, /clinica-such/, /odontology/, /carmen-domingo/ y /deniz/.
3. Las URL completas figuran en ../propuestas-clientes-42-46/correos/urls-publicas.json y ya están insertadas en los cinco correos.
4. Opcionalmente añadir propuestas.atlisclinicas.com en los dominios del proyecto y configurar en Cloudflare el CNAME exacto que Vercel indique. Después habría que actualizar urls-publicas.json y ejecutar python3 generar.py.

Las páginas llevan noindex. No es un control de acceso: cualquiera que tenga una URL puede abrirla. No se envían solicitudes de citas desde las maquetas.
