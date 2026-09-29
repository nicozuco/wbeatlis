# Especificación — sistema operativo interno de la agencia

Aplicación web privada, de uso propio: sin registro público, sin landing, sin
onboarding. La usamos 2 personas. Se abre y se trabaja.

Contexto de negocio: la agencia vende automatización con inteligencia artificial
a clínicas dentales en España. El foco no es captar pacientes nuevos, sino
mejorar el viaje del paciente que la clínica ya tiene y quitarle trabajo de
encima a la clínica: atención a leads que ya han contactado, seguimientos y
recordatorios, fidelización y reactivación de la base de datos de pacientes.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4. Componentes de
shadcn restilizados con los tokens de diseño de abajo. Persistencia con Prisma
sobre Supabase Postgres, con RLS activado. Gráficos con Recharts. Lienzo del mapa
con @xyflow/react (React Flow). No se usa SQLite en ningún punto.

## Conexión a base de datos

- `DATABASE_URL` apunta al pooler de Supabase (Supavisor) en transaction mode,
  puerto 6543, con `?pgbouncer=true&connection_limit=1`. Es la que usa la app en
  runtime.
- `DIRECT_URL` se usa solo en el bloque `datasource` de `schema.prisma`
  (`directUrl`), para migraciones. Apunta al pooler en session mode, puerto 5432:
  el host directo `db.<ref>.supabase.co` de Supabase es solo IPv6 y no es
  alcanzable desde redes y entornos serverless sin IPv6.
- Las migraciones versionadas viven en `supabase/migrations/` y se aplican con
  `supabase db push`.
- `PrismaClient` se instancia una única vez y se reutiliza con un singleton
  global en desarrollo.
- Todas las tablas tienen RLS activado y una política explícita para el rol
  privado `agencia_app`. Ninguna tabla queda abierta sin política.

## Acceso

- `/login`: acceso con correo y contraseña de Supabase Auth. No hay registro
  público: los usuarios se crean desde el panel de Supabase. Opción "Recordarme".
- Todas las rutas internas redirigen a `/login` si no hay sesión válida.
- `/ajustes`: organizado por secciones con navegación lateral (la sección va en
  `?seccion=`). Todo se guarda por usuario (tabla UserPreference) y se aplica en
  todos sus dispositivos:
  - Perfil: nombre visible (saludo de Hoy e iniciales en el menú) y email.
  - Apariencia: tema oscuro, claro o según el sistema; color de acento (turquesa,
    azul, violeta, verde, ámbar, rosa); tamaño del texto; reducir animaciones.
    Se aplica al momento con atributos data-* en `<html>` y una cookie para que
    el primer render (también /login) ya salga con el tema correcto.
  - Menú e inicio: página de inicio (la que abre `/`, el login y el logo) y
    ordenar/ocultar apartados del menú (al menos uno visible; los ocultos siguen
    accesibles por su dirección; Ajustes y Cerrar sesión no se ocultan).
  - Notificaciones: avisos de este dispositivo y lista de dispositivos con
    avisos, con opción de quitarlos.
  - Seguridad: cambio de contraseña, cerrar sesión aquí o en todos los
    dispositivos, y resumen de protección activa.
  - Datos: copia completa en JSON y exportación por apartado en CSV o JSON
    (`/api/export`); el gestor se exporta sin credenciales.
  - Atajos de teclado y Acerca de (versión, entorno y estado de base de datos,
    avisos y gestor).

## Sistema de diseño

Tema oscuro único, sin modo claro. Variables CSS en `:root`, consumidas desde
Tailwind. Nada de hexadecimales sueltos en los componentes.

```
--bg:             #0B0C0E   /* fondo global */
--surface:        #141619   /* tarjetas y paneles */
--surface-raised: #1C1F23   /* hover, inputs, filas activas */
--border:         #24282D   /* bordes 1px, separadores */
--border-strong:  #33383F   /* bordes en hover y foco */
--text:           #E8EAED   /* texto principal */
--text-muted:     #8B9197   /* secundario, etiquetas */
--text-faint:     #5A6068   /* placeholders, deshabilitado */
--accent:         #2DD4BF   /* marca: acciones, foco, estado activo */
--accent-hover:   #5EEAD4
--accent-soft:    rgba(45, 212, 191, 0.12)
--success:        #3FB950
--warning:        #F0B429
--danger:         #F85149
--info:           #58A6FF
--violet:         #A78BFA
```

Fases del pipeline, de frío a verde:
Sin contactar #6B7280 · Contactado #58A6FF · Respondido #A78BFA ·
Reunión agendada #2DD4BF · Propuesta enviada #F0B429 · Contratado #3FB950 ·
Descartado #4B5058

