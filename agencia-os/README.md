# Atlis

Sistema operativo interno de la agencia, construido con Next.js, TypeScript,
Prisma y Supabase Postgres.

## Base de datos

El proyecto local está enlazado con la instancia de Supabase de la organización
**Agencia IA**. Las URLs privadas viven únicamente en `.env`, que está ignorado
por Git (ver `.env.example`):

- `DATABASE_URL` — la usa la app en runtime. Pooler de Supabase (Supavisor) en
  *transaction mode*, puerto **6543**, con `pgbouncer=true&connection_limit=1`
  para no agotar conexiones desde entornos serverless.
- `DIRECT_URL` — solo para migraciones (`directUrl` en `schema.prisma`). Pooler
  en *session mode*, puerto **5432**. No se usa el host directo
  `db.<ref>.supabase.co` porque es solo IPv6.

Comandos habituales:

```sh
npm run db:generate  # regenera Prisma Client
npm run db:migrate   # aplica migraciones pendientes al proyecto enlazado
npm run db:seed      # carga los datos iniciales si la base está vacía
npm run db:verify    # verifica las tablas, RLS y los registros principales
```

Las migraciones versionadas están en `supabase/migrations/` y se aplican con
`supabase db push`. Todas las tablas de negocio tienen RLS habilitado: los
clientes `anon` y `authenticated` no pueden leerlas; el servidor accede mediante
el rol privado `agencia_app`.

## Acceso privado

La aplicación usa Supabase Auth con correo y contraseña. El registro público está
desactivado: crea cada usuario desde **Authentication → Users → Add user** en el
proyecto de Supabase y confirma la cuenta desde ese panel. La sesión se guarda en
cookies seguras; la opción **Recordarme** prolonga la sesión y recuerda el correo
en ese navegador, pero la aplicación nunca guarda contraseñas en texto plano.

## Desarrollo

### Proceso comercial y analítica

Clientes abre por defecto la vista **Proceso**. Cada fase incluye instrucciones
y pasos que se guardan en Supabase por clínica. Al completar la lista se habilita
**Pasar a la siguiente fase**. El avance registra el historial y, al realizar el
primer contacto guiado, su fecha. Las listas de una fase se reinician al reabrirla.
La ficha permite corregir fases manualmente, descartar oportunidades y programar
seguimientos; las vistas Lista y Kanban siguen disponibles.

**Analítica** incluye embudo histórico, distribución actual, conversión por origen,
tiempos de fase, seguimiento, cuotas comerciales, ingresos y gastos, tareas y
contenido. Los filtros comerciales seleccionan clínicas por fecha de alta; las
conversiones consideran todo su historial. Finanzas usa la fecha del movimiento.
Los gráficos explican sus denominadores y muestran «—» cuando falta base de cálculo.

La migración `20260914190000_client_process_steps.sql` añade la lista persistente
con el mismo acceso privado y RLS que las demás tablas. Tras aplicarla, ejecutar
`npm run db:generate`. Validar cálculos con `npm test`; la prueba de integración
opcional se activa con `PROCESS_INTEGRATION=1` y `DATABASE_URL` configurada. La
prueba de base de datos revierte todos sus cambios mediante rollback.

### Formación

La sección **Formación** (`/formacion`) muestra el curso de MKT Hackers:
cursos → módulos → lecciones, y cada lección con Apuntes, Transcripción, Visuales,
Documentos y Estado de captura. El buscador cubre todos los apartados de todas
las lecciones (texto completo en español, sin distinguir tildes) y enlaza al
apartado exacto con los términos resaltados.

La fuente de verdad es el archivo Markdown privado de la carpeta hermana
`formacion-mkt-hackers`. La app no edita ese contenido; tras añadir o corregir
clases, vuelve a importarlo (reemplaza por completo la copia de la base):

```sh
npm run formation:import -- --dry-run   # revisa títulos, orden y estados sin escribir
npm run formation:import                # importa
```

Usa `--source <carpeta>` o `FORMATION_SOURCE_DIR` si el archivo está en otra ruta.
Las tablas `Formation*` vienen de `20260925120000_formation_library.sql`; los PDF
de las lecciones se guardan en la base y solo se sirven con sesión iniciada.

```sh
npm install
npm run dev
```

La aplicación queda disponible en `http://127.0.0.1:3000`.

Visita `http://127.0.0.1:3000/login` para entrar. Las rutas internas redirigen
automáticamente a esa pantalla si no hay una sesión válida.

La especificación funcional completa está en `spec-app-agencia-ia.md`.
