# Atlis · repositorio de trabajo

Atlis es una agencia española de IA para clínicas dentales y estéticas. Este repositorio reúne sus proyectos, cada uno en su carpeta, tal como estaban en local (sin claves, sin `node_modules` ni builds).

- `web/` — la web principal https://atlisclinicas.com (proyecto Vercel `atlis-azul`). HTML/CSS/JS estático con `build.mjs` y `server.mjs`. Incluye `index.html`, `demo.html`, `js/`, `assets/`, `auditoria/`, `PENDIENTES.md`, `README.md` y `REVISION.md`.
- `propuestas/atlis-propuestas-clinicas/` — sitio estático de las cinco propuestas publicadas (proyecto Vercel `atlis-propuestas-clinicas`). `public/` contiene gemma-martinez, clinica-such, odontology, carmen-domingo y deniz.
- `propuestas/propuestas-clientes-42-46/` — fuente de esas propuestas (clientes 42-46): `data.js`, estilos, `assets/`, `revision-02/`, diagnóstico y criterios, y `correos/` con los correos, `urls-publicas.json` y `generar.py`.
- `agencia-os/` — sistema operativo interno de la agencia (Next.js + Prisma + Supabase): `app/`, `components/`, `lib/`, `prisma/`, `supabase/migrations/`, `docs/`, `tests/` y su propio `README.md`. Las variables de entorno van en `.env` (no incluido); ver `.env.example`.
- `docs/estrategia-y-marca/` — prompt maestro de Atlis (identidad, tono, reglas) y textos de la web sobre la automatización completa.
- `docs/servicios-y-precios/` — PDF de servicios, precios y captación de clínicas, con su contenido en JSON y el script que lo genera.
- `docs/correos-y-diagnosticos/` — correos de prospección, diagnósticos y criterio comercial de las clínicas contactadas (Valencia, clientes 22-24 y presentaciones individuales).
- `docs/instagram/` — guía de posts, captions, textos de reels, guía de historias y documentación de cada tanda de producción (sin imágenes ni vídeos).
- `docs/web-anterior-codex/` — brief original y notas de una versión anterior de la web.

No se incluyen imágenes de posts, vídeos, la carpeta de logos de marca ni copias de seguridad. Los `.env*` están en `.gitignore`; solo se sube `agencia-os/.env.example`.
