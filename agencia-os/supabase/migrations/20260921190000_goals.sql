-- Objetivos de la agencia: jerarquía Objetivo → Fases → Pasos marcables.
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalSection" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalStep" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "referenceUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalStep_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Goal_slug_key" ON "Goal"("slug");
CREATE INDEX "Goal_position_idx" ON "Goal"("position");
CREATE INDEX "GoalSection_goalId_position_idx" ON "GoalSection"("goalId", "position");
CREATE INDEX "GoalStep_sectionId_position_idx" ON "GoalStep"("sectionId", "position");
CREATE INDEX "GoalStep_completedAt_idx" ON "GoalStep"("completedAt");

ALTER TABLE "GoalSection" ADD CONSTRAINT "GoalSection_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalStep" ADD CONSTRAINT "GoalStep_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GoalSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON "Goal", "GoalSection", "GoalStep" TO agencia_app;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GoalSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GoalStep" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agencia_app_full_access" ON "Goal" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "GoalSection" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "GoalStep" FOR ALL TO agencia_app USING (true) WITH CHECK (true);

-- Objetivo solicitado, creado con ids estables para que la migración sea
-- reproducible y las casillas conserven su estado entre despliegues.
INSERT INTO "Goal" ("id", "slug", "title", "description", "position") VALUES
('goal-launch-agency', 'lanzamiento-de-agencia', 'Lanzamiento de agencia', 'Plan completo para construir, validar y lanzar la agencia de IA. Las fases siguen el mapa mental y muestran en todo momento qué está hecho y qué falta.', 0);

INSERT INTO "GoalSection" ("id", "goalId", "title", "description", "position") VALUES
('launch-section-00', 'goal-launch-agency', '00 · Formación y preparación', 'Base mínima antes de construir y vender.', 0),
('launch-section-01', 'goal-launch-agency', '01 · Investigación estratégica', 'Nicho, micronicho, avatar y competencia.', 1),
('launch-section-02', 'goal-launch-agency', '02 · Construcción de la oferta', 'Propuesta de valor, oferta y lead magnet.', 2),
('launch-section-03', 'goal-launch-agency', '03 · Infraestructura digital', 'Funnel, agenda, automatizaciones y propuesta.', 3),
('launch-section-04', 'goal-launch-agency', '04 · Instagram estratégico', 'Perfil, contenido inicial y movimiento orgánico.', 4),
('launch-section-05', 'goal-launch-agency', '05 · Prospección activa', 'Sistema diario de captación y seguimiento.', 5),
('launch-section-06', 'goal-launch-agency', '06 · Publicidad y prospección pasiva', 'Preparación, campañas TOFU/MOFU/BOFU y métricas.', 6),
('launch-section-07', 'goal-launch-agency', '07 · Hábitos obligatorios', 'Rutina mínima que mantiene el proceso en marcha.', 7),
('launch-section-08', 'goal-launch-agency', '08 · Tutorías, optimización y escalado', 'Validación final, aprendizaje y crecimiento.', 8);

INSERT INTO "GoalStep" ("id", "sectionId", "title", "description", "referenceUrl", "position") VALUES
('launch-step-00-01', 'launch-section-00', 'Completar los pasos formativos 1, 2 y 3', 'Estudiar el contenido base antes de construir activos de la agencia.', NULL, 1),
('launch-step-00-02', 'launch-section-00', 'Realizar el examen de nivelación', 'Usar el resultado para detectar lagunas formativas.', NULL, 2),
('launch-step-00-03', 'launch-section-00', 'Asistir a dos semanas de clases en directo', 'Anotar dudas y contrastar la aplicación práctica.', NULL, 3),
('launch-step-00-04', 'launch-section-00', 'Resolver las dudas principales en directo', 'No avanzar con bloqueos sobre nicho, oferta o implementación.', NULL, 4),
('launch-step-00-05', 'launch-section-00', 'Preparar una lista de dudas específicas', 'Convertir las dudas generales en preguntas accionables.', NULL, 5),
('launch-step-00-06', 'launch-section-00', 'Completar la primera tutoría 1 a 1', 'Validar que la base es suficiente para iniciar la investigación.', NULL, 6),