Fases de servicio (posventa), después de Contratado:
Contrato firmado #4AC18E · Primer cobro #9BD35A · Implantación #5CC8D8 ·
Cliente activo #2FBF71

Niveles de amenaza de la competencia (1 = más peligroso):
Nivel 1 #F85149 · Nivel 2 #F0B429 · Nivel 3 #58A6FF ·
Nivel 4 #6B7280 · Nivel 5 #4B5058 · Internacional #A78BFA

Tipografía: interfaz y titulares en Inter Tight (500 y 600, letter-spacing
-0.02em en titulares). Cuerpo y controles en Inter (400 y 500). Cifras, tablas y
KPIs en JetBrains Mono con `font-variant-numeric: tabular-nums`. Etiquetas de
sección a 11px, mayúsculas, letter-spacing 0.08em, color `--text-muted`.

Geometría: rejilla base de 8px. Radios de 12px en tarjetas, 8px en botones e
inputs, 6px en chips. Bordes de 1px con `--border`; sin sombras pronunciadas — la
elevación se expresa subiendo el nivel de superficie (el lienzo del Mapa es la
única excepción, para sus elementos flotantes). Padding interior de tarjeta 20px,
separación entre tarjetas 16px. Ancho máximo de contenido 1400px, centrado, 32px
de margen lateral. Transiciones de 150ms en hover y foco, anillo de foco visible
en `--accent`.

## Estructura

Rail de iconos fijo a la izquierda, 64px de ancho, tooltip al pasar el ratón,
icono activo con fondo `--accent-soft`. Orden del rail:

1. Hoy
2. Clientes
3. Analítica
4. Competencia
5. Mapa mental
6. Tareas
7. Agenda
8. Finanzas
9. Contraseñas
10. Notas

Al pie del rail: Ajustes (con el email de la cuenta en el tooltip) y Cerrar sesión.

Cada página abre con cabecera (título de sección y debajo una línea descriptiva
corta en mayúsculas pequeñas), luego una fila de tarjetas KPI, luego el detalle.

### Hoy
Fecha grande a la izquierda, saludo a la derecha. Rejilla de tarjetas:
seguimientos vencidos (clientes cuya fecha de próximo contacto ya pasó,
destacados en `--danger`; la lista muestra los 5 más antiguos y la KPI cuenta
todos), tareas de hoy, últimos movimientos del pipeline y gráfico de contactos de
los últimos 7 días.

### Clientes
CRM con vista Lista y vista Kanban por fase, con arrastrar y soltar entre
columnas. Cada clínica guarda: nombre, ciudad, persona de contacto, teléfono,
email, Instagram, web, fase del pipeline, origen del lead, fecha de primer
contacto, fecha de última interacción, fecha de próximo seguimiento, cuota
mensual acordada e historial de interacciones con fecha y nota. Filtros por fase,
origen y ciudad, más buscador por nombre. Al hacer clic en una clínica se abre un
panel lateral con la ficha completa y el historial, editable sin salir de la
lista.

Vista Proceso: una tarjeta por clínica con el objetivo de su fase, los pasos
para avanzar, todas sus tareas pendientes (las obligatorias primero, con alta
rápida) y el botón para pasar a la siguiente fase. El proceso sigue después de
la venta: Contratado (preparar, enviar y recibir el contrato firmado) →
Contrato firmado (emitir y enviar la primera factura, confirmar el cobro) →
Primer cobro (bienvenida y accesos, configuración, pruebas) → Implantación
(activación con pacientes reales, formación, primera revisión) → Cliente activo.
Llegar a Primer cobro registra automáticamente un ingreso en Finanzas por la
cuota mensual de la clínica (una sola vez por clínica).

### Competencia
Tabla de agencias rivales, ordenable por cualquier columna y filtrable por nivel
y categoría. Campos: nivel de amenaza (Nivel 1-5 o Internacional; es el único
indicador de amenaza), ranking, empresa, tipo de agencia, categoría
(IA / Marketing / Mixto), nicho, Instagram, seguidores, publicaciones, web,
ubicación, trayectoria, precio público, notas propias, casilla "seguido" y fecha
de última revisión. La tabla se desplaza con las flechas de su cabecera o
arrastrando con la rueda central del ratón pulsada. La KPI "Amenaza alta" cuenta
los Niveles 1 y 2. Importación
desde CSV con previsualización antes de confirmar.

### Tareas
Vista Lista y Kanban, categorías, prioridad (urgente / importante), fecha límite
y marcado visual de las retrasadas. Cada tarea puede vincularse a un cliente.
Una tarea vinculada puede marcarse "Obligatoria para avanzar de fase" (por
defecto, la fase actual de la clínica): mientras no esté hecha, la clínica no
avanza desde esa fase por ninguna vía (pasos guiados, Kanban o ficha). Descartar
o retroceder no se bloquea. Las tareas obligatorias aparecen en la tarjeta de
Proceso del cliente, donde también se pueden crear y marcar como hechas.

