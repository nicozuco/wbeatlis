# Plan para convertir la formación en una base de conocimiento

## Objetivo

Poder consultar todas las clases desde la app y hacer preguntas a una IA que responda con la clase y el minuto que respaldan cada respuesta. Conservar la transcripción íntegra, además de resúmenes, pasos prácticos y notas sobre lo que se muestra en pantalla.

## Punto de partida (22 de septiembre de 2026)

- La Agenda ya define 12 programas y enlaza 74 grabaciones con sesiones de Formación. El temario contiene 194 sesiones fechadas; las tutorías recurrentes se generan aparte. Todavía falta inventariar las grabaciones antiguas y las clases que no aparecen en el temario.
- Esos enlaces están en `lib/formation-recordings.json` y las sesiones en `lib/formation-sessions.json`. El contenido de las clases aún no tiene un modelo propio en la base de datos.
- La base de datos Supabase vinculada ocupa aproximadamente 17 MB. El plan Free admite 500 MB de base de datos y 1 GB de Storage. Storage contiene actualmente 5 objetos y unos 0,52 MB. Mediremos de nuevo tras la prueba piloto; estas cifras no sustituyen un inventario completo.
- Una grabación de 57:18 pudo transcribirse con «Subtítulos en vivo» reproduciéndola a 2×. El sistema muestra texto móvil: hay que capturarlo cada pocos segundos, detectar huecos y revisar los errores de reconocimiento. Por decisión del usuario, **este será el método de captura de todas las clases**.

## Decisión de arquitectura

1. **Archivo maestro privado en Markdown.** Una carpeta por clase, legible con Obsidian o cualquier editor. Obsidian es la interfaz de lectura; los archivos `.md` son el formato duradero. No guardar este material en `public/` ni incluirlo sin protección en el despliegue de Vercel.
2. **Copia de consulta en Supabase Postgres.** Un importador unidireccional lee el archivo maestro y actualiza clase, resumen y segmentos de transcripción. La app muestra ese contenido detrás de su autenticación y las políticas de acceso. No usar Supabase Storage para vídeo: conservar el enlace al campus.
3. **Una fuente de verdad.** Se corrige Markdown y se vuelve a importar. Las ediciones de la app, si se añaden más adelante, necesitan un flujo explícito de exportación para evitar versiones divergentes.

Estructura propuesta:

```text
formacion-mkt-hackers/
  indice.md
  tutoria-negocio-publicidad/
    2026-09-18-preguntas-respuestas/
      clase.md
      transcripcion.md
      visuales.md
```

`clase.md` contiene metadatos YAML (ID estable, programa, fecha, título, mentor, URL, duración, estado y revisión), resumen, temas, pasos, herramientas, dudas y enlaces a los otros archivos. `transcripcion.md` conserva el texto completo en bloques con marca de tiempo y hablante cuando se identifique. `visuales.md` describe demostraciones, pantallas o diapositivas que el audio por sí solo no explica, con su minuto. Los resúmenes nunca sustituyen a la transcripción.

## Captura con Subtítulos en vivo

1. **Inventario completo:** recorrer los cursos del campus, registrar lección, URL, categoría, duración, fecha y posible duplicado. Relacionar cada grabación con la sesión de la Agenda; las clases antiguas quedan en una biblioteca de Formación.
2. **Una reproducción por Mac:** reproducir una clase a la vez, activar «Subtítulos en vivo» con fuente «Audio de computadora» y leer su ventana accesible. Dos vídeos sonando en la misma sesión alimentarían la misma salida de audio y no darían dos transcripciones separadas. Para capturar dos a la vez harían falta dos entornos independientes, cada uno con su propia salida de audio y su propia instancia de subtítulos; no presuponer que una máquina virtual funcionará hasta probarlo.
3. **Captura con control de calidad:** leer la ventana cada 3–5 segundos, guardar texto nuevo con el tiempo del reproductor, detectar retrocesos y huecos, y crear puntos de control por clase. Empezar a 2× si la calidad de reconocimiento se mantiene. A 2×, una hora de vídeo sigue requiriendo aproximadamente media hora de reproducción: si las 74 grabaciones duraran una hora de media, serían unas 37 horas solo de reproducción, más la revisión. Repetir a 1× los tramos dudosos.
4. **Trabajo solapado:** mientras se reproduce y captura una clase, se pueden inventariar otras, limpiar la transcripción anterior y preparar sus resúmenes. Este paralelismo acelera el proyecto sin mezclar audios.
5. **Revisión:** contrastar nombres, cifras, herramientas, instrucciones técnicas y contenido visual. Señalar como «no verificado» lo que no pueda confirmarse. Cada afirmación importante del resumen debe apuntar a un minuto de la grabación.