('launch-step-01-01', 'launch-section-01', 'Elegir un nicho con capacidad económica', 'Debe tener clientes de valor y capacidad real de inversión.', NULL, 1),
('launch-step-01-02', 'launch-section-01', 'Validar que el nicho tiene flujo constante de leads', 'Comprobar que existe un problema comercial recurrente.', NULL, 2),
('launch-step-01-03', 'launch-section-01', 'Identificar procesos repetitivos automatizables', 'Priorizar problemas que la IA pueda resolver de forma medible.', NULL, 3),
('launch-step-01-04', 'launch-section-01', 'Definir un micronicho específico', 'Evitar categorías amplias y describir el segmento con precisión.', NULL, 4),
('launch-step-01-05', 'launch-section-01', 'Investigar profundamente al avatar con Claude', 'Documentar contexto, comportamiento y lenguaje del cliente ideal.', NULL, 5),
('launch-step-01-06', 'launch-section-01', 'Documentar dolores y costes del problema', 'Incluir consecuencias económicas y operativas.', NULL, 6),
('launch-step-01-07', 'launch-section-01', 'Documentar deseos y resultados esperados', 'Expresar el cambio que el avatar quiere conseguir.', NULL, 7),
('launch-step-01-08', 'launch-section-01', 'Documentar objeciones de compra', 'Precio, confianza, tiempo, tecnología y riesgo percibido.', NULL, 8),
('launch-step-01-09', 'launch-section-01', 'Localizar competidores del micronicho', 'Buscar agencias y proveedores que ya vendan automatización.', NULL, 9),
('launch-step-01-10', 'launch-section-01', 'Analizar propuestas y discurso de la competencia', 'Comparar promesas, mecanismos, ofertas y llamadas a la acción.', NULL, 10),
('launch-step-01-11', 'launch-section-01', 'Detectar debilidades y huecos de mercado', 'Definir en qué puede diferenciarse la agencia.', NULL, 11),
('launch-step-01-12', 'launch-section-01', 'Analizar Instagram de la competencia', 'Revisar dolores, hooks, desarrollo, deseos, CTA, servicios y lead magnets.', NULL, 12),
('launch-step-01-13', 'launch-section-01', 'Revisar anuncios activos en Meta Ads Library', 'Identificar ángulos, ofertas y creatividades que el mercado está utilizando.', 'https://www.facebook.com/ads/library/', 13),

('launch-step-02-01', 'launch-section-02', 'Redactar la Propuesta Única de Valor', 'Formato: Ayudo a [micronicho] a [resultado] mediante [mecanismo IA], sin [objeción].', NULL, 1),
('launch-step-02-02', 'launch-section-02', 'Vincular la PUV a un resultado económico', 'La promesa debe hablar de ingresos, ahorro, citas o ventas.', NULL, 2),
('launch-step-02-03', 'launch-section-02', 'Definir el mecanismo IA de la solución', 'Explicar cómo se obtiene el resultado sin caer en tecnicismos.', NULL, 3),
('launch-step-02-04', 'launch-section-02', 'Diseñar una oferta irresistible de bajo riesgo', 'Elegir auditoría, simulación, prueba o implementación condicionada.', NULL, 4),
('launch-step-02-05', 'launch-section-02', 'Definir setup, mantenimiento y límites del servicio', 'Aclarar qué incluye, qué no incluye y cómo se cobra.', NULL, 5),
('launch-step-02-06', 'launch-section-02', 'Crear un lead magnet alineado al dolor principal', 'Checklist, guía, mini auditoría o vídeo específico del micronicho.', 'https://campus.mkthackers.com/cursos/masterclass-meta-ads-principiante-y-avanzado-viernes-15-hs/lecciones/08-05-2026-lead-magnets/', 6),
('launch-step-02-07', 'launch-section-02', 'Preparar la entrega automática del lead magnet', 'Definir formulario, confirmación y siguiente llamada a la acción.', NULL, 7),