### Agenda
Sustituye a Contenido (`/contenido` redirige a `/agenda?vista=contenido`). Un solo
sitio para ver lo que hay cada día, en hora de Madrid:

- Reúne recordatorios, tareas con fecha límite, seguimientos de clientes y piezas
  de contenido, cada tipo con su color y con filtros para ocultarlos.
- Vistas Día (por defecto), Semana, Mes y Contenido (tabla de todas las piezas,
  con o sin fecha). Navegación anterior / Hoy / siguiente; en Semana y Mes, tocar
  un día abre su vista de Día.
- En Día: alta rápida de recordatorio (texto + hora), lo atrasado de días
  anteriores arriba cuando se mira hoy, y casillas para marcar recordatorios y
  tareas como hechos.
- "Añadir" crea recordatorios, tareas (mismo formulario que Tareas) o piezas de
  contenido (formato imagen / carrusel / reel, estado idea → guion → diseño →
  programado → publicado, fecha prevista y guion).

Recordatorios con aviso push a la hora exacta en todos los dispositivos:
- Cada dispositivo activa los avisos desde la Agenda (en iPhone, antes hay que
  añadir la app a la pantalla de inicio). Se puede enviar un aviso de prueba.
- Cada minuto, pg_cron en Supabase comprueba si hay recordatorios vencidos sin
  enviar y llama a `/api/reminders/dispatch` (protegida con un secreto), que
  envía el aviso Web Push a todas las suscripciones y lo marca como enviado.
  Cambiar la hora de un recordatorio lo deja pendiente otra vez. Al tocar el
  aviso se abre la Agenda en ese día.

### Finanzas
MRR actual, ingresos del mes, gastos y beneficio (calculados sobre todos los
movimientos del mes). Gráfico de evolución del MRR mes a mes a partir de
`MrrSnapshot`, que se escribe automáticamente: cada cambio que afecta al MRR y
cada apertura de Finanzas actualizan la fila del mes en curso, y la del mes
anterior queda cerrada al empezar el siguiente. Desglose de los ingresos
registrados en el mes por cliente (no la cuota contratada).

### Contraseñas (gestor de contraseñas)
Sustituye a Recursos (`/recursos` redirige a `/contrasenas`). Sirve para todo tipo
de enlaces importantes (correo, diseño, IA, agentes, redes…), agrupados por
categoría con filtros rápidos por categoría y buscador. Cada entrada tiene
nombre, enlace ("Abrir recurso"), categoría (sugeridas o nuevas), descripción y,
opcionalmente, varias cuentas (por ejemplo, cada uno de los correos de Gmail),
cada una con nombre, usuario o email, contraseña y notas privadas. Con el
gestor abierto, la búsqueda también encuentra por nombre de cuenta o usuario.

- Cifrado de extremo a extremo con una clave maestra compartida por el equipo:
  usuario, contraseña y notas se cifran en el navegador (PBKDF2-SHA256 600.000
  iteraciones → AES-GCM 256, IV aleatorio por dato). El servidor y Supabase solo
  guardan el texto cifrado. Título, enlace, categoría y descripción van en claro
  para poder listar y abrir recursos sin desbloquear.
- Primera vez: crear la clave maestra (mínimo 12 caracteres). Después:
  desbloquear, bloqueo manual y automático tras 10 minutos sin actividad.
- Ver y copiar credenciales (el portapapeles se vacía a los 30 s si sigue
  conteniendo lo copiado) y generar contraseñas seguras.
- Cambiar la clave maestra vuelve a cifrar todo en una sola transacción.
  "Restablecer gestor" (escribiendo BORRAR) borra credenciales y clave si se
  olvida; no hay recuperación posible.

### Notas
Notas libres con título, cuerpo en markdown y etiquetas.

### Mapa mental
Lienzo infinito con React Flow: minimapa abajo a la derecha, controles de zoom y
cuadrícula de puntos en `--border`. Varios mapas guardados, con selector arriba
para cambiar entre ellos y crear uno nuevo. Botón y tecla F para pantalla
completa: el lienzo ocupa toda la ventana (y toda la pantalla si el navegador lo
permite); los paneles y diálogos siguen funcionando.

Interacción tipo Figma/FigJam:
- Barra de herramientas flotante **abajo**, centrada: Seleccionar (V), Mano (H),
  Lápiz (P), Subrayador (M), Goma (E), Pósit (S), Forma (R, con selector de
  forma), Cliente, Competidor, Idea de contenido, Grupo, "Ajustar a la vista",
  "Exportar PNG", "Pantalla completa" y "Guardar". Con Lápiz o Subrayador aparece
  encima una fila con su color y grosor.