## Modelo de datos de consulta

- `Course`: categoría o programa del campus.
- `Lesson`: ID estable, programa, fecha, título, URL, duración, estado de captura/revisión y vínculo opcional a la sesión de Agenda.
- `LessonDocument`: Markdown de resumen y notas visuales.
- `TranscriptSegment`: `lessonId`, inicio y fin, hablante opcional, texto y nivel de revisión.

Empezar con búsqueda de texto completo en español y filtros por programa, fecha y tema. La IA recupera primero los segmentos pertinentes, lee su contexto y cita **clase + minuto + enlace**. Añadir embeddings solo si las búsquedas reales muestran que hacen falta; no cargar todos los textos en una sola petición al modelo.

## Capacidad y seguridad

- Presupuesto inicial orientativo: **100 KB de texto por hora de clase**. Las 74 grabaciones ya enlazadas serían del orden de 7,4 MB de texto antes de índices y sobrecarga. Incluso multiplicando esa estimación varias veces, hay margen respecto a los 500 MB; falta medir la biblioteca histórica y el resultado del piloto.
- Guardar texto en Postgres; 1 GB de Storage queda para adjuntos pequeños si son necesarios. No almacenar los vídeos.
- Comprobar `pg_database_size` tras cada lote y fijar un umbral de alerta, por ejemplo 350 MB. Supabase Free pasa a solo lectura al superar 500 MB.
- Mantener copia local del archivo maestro y otra copia de seguridad. El plan Free no incluye copias automáticas de la base de datos y puede pausar proyectos inactivos.
- Mantener el contenido de la formación bajo el acceso privado de la app, con reglas de lectura en la base de datos.

## Ejecución por fases

### Fase 1: piloto

Elegir tres clases de naturaleza distinta: una tutoría, una clase técnica con demostración y una clase expositiva. Inventariarlas, capturarlas, revisar errores, crear sus Markdown e importarlas a Supabase. Medir minutos de trabajo, KB por hora, precisión y puntos visuales que faltan.

### Fase 2: biblioteca y búsqueda

Crear la vista de biblioteca de Formación para las clases antiguas y la ficha de cada clase en la Agenda. Mostrar vídeo original, resumen, transcripción por minuto, estado de revisión y búsqueda. Verificar que solo usuarios autenticados puedan leer el contenido.

### Fase 3: captura masiva

Procesar por categorías y guardar un registro de avance por lección. Detectar duplicados, transcripciones incompletas y huecos de tiempo. Revisar primero las clases con conceptos reutilizables y las consultadas con más frecuencia.

### Fase 4: consultas con IA

Añadir preguntas sobre el curso con recuperación de segmentos y citas. Evaluar respuestas con preguntas cuya respuesta y minuto ya conozcamos. La IA debe distinguir entre lo dicho en una clase antigua y el estado actual de una herramienta, precio u oferta.

## Criterios de terminado por clase

La clase tiene URL válida, metadatos, transcripción completa o huecos marcados, marcas de tiempo, nota de contenido visual, resumen comprobado y vínculo correcto en la app. Una pregunta sobre esa clase devuelve la fuente y el minuto; si falta evidencia, la respuesta lo indica.

## Decisión recomendada

Adoptar el **híbrido Markdown privado + Supabase para consulta**. Empezar por el piloto y su medición antes de construir la captura masiva. Es probable que el texto completo quepa en el plan gratis; el límite operativo será obtener y verificar el contenido de los vídeos, no el espacio de almacenamiento.