('launch-step-03-01', 'launch-section-03', 'Montar el funnel o sitio web', 'Crear la estructura principal de captación.', 'https://campus.mkthackers.com/cursos/paso-3-fast-trak/lecciones/crea-tu-agencia-con-ia-studio-en-ghl/', 1),
('launch-step-03-02', 'launch-section-03', 'Escribir una headline con beneficio claro', 'Debe indicar para quién es y qué resultado ofrece.', NULL, 2),
('launch-step-03-03', 'launch-section-03', 'Explicar el problema y agitar el dolor', 'Mostrar el coste de seguir sin resolverlo.', NULL, 3),
('launch-step-03-04', 'launch-section-03', 'Presentar la solución y el mecanismo', 'Conectar la solución con el resultado deseado.', NULL, 4),
('launch-step-03-05', 'launch-section-03', 'Añadir prueba o demostración', 'Vídeo, simulación, caso o ejemplo funcional.', NULL, 5),
('launch-step-03-06', 'launch-section-03', 'Conectar el CTA con formulario o agenda', 'Verificar el recorrido completo del lead.', NULL, 6),
('launch-step-03-07', 'launch-section-03', 'Configurar calendario en GHL o Calendly', 'Definir disponibilidad y preguntas de cualificación.', 'https://campus.mkthackers.com/cursos/paso-3-fast-trak/lecciones/calendario-pro-agenda-profesional/', 7),
('launch-step-03-08', 'launch-section-03', 'Configurar confirmación y recordatorios', 'Confirmación inmediata, recordatorio 24 h antes y 1 h antes.', NULL, 8),
('launch-step-03-09', 'launch-section-03', 'Crear secuencia educativa pre-llamada', 'Preparar al lead y elevar su nivel de conciencia.', 'https://campus.mkthackers.com/cursos/paso-3-fast-trak/lecciones/automatizaciones-simples-que-hacen-el-trabajo-por-ti/', 9),
('launch-step-03-10', 'launch-section-03', 'Crear seguimiento post-llamada y no-show', 'Automatizar el mensaje posterior y la recuperación de ausencias.', NULL, 10),
('launch-step-03-11', 'launch-section-03', 'Automatizar comentarios y mensajes directos', 'Responder comentarios e iniciar conversación por DM.', 'https://campus.mkthackers.com/cursos/masterclass-mkt-digital-avanzado/lecciones/20-04-2026-ecosistema-pre-venta-organico-pt-2-lm-agentes-ia-ghl/', 11),
('launch-step-03-12', 'launch-section-03', 'Configurar el agente IA de preventa', 'Probar respuestas, cualificación y derivación a agenda.', NULL, 12),
('launch-step-03-13', 'launch-section-03', 'Preparar el documento de propuesta', 'Incluir diagnóstico, solución, alcance, plazos, mantenimiento y precio.', 'https://campus.mkthackers.com/cursos/paso-3-fast-trak/lecciones/propuesta-irresistible-en-pdf-hecha-con-ia/', 13),
('launch-step-03-14', 'launch-section-03', 'Probar el recorrido completo como un lead', 'Formulario, mensajes, agenda, recordatorios y seguimiento.', NULL, 14),