- Con Seleccionar, arrastrar con el botón izquierdo sobre el lienzo dibuja un
  recuadro de selección; el lienzo se mueve con la rueda central pulsada o
  manteniendo Espacio. Con Mano, el botón izquierdo mueve el lienzo. Con Lápiz,
  Subrayador o Goma, el botón izquierdo dibuja o borra trazos. La rueda desplaza;
  Cmd/Ctrl + rueda o pellizco hacen zoom.
- Doble clic en el lienzo crea una Forma y entra a escribir en ella. Los nodos se
  mueven, se redimensionan y se borran con Suprimir. Intro edita el texto de la
  forma o pósit seleccionado. Escape termina la edición, deselecciona o vuelve a
  Seleccionar desde una herramienta de dibujo. O crea una elipse.
- Los conectores de un nodo solo se ven cuando está seleccionado y con zoom
  suficiente (por debajo del 45 % se ocultan), o en todos los nodos mientras se
  arrastra una conexión.
- En formas y pósits, pasar el ratón por un conector muestra una flecha y una
  vista previa: clic crea una copia (mismo tipo, forma, color y tamaño, sin
  texto) en esa dirección, unida con una flecha. Arrastrar desde el conector y
  soltar en un hueco crea la copia ahí; soltar sobre otro elemento lo conecta.
- Barra flotante sobre la selección de formas, pósits o trazos: forma, color,
  borde, fuente (Inter / Inter Tight / JetBrains Mono), tamaño, negrita,
  tachado, enlace, lista y alineación; en trazos, color y grosor. Negrita,
  tachado, enlace y lista se aplican a las palabras seleccionadas mientras se
  edita, o a todo el texto si la forma solo está seleccionada.

Tipos de nodo, cada uno con su componente:
- Forma — rectángulo, redondeado, elipse, rombo, triángulo, triángulo invertido,
  paralelogramo, hexágono o cilindro, con color de la paleta de la app, borde
  continuo, discontinuo o sin borde, y texto con formato.
- Pósit — papel de color (amarillo, naranja, rosa, violeta, azul, verde, gris)
  con tinta oscura y texto con formato.
- Dibujo — trazo a mano alzada de lápiz o subrayador, con color y grosor; se
  selecciona, mueve, redimensiona y borra (también con la Goma, que admite
  Deshacer).
- Cliente — vinculado a un registro de Clientes: nombre, fase con su color y
  próximo seguimiento. **Doble clic** abre la ficha en el panel lateral; un clic
  simple solo selecciona.
- Competidor — vinculado a un registro de Competencia: nombre, nivel de amenaza
  con su color y seguidores.
- Idea de contenido — con botón que la convierte en una pieza de Contenido
  (preguntando el formato) y conserva el texto como título.
- Grupo — marco con título que agrupa nodos y se mueve con ellos.

Cliente, Competidor e Idea de contenido guardan solo la referencia al registro
original; si se borra, el nodo se muestra como huérfano.

Conexiones con etiqueta de texto y tres estilos: sólida, discontinua y con flecha.

Guardado manual:
- Mover, conectar, redimensionar o editar nodos no escribe en base de datos.
- "Guardar" envía el estado completo del mapa en una única petición y una sola
  transacción. Tres estados: inactivo sin cambios, destacado en `--accent` con
  cambios, spinner mientras guarda; confirmación breve al terminar.
- Con cambios pendientes se muestra "Cambios sin guardar". Atajo Cmd+S / Ctrl+S.
- Al cerrar la pestaña, cambiar de mapa o navegar a otra sección con cambios sin
  guardar se pide confirmación (guardar / descartar / cancelar).
- Al guardar se compara el `updatedAt` del mapa con el que se cargó; si otra
  persona lo ha guardado entretanto, se ofrece "sobrescribir / recargar" en vez
  de guardar directamente.

Sin Supabase Realtime: los datos se leen al cargar el mapa y al volver a la
pestaña.

## Cálculos

- Contactadas = clínicas en Contactado o una fase posterior, con fecha de primer
  contacto, o que pasaron por alguna de esas fases según su historial. Una
  clínica descartada sin haber llegado a contactarse no cuenta.
- Respondidas = contactadas que están o estuvieron en Respondido o una fase
  posterior (aunque luego se descartaran).
- Tasa de respuesta = respondidas ÷ contactadas; tasa de contratación =
  contratadas ÷ contactadas. Los numeradores se cuentan solo dentro del grupo de
  contactadas.
- Contratadas = clínicas en Contratado o en cualquier fase de servicio.
- MRR = suma de las cuotas mensuales de los clientes en fase Cliente activo.
- Porcentajes con un decimal. Denominador cero → guion, nunca "NaN" ni "0%".