('launch-step-04-01', 'launch-section-04', 'Crear una foto de perfil profesional', 'Debe ser reconocible y coherente con la marca.', NULL, 1),
('launch-step-04-02', 'launch-section-04', 'Optimizar el nombre del perfil con el nicho', 'Facilitar que el cliente ideal entienda de inmediato la especialidad.', NULL, 2),
('launch-step-04-03', 'launch-section-04', 'Escribir una bio centrada en resultado', 'Incluir promesa, público y llamada a la acción.', NULL, 3),
('launch-step-04-04', 'launch-section-04', 'Añadir enlaces a WhatsApp, calendario y funnel', 'Comprobar que todos los enlaces funcionan.', NULL, 4),
('launch-step-04-05', 'launch-section-04', 'Publicar entre 9 y 12 contenidos iniciales', 'El objetivo inicial es confianza y coherencia, no viralidad.', 'https://campus.mkthackers.com/cursos/masterclass-mkt-digital-avanzado/lecciones/27-04-2026-optimizacion-perfil-estrategia-contenido/', 5),
('launch-step-04-06', 'launch-section-04', 'Explicar el problema que resuelve la agencia', 'Crear al menos una publicación específica.', NULL, 6),
('launch-step-04-07', 'launch-section-04', 'Explicar qué es un agente de IA', 'Traducirlo a beneficios comprensibles para el micronicho.', NULL, 7),
('launch-step-04-08', 'launch-section-04', 'Publicar errores comunes y beneficios económicos', 'Mostrar oportunidades concretas del sector.', NULL, 8),
('launch-step-04-09', 'launch-section-04', 'Publicar quiénes somos y cómo trabajamos', 'Construir confianza antes de iniciar outreach.', NULL, 9),
('launch-step-04-10', 'launch-section-04', 'Preparar carruseles educativos', 'Usar Claude para estructurar las piezas.', NULL, 10),
('launch-step-04-11', 'launch-section-04', 'Preparar reels de problema y llamada a la acción', 'Crear contenido que eduque y conduzca al siguiente paso.', 'https://campus.mkthackers.com/cursos/masterclass-mkt-digital-avanzado/lecciones/11-05-2026-creacion-de-videos-con-y-sin-ia/', 11),
('launch-step-04-12', 'launch-section-04', 'Mover seguidores del perfil personal al comercial', 'Hacer una transición gradual y contextualizada.', NULL, 12),
('launch-step-04-13', 'launch-section-04', 'Iniciar interacción orgánica con el micronicho', 'Follow estratégico, comentarios e interacción relevante.', NULL, 13),
('launch-step-04-14', 'launch-section-04', 'Preparar y usar un script de apertura por DM', 'Mantener un máximo progresivo de 30-50 cuentas nuevas al día.', NULL, 14),

('launch-step-05-01', 'launch-section-05', 'Completar la clase de prospección activa', 'Preparar el sistema antes de aumentar el volumen.', 'https://campus.mkthackers.com/cursos/crea-tu-propia-agencia-de-ia/lecciones/prospeccion-activa-inteligente/', 1),
('launch-step-05-02', 'launch-section-05', 'Preparar los scripts oficiales de contacto', 'Crear variantes y registrar qué enfoque funciona mejor.', NULL, 2),
('launch-step-05-03', 'launch-section-05', 'Crear el registro de prospectos y seguimiento', 'Usar CRM o una hoja con contacto, estado y próxima acción.', NULL, 3),
('launch-step-05-04', 'launch-section-05', 'Contactar un mínimo de 30 prospectos diarios', 'Mantener el hábito en paralelo al resto del lanzamiento.', NULL, 4),
('launch-step-05-05', 'launch-section-05', 'Hacer seguimiento cada 48-72 horas', 'Cada seguimiento debe aportar contexto o valor.', NULL, 5),
('launch-step-05-06', 'launch-section-05', 'Mantener y revisar conversaciones abiertas', 'Cerrar cada jornada con una próxima acción definida.', NULL, 6),

('launch-step-06-01', 'launch-section-06', 'Validar la oferta antes de invertir en publicidad', 'No activar campañas hasta confirmar mensaje, oferta y recorrido.', NULL, 1),
('launch-step-06-02', 'launch-section-06', 'Crear la página de Facebook', 'Completar identidad, información y permisos.', NULL, 2),
('launch-step-06-03', 'launch-section-06', 'Vincular Facebook con Instagram', 'Comprobar que ambos activos aparecen en Business Manager.', NULL, 3),
('launch-step-06-04', 'launch-section-06', 'Configurar Business Manager y Ads Manager', 'Asignar activos, personas y permisos correctos.', 'https://business.facebook.com/', 4),
('launch-step-06-05', 'launch-section-06', 'Añadir y verificar el método de pago', 'Evitar bloqueos antes del lanzamiento.', NULL, 5),
('launch-step-06-06', 'launch-section-06', 'Instalar y verificar el píxel de Meta', 'Comprobar eventos y conversiones del funnel.', NULL, 6),
('launch-step-06-07', 'launch-section-06', 'Crear campaña TOFU de tráfico a Instagram', 'Presupuesto inicial orientativo: 3 € al día.', NULL, 7),
('launch-step-06-08', 'launch-section-06', 'Crear campaña MOFU de captación', 'Formulario o funnel web; presupuesto inicial orientativo: 10 € al día.', NULL, 8),
('launch-step-06-09', 'launch-section-06', 'Crear campaña BOFU de retargeting', 'Conversión a mensajes o agenda; presupuesto inicial orientativo: 3 € al día.', NULL, 9),
('launch-step-06-10', 'launch-section-06', 'Definir modelo largo o modelo directo', 'Elegir tres campañas o eliminar TOFU según la estrategia.', NULL, 10),
('launch-step-06-11', 'launch-section-06', 'Revisar CPM, CTR y CPC', 'Cambiar creatividad si el CTR queda por debajo del 1%.', NULL, 11),
('launch-step-06-12', 'launch-section-06', 'Controlar frecuencia y fatiga creativa', 'Renovar anuncios cuando suba la frecuencia y caiga el rendimiento.', NULL, 12),
('launch-step-06-13', 'launch-section-06', 'Medir la conversión de la landing', 'Referencia: menos del 10% débil; 15-25% correcto; más del 30% muy bueno.', NULL, 13),
('launch-step-06-14', 'launch-section-06', 'Medir calidad de lead y coste por cita', 'Revisar respuesta, agenda, show rate y compra.', NULL, 14),
('launch-step-06-15', 'launch-section-06', 'Medir conversión a venta y ROAS', 'Relacionar inversión con ingresos reales, no solo con leads.', NULL, 15),

('launch-step-07-01', 'launch-section-07', 'Establecer 30 nuevos contactos diarios', 'Bloquear un horario fijo para prospección.', NULL, 1),
('launch-step-07-02', 'launch-section-07', 'Establecer seguimiento activo diario', 'Revisar conversaciones y próximas acciones.', NULL, 2),
('launch-step-07-03', 'launch-section-07', 'Publicar un mínimo de 3 veces por semana', 'Mantener constancia entre contenido educativo y captación.', NULL, 3),
('launch-step-07-04', 'launch-section-07', 'Mejorar periódicamente el guion de ventas', 'Registrar objeciones y actualizar respuestas.', NULL, 4),
('launch-step-07-05', 'launch-section-07', 'Estudiar entre 30 y 60 minutos al día', 'Convertir el aprendizaje en una mejora concreta del sistema.', NULL, 5),
('launch-step-07-06', 'launch-section-07', 'Hacer networking semanal', 'Crear relaciones con potenciales socios, clientes y referentes.', NULL, 6),

('launch-step-08-01', 'launch-section-08', 'Completar la segunda tutoría 1 a 1', 'Validar todo lo construido antes de lanzar campañas.', NULL, 1),
('launch-step-08-02', 'launch-section-08', 'Aplicar las correcciones previas al lanzamiento', 'Corregir nicho, oferta, funnel, perfil o seguimiento.', NULL, 2),
('launch-step-08-03', 'launch-section-08', 'Lanzar y medir durante 30 días', 'Evitar cambios impulsivos sin datos suficientes.', NULL, 3),
('launch-step-08-04', 'launch-section-08', 'Completar la tercera tutoría 1 a 1', 'Revisar campañas y cuellos de botella con datos reales.', NULL, 4),
('launch-step-08-05', 'launch-section-08', 'Optimizar mensaje, creatividades y conversiones', 'Priorizar el cuello de botella de mayor impacto.', NULL, 5),
('launch-step-08-06', 'launch-section-08', 'Escalar lo que ya está validado', 'Aumentar volumen o presupuesto solo cuando el sistema sea rentable.', NULL, 6);
