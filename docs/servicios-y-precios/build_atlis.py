from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.lib.enums import TA_LEFT
import json
ROOT=Path('/Users/nicozuco/Desktop/X/01_Proyectos activos')
OUT=ROOT/'output/pdf/ATLIS_servicios_precios_y_captacion_clinicas.pdf'
F=ROOT/'ATLIS WEB/dist/assets'
for name,filename in [('Inter','inter-400.ttf'),('InterB','inter-600.ttf'),('Manrope','manrope-700.ttf')]:
 pdfmetrics.registerFont(TTFont(name,str(F/filename)))
pdfmetrics.registerFontFamily('Inter',normal='Inter',bold='InterB',italic='Inter',boldItalic='InterB')
INK=HexColor('#142D30'); TEAL=HexColor('#007A76'); PETROL=HexColor('#102F32'); MINT=HexColor('#E1F5EF'); LIGHT=HexColor('#F7FAF9'); GRAY=HexColor('#4D6467'); BORDER=HexColor('#D7E5E1')
logo=ROOT/'AGENCIA IA/test landing - copia de seguridad 2026-09-16 09.05.28/assets/atlis-logo-48a46749.png'
icon=ROOT/'AGENCIA IA/test landing - copia de seguridad 2026-09-16 16.12.22/assets/atlis-icon.png'
S={
 'body':ParagraphStyle('body',fontName='Inter',fontSize=10.3,leading=15,textColor=INK,spaceAfter=9),
 'small':ParagraphStyle('small',fontName='Inter',fontSize=8.3,leading=11.7,textColor=GRAY,spaceAfter=6),
 'h1':ParagraphStyle('h1',fontName='Manrope',fontSize=25,leading=30,textColor=INK,spaceAfter=16),
 'h2':ParagraphStyle('h2',fontName='Manrope',fontSize=13,leading=18,textColor=TEAL,spaceBefore=8,spaceAfter=7),
 'tag':ParagraphStyle('tag',fontName='InterB',fontSize=8.2,leading=12,textColor=TEAL,spaceAfter=8),
 'cell':ParagraphStyle('cell',fontName='Inter',fontSize=9.1,leading=12.6,textColor=INK),
 'th':ParagraphStyle('th',fontName='InterB',fontSize=8.5,leading=11.7,textColor=white),
 'quote':ParagraphStyle('quote',fontName='Manrope',fontSize=14,leading=20,textColor=PETROL,spaceAfter=8),
}
PAGES=[]
def page(tag,title):
 d={'tag':tag,'title':title,'blocks':[]}; PAGES.append(d); return d['blocks']
def p(b,t): b.append(('p',t))
def h(b,t): b.append(('h',t))
def note(b,t): b.append(('note',t))
def q(b,t): b.append(('q',t))
def bullets(b,items):
 for x in items:b.append(('p','<b>•</b> '+x))
def table(b,headers,rows,widths):b.append(('table',headers,rows,widths))

b=page('GUÍA DE USO','Qué contiene este dossier')
p(b,'Una propuesta de catálogo y venta para Atlis, especializada en clínicas dentales y de estética en España. Une el prompt maestro con los materiales locales de MKT Hackers y convierte esas ideas en servicios con límites, precios y una forma concreta de presentarlos.')
q(b,'La recomendación de partida: vender un proceso útil, entregarlo bien y ampliarlo con datos.')
table(b,['Bloque','Páginas','Para qué usarlo'],[
['Oferta y servicios','3-8','Elegir qué resolver y qué entregar.'],['Precios y condiciones','9-14','Preparar un presupuesto defendible.'],['Entrega y seguimiento','15-16','Implantar, medir y mantener.'],['Conversación comercial','17-21','Abrir interés, responder y presentar la propuesta.'],['Aplicación y fuentes','22-24','Priorizar el trabajo y comprobar el origen.']],[117,64,314])
h(b,'Tres niveles de información')
p(b,'<b>Base de marca:</b> servicios y criterios presentes en el prompt maestro. Describe la intención de Atlis; no acredita integraciones ya probadas ni resultados de clientes.')
p(b,'<b>Referencia del curso:</b> ejemplos de los formadores. No son tarifas oficiales de Atlis ni un estudio de mercado actualizado.')
p(b,'<b>Propuesta Atlis:</b> precios, packs, plazos y límites diseñados aquí para decidir internamente. Requieren validar costes y capacidad antes de ofrecerlos.')
note(b,'Alcance real: revisión de la guía unificada, índices, apuntes relevantes y síntesis de tutorías del archivo local. Hay 107 archivos de apuntes y 51 transcripciones, con cobertura desigual. No se han visionado en esta tarea las 545 entradas que declara el inventario del campus; varias categorías y lecciones siguen incompletas. El dossier no se presenta como revisión íntegra de todos los vídeos.')

b=page('01 / POSICIONAMIENTO','Lo que vende Atlis')
q(b,'Más consultas que avanzan. Menos tareas que te frenan.')
p(b,'Atlis conecta atención, agenda y seguimiento para aprovechar mejor las consultas que una clínica ya recibe. La tecnología sirve al proceso; el equipo conserva las decisiones clínicas y el control de la relación con el paciente.')
table(b,['Situación que validar','Servicio que encaja','Qué se mide'],[
['Mensajes fuera de horario','Asistente administrativo','Tiempo hasta respuesta útil; solicitudes recogidas.'],['Recepción saturada','FAQs y derivación con contexto','Tareas resueltas; intervenciones del equipo.'],['Citas que se pierden','Confirmación y recordatorios','Asistencia, cancelación y reprogramación.'],['Presupuestos pendientes','Seguimiento administrativo','Respuestas y revisiones solicitadas.'],['Pacientes que no vuelven','Reactivación autorizada','Citas obtenidas y asistencia.'],['Web poco clara','Web o landing','Consultas válidas por visita.'],['Capacidad sin demanda','Publicidad conectada al sistema','Coste por cita asistida y tratamiento.']],[145,154,196])
h(b,'Por dónde empezar')
p(b,'Si hay consultas suficientes y se quedan sin atender, priorizar respuesta y seguimiento. Si la web impide solicitar cita, corregir ese paso. Si el proceso ya funciona y queda capacidad, probar captación pagada. No presupuestar una web nueva si basta con mejorar la existente.')
note(b,'Base: prompt maestro, §§1-4; MKT Hackers, módulos 3, 6, 8 y 10; tutorías sobre mantener la web y el CRM cuando ya sirven.')

b=page('02 / DISEÑO WEB','Una web que facilite consultar')
p(b,'Diseño y mensajes adaptados a la clínica, lectura cómoda en móvil, llamadas a la acción claras y formularios que lleguen a la persona adecuada. El servicio se entrega con pruebas del recorrido completo.')
table(b,['Propuesta','Landing clínica','Web clínica'],[
['Precio inicial','700 €','1.500 €'],['Alcance','1 página, hasta 7 secciones, 1 especialidad.','Hasta 5 páginas, 1 idioma y 1 sede.'],['Contenido','Redacción a partir del material aprobado por la clínica.','Estructura, redacción y hasta 2 páginas de especialidad dentro de las 5.'],['Conversión','1 formulario y botón de WhatsApp.','Formularios, WhatsApp y navegación por servicios.'],['SEO técnico','Títulos, descripción, indexación y rendimiento básico.','Lo anterior más sitemap y datos estructurados pertinentes.'],['Revisión','2 rondas consolidadas.','2 rondas consolidadas.'],['Plazo propuesto','7-10 días laborables.','15-20 días laborables.'],['Mantenimiento opcional','49 €/mes.','79 €/mes.']],[100,195,200])
p(b,'Incluye insertar los textos legales facilitados o validados por la clínica y configurar el consentimiento cuando proceda. La revisión jurídica, fotografías, identidad nueva, traducciones, comercio electrónico y posicionamiento SEO continuado se presupuestan aparte.')
p(b,'<b>Chat con IA y agenda:</b> insertar un widget ya contratado entra si es compatible; construir el asistente o desarrollar una conexión no está incluido en el precio web. Hosting, dominio y licencias se detallan aparte.')
note(b,'Importes propuestos, sin impuestos aplicables. Plazos desde recepción de contenido y accesos completos. El mantenimiento se concreta en la página 13. El curso muestra otros importes: véanse páginas 9-10.')

b=page('03 / RESPONDER','Asistente administrativo con IA')
q(b,'La clínica cierra. La conversación puede empezar.')
p(b,'Un asistente de texto en WhatsApp <b>o</b> en el chat web: responde con información aprobada, recoge solicitudes y deja a recepción el contexto para continuar. La disponibilidad automática no equivale a soporte humano de Atlis las 24 horas.')
table(b,['Puesta en marcha · 1.200 €','Servicio mensual · 300 €'],[
['Mapa del proceso y definición de un objetivo.','Revisión de funcionamiento y avisos de fallos.'],['Base de conocimiento: hasta 30 FAQs administrativas.','Actualización de FAQs, horarios y mensajes aprobados.'],['1 canal, 1 sede, 1 idioma y 1 ruta de derivación.','Revisión de una muestra acordada de conversaciones.'],['Recogida de datos mínimos y solicitud de cita.','Informe mensual y reunión de 20 minutos.'],['1 conexión estándar validada a registro o agenda.','Hasta 2 horas/mes de ajustes menores y soporte ordinario.'],['Pruebas, formación de 60 min y guía breve.','Licencias y consumos facturados aparte.']],[247,248])
h(b,'Límites que deben quedar claros')
p(b,'Por defecto, <b>recepción confirma la cita</b>. La reserva automática solo se oferta después de validar disponibilidad, reglas, permisos y pruebas. Si la integración no es viable, se pacta una cola de solicitudes, sin anunciar una agenda conectada.')
p(b,'El asistente no diagnostica, recomienda tratamientos, interpreta síntomas ni decide importes clínicos. Las dudas clínicas, urgencias, quejas o peticiones de hablar con una persona siguen el protocolo aprobado por la clínica.')
p(b,'<b>Segundo canal compatible:</b> propuesta de 250 € de configuración + 50 €/mes. Reutiliza la misma base; una lógica nueva, otro idioma o una sede adicional requieren presupuesto.')
note(b,'Plazo propuesto: 10-15 días laborables tras validar integración, accesos e información. Verificaciones de terceros pueden ampliarlo. Precio de partida inspirado en M8-C; alcance creado para Atlis.')

b=page('04 / CONTINUAR','Seguimiento, citas y presupuestos')
p(b,'Cada automatización debe tener un desencadenante, una acción y una condición de parada. Empezar con el proceso donde haya más tareas pendientes y datos suficientes para medir una mejora.')
table(b,['Proceso','Entrega delimitada','Condición de parada'],[
['Consulta sin completar','Hasta 3 mensajes acordados y aviso a recepción.','Respuesta, cita, rechazo, baja o intervención humana.'],['Recordatorios de cita','Confirmación y hasta 2 recordatorios desde una fuente de agenda fiable.','Cancelación, cambio de fecha o cita completada.'],['Presupuesto pendiente','Hasta 3 contactos administrativos; registrar interés y dudas.','Decisión del paciente o derivación al profesional.'],['Reactivación / revisión','1 segmento autorizado, 1 campaña o regla de revisión.','Respuesta, cita, baja o criterio de exclusión.'],['Preparación de presupuesto','Borrador desde conceptos y tarifas aprobados; validación humana.','Nunca enviar o modificar una decisión clínica sin aprobación.']],[125,224,146])
h(b,'Cómo presupuestarlo')
p(b,'<b>Sobre un asistente Atlis activo:</b> 350 € de instalación + 75 €/mes por proceso simple. <b>Como servicio independiente:</b> desde 650 € + 100 €/mes por proceso, si ya existe infraestructura compatible. La preparación documental compleja se cotiza a medida.')
p(b,'Un proceso simple conecta una fuente con un destino, sin migración histórica ni código a medida. Incluye diseño, hasta 3 mensajes, pruebas de parada y control mensual. La ampliación suma hasta 30 minutos/mes de ajustes. Licencias, mensajes y una infraestructura nueva van aparte.')
note(b,'Estas funciones no se suman dos veces: un pack que incluya dos procesos ya incluye sus altas y cuotas. Para reactivación se revisan permisos y finalidad antes de cargar la lista. Una consulta administrativa también puede contener información sensible.')

b=page('05 / CONECTAR','Automatización e integraciones')
p(b,'El CRM y las automatizaciones ordenan lo que pasa entre la primera consulta y el siguiente paso. Deben convivir con el software de la clínica siempre que sea posible.')
table(b,['Proyecto','Entregables posibles','Precio propuesto'],[
['Organización de solicitudes','Pipeline de hasta 6 etapas, responsables y avisos; sin historia clínica.','750-1.200 € + 100-150 €/mes.'],['Integración simple','1 origen, 1 destino, campos definidos, control de errores y duplicados.','750-1.500 € + 100-150 €/mes.'],['Flujo de complejidad media','Varios estados, 2-3 sistemas y reglas de negocio acordadas.','2.500-5.000 € + 200-400 €/mes.'],['Panel de seguimiento','Hasta 5 indicadores sobre datos disponibles y fiables.','500-900 € + 50-100 €/mes.']],[114,230,151])
h(b,'Antes de dar un precio cerrado')
bullets(b,['Comprobar qué permite realmente la API: leer, crear, cambiar y cancelar; costes o permisos del proveedor.','Definir qué sistema manda sobre cada dato y evitar agendas paralelas.','Acordar reintentos, alertas, trazabilidad y recuperación manual si falla la conexión.','Evaluar accesos, proveedores, conservación y tratamiento antes de usar datos de pacientes.'])
p(b,'<b>Posible ampliación futura:</b> agentes de voz, redes y contenido aparecen en la formación, pero no son las tres líneas principales del prompt maestro. No incluirlos como capacidad disponible hasta tener demo, pruebas, soporte y costes validados.')
note(b,'Rangos propuestos a partir de M1-L7 y M11; no acreditan implementaciones previas de Atlis. Si el CRM o el panel ya forma parte del alcance del asistente, no cobrarlo de nuevo.')

b=page('06 / CAPTAR','Publicidad conectada a la atención')
p(b,'La gestión de campañas busca consultas que la clínica pueda atender. Antes de activar anuncios, revisar capacidad, destino del contacto, respuesta, seguimiento y medición.')
table(b,['Propuesta de partida','Alcance'],[
['Configuración inicial · 350 €','Auditoría, objetivo, estructura, conversiones técnicamente viables y lanzamiento.'],['Gestión · 350 €/mes','1 plataforma, 1 sede, 1 línea de servicio y hasta 2 campañas. Para inversión de hasta 1.500 €/mes.'],['Contenido de campaña','Hasta 3 creatividades estáticas iniciales y 2 variantes mensuales; textos incluidos, material aprobado por la clínica.'],['Revisión','Optimización semanal, resumen breve semanal el primer mes e informe mensual.'],['Presupuesto de medios','Lo paga la clínica directamente a la plataforma. No está incluido en los 350 €/mes.']],[159,336])
h(b,'Elección del canal')
p(b,'Google puede encajar cuando la búsqueda expresa una necesidad concreta; Meta puede servir para presentar una valoración o servicio a una audiencia adecuada. Elegir después de revisar demanda, restricciones del servicio, recursos creativos y capacidad de respuesta. No prometer resultados iguales para ambos.')
p(b,'<b>Fuera del paquete:</b> landing nueva, asistente, vídeo, sesiones de fotos, una segunda plataforma, SEO, gestión de redes y campañas adicionales. Por encima del gasto o alcance fijado, presupuesto nuevo antes de ampliar.')
p(b,'<b>Protección del proceso:</b> textos clínicos aprobados por la clínica; no transmitir diagnósticos, tratamientos u otros datos sensibles a herramientas publicitarias. Revisar políticas y configuración antes del lanzamiento.')
note(b,'Precio y límites propuestos. No se adopta la garantía docente de leads en 14 días ni la promesa de recuperar la inversión. M8-B separa configuración, gestión y gasto publicitario.')

b=page('07 / FUENTES DE PRECIOS','Las cifras del módulo 8')
p(b,'Sí: el bloque <b>«Define y empaqueta» del módulo 8</b> contiene los ejemplos más directos para las tres líneas de Atlis. El módulo 7 se centra en presencia digital y contenido.')
table(b,['Lección','Ejemplo mostrado','Alcance indicado'],[
['Tema A · Web','397 € landing; 897 € web completa.','Landing exprés en 48 h; web hasta 5 páginas, SEO básico y 1 mes de soporte.'],['Tema B · Publicidad','297 € inicial + 15 % del gasto; mínimo 200 €/mes.','Auditoría, estrategia, campaña, optimización y reportes semanales.'],['Tema C · Agentes IA','1.200 € inicial + 300 €/mes.','Configuración, entrenamiento, integración, monitorización, ajustes y soporte.'],['Tema D · Propuesta','Sin tarifa universal.','Problema, solución, precio, reducción de riesgo y siguiente paso.']],[113,161,221])
h(b,'Qué no trasladar automáticamente')
p(b,'La clase plantea plazos rápidos, descuentos y garantías como recursos comerciales. Atlis no debe convertir una landing en 48 horas o una puesta en marcha en 5 días en compromiso general sin disponer de accesos, contenidos y capacidad.')
p(b,'El porcentaje de anuncios tiene un mínimo: con 1.000 € de gasto, el 15 % son 150 €, pero se cobrarían 200 € de gestión en el ejemplo docente. El gasto publicitario continúa aparte.')
p(b,'El precio ilustrativo de 3.900 € en la lección de estructura de reunión corresponde a un ejemplo de venta. No es una tarifa estándar del curso para cualquier automatización.')
note(b,'Fuentes directas: M8, Define y empaqueta, temas A-D; M8, Vender, tema 3. Son apuntes visuales con transcripción hablada pendiente, no tarifas de mercado verificadas.')

b=page('08 / OTRAS REFERENCIAS','Rangos del curso y las tutorías')
table(b,['Servicio','Referencia docente','Fuente'],[
['Chat IA','500-5.000 € inicial; 90-800 €/mes.','M1-L7'],['Referencia recurrente','1.500 € inicial; 90-300 €/mes.','M2-L2'],['Landing','600-1.500 €; inicio 400-700 €. Mantenimiento desde 30 €/mes.','M1-L7'],['Web corporativa','1.500-3.000 €; inicio 700-1.200 € para unas 5-10 páginas.','M1-L7'],['Gestión de publicidad','200-500 €/mes pequeña empresa; 500-1.200 € mediana. Setup 300-1.200 €.','M1-L7'],['Automatización','Simple: 750-1.500 €. Media: 2.500-5.000 €.','M1-L7'],['Web básica / agente','Web ≈500 €; agente simple 1.000-1.200 €; completo desde 1.500 €.','Tutorías, síntesis'],['Voz','Setup inicial 1.000-2.000 € + 100-150 €/mes con consumo aparte.','M1-L7'],['Voz + texto','≈3.000 € inicial; puede subir con integraciones.','Tutorías, síntesis'],['Contenido y redes','300-700 €/mes; hasta 1.500 € con mucho vídeo.','M1-L7'],['Otros servicios del curso','Tienda 2.500-6.000 €; desarrollo a medida desde 4.000 €.','M1-L7']],[125,292,78])
p(b,'Los modelos de voz gestionada con cuotas de 700-3.500 €/mes y los planes de chat de 299/599/1.499 € también aparecen en M1-L7, pero sus alcances no están suficientemente detallados para compararlos con el mantenimiento básico.')
note(b,'No mezclar referencias de clases distintas como si fueran un único tarifario. Voz, redes, tiendas y software se incluyen aquí para completar el mapa formativo; no se añaden al catálogo principal de Atlis. La cifra de IA avanzada poco legible se excluye.')

b=page('09 / TARIFARIO PROPUESTO','Una base clara para presupuestar')
p(b,'Precios diseñados para una primera versión comercial con alcance limitado. No son precios oficiales aprobados de Atlis. Todas las cantidades excluyen impuestos aplicables, consumos y servicios de terceros.')
table(b,['Servicio','Inicio','Mensual','Condición'],[
['Auditoría inicial breve','0 €','-','20-30 min; detectar un proceso.'],['Landing clínica','700 €','49 € opc.','1 página; mantenimiento opcional.'],['Web clínica','1.500 €','79 € opc.','Hasta 5 páginas.'],['Asistente administrativo','1.200 €','300 €','1 canal, sede e idioma.'],['Segundo canal','250 €','50 €','Misma lógica y base de información.'],['Proceso adicional','350 €','75 €','Sobre asistente Atlis activo.'],['Proceso independiente','Desde 650 €','Desde 100 €','Infraestructura ya disponible.'],['Gestión de anuncios','350 €','350 €','1 plataforma; gasto hasta 1.500 €/mes.'],['CRM / pipeline','750-1.200 €','100-150 €','Si no está incluido en otro servicio.'],['Integración simple','750-1.500 €','100-150 €','Alcance validado previamente.'],['Automatización media','2.500-5.000 €','200-400 €','Proyecto a medida.'],['Panel de indicadores','500-900 €','50-100 €','Fuentes disponibles; hasta 5 KPI.']],[180,81,84,150])
h(b,'Qué ofertaría primero')
p(b,'<b>Asistente administrativo: 1.200 € + 300 €/mes</b>, si el problema validado es la respuesta tardía. Si el problema está en citas o presupuestos, elegir ese proceso como entrada. El precio se sostiene con un alcance concreto y una demo que funcione.')
note(b,'Los precios «desde» no autorizan a prometer cualquier integración. Las cuotas de servicios a medida necesitan su propio anexo de soporte. El tarifario no incluye compromisos de disponibilidad ni cambios ilimitados.')

b=page('10 / PACKS','Combinar sin duplicar costes')
table(b,['Pack propuesto','Qué contiene','Inicio','Al mes'],[
['Atención','Asistente en 1 canal.','1.200 €','300 €'],['Continuidad','Asistente + 2 procesos simples a elegir: seguimiento, recordatorios o reactivación autorizada.','1.900 €','450 €'],['Presencia + Atención','Landing + mantenimiento de landing + asistente en 1 canal.','1.900 €','349 €'],['Sistema completo','Web hasta 5 páginas + mantenimiento + asistente + 2 procesos + gestión de anuncios.','3.750 €','879 €']],[102,237,78,78])
p(b,'<b>Cálculo del sistema completo:</b> 1.500 + 1.200 + 700 + 350 = 3.750 € de inicio. Cuota: 79 + 300 + 150 + 350 = 879 €/mes. No incluye inversión en medios, licencias ni consumos. No es un descuento artificial: suma entregables compatibles.')
h(b,'Cómo elegir el pack')
bullets(b,['<b>Atención:</b> consultas dispersas, fuera de horario o repetitivas.','<b>Continuidad:</b> además hay citas sin confirmar o presupuestos sin respuesta.','<b>Presencia + Atención:</b> la entrada digital necesita una landing y una respuesta posterior.','<b>Sistema completo:</b> solo si hay capacidad de ejecución, demanda contrastada y una persona responsable en la clínica. Implantar por fases.'])
p(b,'En Continuidad se incluyen hasta 3 horas/mes de ajustes y soporte ordinario: 2 del asistente y 0,5 por proceso. Si el cliente pasa de Atención a Continuidad, se presupuesta únicamente la ampliación: 700 € de inicio y 150 €/mes adicionales.')
note(b,'Todos los packs son propuestas internas. El completo conserva los límites de cada servicio. Una web existente útil se mantiene y se descuenta el módulo web correspondiente del presupuesto.')

b=page('11 / CONDICIONES','Qué cubre la cuota y qué va aparte')
table(b,['Concepto','Condición propuesta'],[
['Puesta en marcha','50 % al aceptar; 50 % al superar las pruebas de entrega, antes de activar.'],['Cuota mensual','Empieza al activar el servicio aceptado. Facturación mensual anticipada.'],['Mantenimiento web','Revisión de formulario y funcionamiento; hasta 30 min/mes en landing o 60 min/mes en web para cambios menores. Copias o versionado según plataforma.'],['Soporte ordinario','Un canal de soporte; primera respuesta en 1 día laborable. Horario propuesto: L-V, 09:00-18:00, España peninsular, salvo festivos.'],['Errores y cambios','Corregir defectos del alcance entregado sin consumir la bolsa de mejoras. Nuevas funciones, integraciones o rediseños se cotizan aparte.'],['Bolsa de ajustes','No acumulable. Si se agota, avisar y presupuestar antes de continuar; no cobrar extras sin acuerdo.'],['Salida','Propuesta sin permanencia mensual y con 30 días de preaviso. Acordar entrega, exportación y retirada de accesos.'],['Pruebas y formación','Aceptación escrita, guía de uso y responsable de recepción definido. No activar si falla una prueba crítica.']],[133,362])
p(b,'<b>Licencias y consumo:</b> distinguir plataforma, alojamiento, IA, WhatsApp/SMS, telefonía y medios publicitarios. Preferir titularidad de la clínica cuando sea viable. Si Atlis refactura un coste, especificar el margen o importe y los límites por escrito.')
p(b,'<b>Sin sorpresas:</b> presupuesto estimado de terceros, quién paga cada cuenta, umbrales de aviso y autorización de ampliaciones. No dar una cifra de consumo sin medir o estimar el volumen real.')
note(b,'Son condiciones comerciales propuestas, no un contrato jurídico. Deben encajar con la capacidad real del equipo y el acuerdo firmado. No se promete soporte 24/7 ni disponibilidad absoluta de terceros.')

b=page('12 / RENTABILIDAD','Poner precio sin perder margen')
p(b,'El curso propone cobrar instalación y recurrencia. Para Atlis, ambas partes deben cubrir trabajo real. Registrar horas de construcción, soporte, revisiones, gestión del cliente y coste de herramientas.')
q(b,'Precio mínimo = coste directo previsto / (1 - margen objetivo).')
p(b,'<b>Ejemplo interno, no dato real:</b> construir un asistente exige 18 horas a un coste interno de 30 €/h y 60 € de pruebas. Coste directo: 600 €. Un precio de 1.200 € deja 600 € de contribución, el 50 %, antes de estructura, captación e impuestos.')
table(b,['Ejemplo mensual a 300 €','Importe'],[
['3 horas reales de trabajo a 30 €/h','90 €'],['Herramientas imputadas al cliente, si las absorbe Atlis','40 €'],['Reserva operativa para incidencias','20 €'],['Coste directo previsto','150 €'],['Contribución antes de gastos generales','150 € / 50 %']],[365,130])
p(b,'Las 3 horas del ejemplo incluyen trabajo interno e informe, además de atención al cliente. Si las herramientas las paga directamente la clínica, no volver a descontarlas como coste de Atlis. Recalcular cuando el alcance o el consumo cambien.')
h(b,'Valorar el impacto con la clínica')
p(b,'Ejemplo ilustrativo: 10 primeras visitas adicionales que realmente asisten × 30 % de aceptación × 400 € de contribución por tratamiento = 1.200 € de contribución potencial. Restar cuota, consumos y amortización de la instalación; no usar facturación como si fuera beneficio.')
p(b,'Con 300 € de cuota + 50 € de consumo + 100 € de instalación amortizada a 12 meses, el coste de referencia sería 450 €/mes. A 120 € esperados por visita asistida, harían falta aproximadamente 4 visitas adicionales para cubrirlo. Son supuestos, no una previsión.')
note(b,'Evitar atribuir toda la mejora al sistema: comparar periodos equivalentes y considerar campañas, estacionalidad, capacidad y cambios del equipo. No sumar horas liberadas como ahorro de caja si no reducen un coste real.')

b=page('13 / ENTREGA','Del diagnóstico a la puesta en marcha')
table(b,['Fase','Trabajo de Atlis','Participación de la clínica'],[
['1. Diagnóstico','Detectar un cuello de botella; medir situación inicial y revisar compatibilidad.','Explicar volumen, agenda, canales y excepciones.'],['2. Propuesta','Alcance, precio, cuotas, consumos, hitos y criterio de aceptación.','Nombrar responsable y aprobar condiciones.'],['3. Preparación','Accesos limitados, entorno de pruebas y mapa de datos.','Entregar FAQs, horarios y reglas aprobadas.'],['4. Construcción','Montar un proceso; registrar decisiones y límites.','Revisar contenido y tono.'],['5. Validación','Pruebas normales y de excepción; corregir bloqueos.','Probar con recepción y autorizar activación.'],['6. Activación','Formación, arranque controlado y revisión inicial.','Usar la bandeja y notificar incidencias.'],['7. Revisión','Comparar indicadores y proponer siguiente mejora.','Aportar datos de asistencia y resultado.']],[87,209,199])
h(b,'Pruebas mínimas del asistente')
p(b,'20 conversaciones habituales y 5 casos límite como base de trabajo del curso: información desconocida, petición clínica, urgencia, queja y solicitud de una persona. Añadir parada de seguimientos, duplicados, cambio de cita, permisos y fallo de integración.')
p(b,'<b>Entrega aceptada:</b> información correcta; aviso de asistente IA; derivación recibida por la persona adecuada; citas sin duplicados; bajas respetadas; registro de errores; alternativa manual y documentación. Las pruebas usan datos ficticios.')
note(b,'M6 y M9 adaptados a Atlis. Los plazos empiezan con la información completa. Antes de datos reales, concretar responsabilidades de tratamiento, proveedores y medidas con la clínica y su asesoría.')

b=page('14 / RECURRENCIA','Qué mostrar cada mes')
p(b,'La cuota se defiende haciendo visible el trabajo y lo que cambia en el proceso. Un informe breve debe permitir a dirección entender qué funciona, qué falla y cuál es el siguiente paso.')
table(b,['Indicador','Definición útil'],[
['Respuesta','Mediana del tiempo hasta una respuesta útil; separar automatizada y humana.'],['Solicitudes atendidas','Consultas únicas con respuesta y siguiente paso registrado.'],['Cita confirmada','Confirmación real en la agenda oficial, no una intención del chat.'],['Asistencia','Citas asistidas / citas previstas, con tratamiento consistente de cancelaciones.'],['Seguimiento','Pendientes contactados, respuestas y decisiones; incluir bajas.'],['Aceptación','Presupuestos aceptados / presupuestos emitidos de una cohorte comparable.'],['Publicidad','Gasto por solicitud válida, por cita asistida y por tratamiento, si hay atribución.'],['Carga del equipo','Tiempo medido en una muestra de tareas antes y después.']],[129,366])
h(b,'Estructura de una revisión de 20 minutos')
p(b,'<b>5 min:</b> resumen y comparación con el punto de partida. <b>7 min:</b> incidencias, ajustes y resultados. <b>5 min:</b> qué explica los cambios. <b>3 min:</b> acordar una mejora y su responsable.')
p(b,'No presentar mensajes enviados como pacientes ganados. Si no se puede medir aceptación o asistencia, decirlo y resolver primero el acceso al dato. El informe puede usar cifras agregadas sin identificar pacientes.')
p(b,'Cuando haya un resultado verificable, documentar situación, intervención, periodo y limitaciones. Pedir autorización para publicar un caso o testimonio auténtico. No convertir una demo en un caso real.')
note(b,'Base: M10, informe mensual, retención y prueba social. Frecuencia y métricas son propuestas adaptadas; no se prometen incrementos porcentuales.')

b=page('15 / CONTACTO','Antes del correo: contexto y permiso')
p(b,'El objetivo inicial es que la persona reconozca un problema y quiera explorar una mejora. Investigar una clínica con detalle resulta más útil que enviar el catálogo entero a una lista indiscriminada.')
h(b,'La condición para usar email comercial en España')
p(b,'El artículo 21 de la LSSI prohíbe, como regla general, los correos promocionales no solicitados o no autorizados. Contempla una excepción por relación contractual previa para servicios propios similares, con requisitos. Un email público o un buzón <b>info@</b> no equivalen a permiso. Pedir autorización por email dentro de una propuesta comercial no evita por sí solo esa regla. Facilitar una baja tampoco legitima el primer envío.')
p(b,'Para Atlis, priorizar una presentación personal, un contacto en un evento o una solicitud de auditoría desde la web. En esa conversación, pedir y registrar permiso para enviar la propuesta por correo. Un conocido puede facilitar la presentación; no asumir que su recomendación autoriza todos los envíos.')
h(b,'Ficha de investigación de cada clínica')
bullets(b,['Especialidad, ciudad, sede y persona responsable, si consta públicamente.','Hecho observado y enlace: por ejemplo, hay formulario de primera visita o una página de implantes.','Hipótesis que validar: cómo se atiende esa solicitud fuera de horario. No afirmar que pierden pacientes.','Una idea de mejora y una demo de 2 minutos con datos ficticios.','Origen del contacto, solicitud o autorización, fecha, estado y próxima acción.'])
q(b,'En persona o tras una presentación: «Preparamos un ejemplo de cómo recoger consultas cuando recepción no está disponible. ¿Te interesa que te lo envíe por correo?»')
note(b,'Fuente legal: BOE, Ley 34/2002, arts. 20-22, texto consolidado consultado el 28/09/2026. Enlace en fuentes. La secuencia siguiente presupone solicitud o autorización y debe respetar su alcance. Los apuntes de M12 sobre correos públicos no bastan para justificar el envío.')

b=page('16 / PRIMER MENSAJE','Dos correos que abren conversación')
p(b,'Plantillas para contactos que han solicitado información o autorizado el envío. Cambiar los corchetes por datos comprobados. Una observación, una mejora y una sola pregunta.')
h(b,'Clínica dental · consultas fuera de horario')
q(b,'Asunto: [Clínica] · consultas fuera de horario')
p(b,'Hola, [nombre]:<br/><br/>Soy Nico, de Atlis. Como acordamos, te envío la idea para [clínica]. He visto que ofrecéis [servicio comprobado] y recibís consultas desde [canal comprobado].<br/><br/>Podemos preparar una respuesta inicial que recoja la solicitud cuando recepción no está disponible y deje el contexto para que vuestro equipo confirme la cita.<br/><br/>¿Te encaja que te envíe un vídeo de dos minutos con ese recorrido?<br/><br/>Nico · Atlis<br/>atlisclinicas.com')
h(b,'Clínica estética · seguimiento de valoraciones')
q(b,'Asunto: [Clínica] · seguimiento de valoraciones')
p(b,'Hola, [nombre]:<br/><br/>Gracias por pedirme información. He visto vuestra página de [servicio comprobado]. La idea que propongo revisar es qué ocurre después de una consulta que no termina en valoración.<br/><br/>Atlis puede organizar el seguimiento administrativo y avisar al equipo cuando la persona responde, manteniendo las decisiones clínicas en vuestras manos.<br/><br/>¿Ese seguimiento os ocupa tiempo ahora?<br/><br/>Nico · Atlis<br/>atlisclinicas.com')
note(b,'Añadir firma con identidad real del responsable comercial y un medio válido de oposición, por ejemplo: «Si prefieres no recibir más información de Atlis, responde “no”». No usar «como acordamos» o «gracias por pedirme» si no ocurrió. Si pidió directamente el vídeo, enviarlo sin pedir otro permiso para lo mismo.')

b=page('17 / SEGUIMIENTO','Cada correo debe aportar algo')
p(b,'Cadencia propuesta para una conversación autorizada: primer mensaje y hasta dos seguimientos. Adaptarla a lo que la clínica haya pedido. Si responde, detener la secuencia y conversar; si rechaza, no insistir.')
h(b,'Día 0 · aportar la idea')
p(b,'Usar el correo de la página anterior. Si ya pidió una demo, incluir el enlace al vídeo y una frase que explique qué va a ver. Evitar adjuntar el dossier interno completo.')
h(b,'Día 3-4 laborable · hacer visible el proceso')
q(b,'Asunto: mantener el hilo original')
p(b,'Hola, [nombre]:<br/><br/>He preparado el ejemplo que comentamos: una consulta llega fuera de horario, se recoge lo necesario y recepción recibe un resumen para continuar. La cita queda pendiente hasta que vuestro equipo la confirme.<br/><br/>Aquí tienes el vídeo: [enlace real]. Es una demostración con datos ficticios.<br/><br/>¿Se parece a cómo os llegan las consultas ahora?')
h(b,'Día 8-10 laborable · cerrar sin presión')
p(b,'Hola, [nombre]:</><br/>Cierro este seguimiento para no ocupar más tu bandeja. Si más adelante queréis revisar las consultas pendientes o los recordatorios de citas, podemos retomar la idea.<br/><br/>Gracias por tu tiempo.<br/>Nico · Atlis'.replace('<br/>','<br/>').replace('< />','<br/>').replace('<>',''))
h(b,'Qué registrar y cuándo parar')
p(b,'Anotar enviado, respuesta positiva, reunión celebrada, propuesta, ganado/perdido y motivo. Registrar bajas para no reintroducirlas en otra lista. No interpretar silencio como interés ni programar nuevos contactos sin una razón acordada.')
note(b,'Adaptación de M8 y M12, con una cadencia más corta para Atlis. Mantener firma y oposición también en seguimientos. Medir respuestas útiles y reuniones, no perseguir aperturas ni asumir tasas de conversión del curso.')

b=page('18 / RESPONDER','Qué decir cuando te contestan')
table(b,['Respuesta de la clínica','Respuesta propuesta de Atlis'],[
['«Mándame información»','«Claro. Para enviarte algo útil, ¿os preocupa más responder consultas, confirmar citas o seguir presupuestos? Te preparo el ejemplo de ese proceso.»'],['«¿Cuánto cuesta?»','«Como referencia propuesta, un asistente de un canal parte de 1.200 € de puesta en marcha y 300 €/mes, más impuestos, licencias y consumos. Primero revisamos si puede conectarse y si ese alcance os sirve.»'],['«Ya tenemos agencia»','«Perfecto. ¿También gestiona lo que pasa después de que llegue la consulta? Podemos revisar ese tramo con vuestro equipo y coordinarlo con la agencia.»'],['«Ya usamos un programa»','«Lo primero es ver qué resuelve y qué conexiones permite. Si ya cubre el proceso, no tiene sentido duplicarlo.»'],['«No queremos un robot»','«Podemos limitarlo a información administrativa y recogida de solicitudes. La persona puede pedir a recepción en cualquier momento. Lo probaríais antes de activarlo.»'],['«¿Tenéis casos en clínicas?»','«Estamos desarrollando nuestra especialización y aún no tenemos un caso publicado. Sí podemos mostrarte una demo y acordar cómo medir un primer proceso.»'],['«Me parece caro»','«¿Qué parte no te encaja: la inversión inicial, la cuota o el alcance? Podemos revisar qué problema merece resolverse primero.»'],['«Ahora no / no interesa»','Si es «ahora no», preguntar si desea una fecha concreta. Si es rechazo, agradecer y cerrar; no discutir ni seguir enviando.']],[127,368])
p(b,'<b>Si hay interés:</b> «Para ver si tiene sentido, propongo 15 minutos: me explicas cómo lo gestionáis y te enseño ese recorrido. ¿Te encaja [día/hora] o [alternativa]?». Utilizar huecos reales y confirmar quién asistirá.')
note(b,'No usar un descuento ficticio, testimonios inventados ni promesas de retorno. Las cifras del ejemplo de respuesta siguen pendientes de aprobación comercial de Atlis.')

b=page('19 / REUNIÓN','Una demo breve que permita decidir')
table(b,['Tiempo','Qué hacer','Pregunta o evidencia'],[
['0-2 min','Acordar el objetivo.','«Primero entiendo el proceso y después vemos si el ejemplo encaja.»'],['2-7 min','Investigar un único problema.','Volumen, canal, retrasos, excepciones y quién se ocupa.'],['7-11 min','Mostrar un recorrido.','Consulta fuera de horario → datos mínimos → resumen a recepción.'],['11-13 min','Probar un límite.','Petición clínica → derivación humana; solicitud de cita sin confirmación falsa.'],['13-15 min','Acordar siguiente paso.','Compatibilidad, responsable, alcance preliminar y fecha para propuesta.']],[64,177,254])
h(b,'Cinco preguntas para entender antes de vender')
bullets(b,['¿Qué ocurre hoy cuando alguien escribe fuera de horario?','¿Cuántas consultas quedan pendientes y cómo lo sabéis?','¿Quién hace seguimiento y cuándo deja de hacerlo?','¿Qué agenda o software manda y quién autoriza conectarlo?','¿Qué cambio sería útil dentro de un mes, y cómo lo mediríamos?'])
h(b,'Propuesta posterior de una página')
p(b,'<b>Problema observado:</b> [dato aportado por la clínica]. <b>Objetivo:</b> [mejora medible sin garantía]. <b>Entrega:</b> [un proceso y sus límites]. <b>Coste:</b> [inicio + cuota + terceros + impuestos]. <b>Hitos:</b> [fechas condicionadas a accesos]. <b>Aceptación:</b> [pruebas]. <b>Salida:</b> [condiciones]. <b>Siguiente paso:</b> aprobar alcance y preparar documentación.')
note(b,'Inspirado en C.I.E.R.R.E. y VISA del módulo 8, adaptado a una primera reunión corta. Si la clínica pide más profundidad, ampliar el diagnóstico; no encajar una auditoría completa en 15 minutos.')

b=page('20 / APLICACIÓN','Un plan de 30 días para Atlis')
table(b,['Semana','Trabajo concreto','Resultado revisable'],[
['1 · Preparar','Elegir dental o estética y un problema; validar precios con horas y costes; construir demo.','1 oferta, 1 demo etiquetada, 1 alcance de servicio y 1 modelo de propuesta.'],['2 · Conversar','Investigar 20 clínicas; buscar presentaciones y solicitudes de auditoría; registrar permisos.','Lista razonada y conversaciones reales. 20 es una meta de investigación, no de envíos fríos.'],['3 · Proponer','Celebrar reuniones; comprobar compatibilidad; enviar propuestas a quienes las soliciten.','Presupuestos con costes completos y objeciones registradas.'],['4 · Entregar y aprender','Si hay acuerdo, implantar un proceso y medir. Si no, revisar problema, mensaje o prueba.','Primera evidencia operativa o aprendizaje concreto para ajustar la oferta.']],[95,240,160])
h(b,'Reparto entre dos socios')
p(b,'Un responsable de diagnóstico, propuesta y relación con la clínica; otro de integración, pruebas y documentación. Ambos revisan lo que se promete. Estimar capacidad antes de aceptar varios arranques a la vez.')
h(b,'La escalera de ampliación')
p(b,'Primero resolver el problema comprado. Después, revisar el siguiente cuello de botella: respuesta → seguimiento → recordatorios → captación, según datos. Documentar cada proceso para poder repetirlo y mantenerlo sin depender de improvisaciones.')
q(b,'El primer objetivo no es vender todo el catálogo. Es conseguir que una clínica use y valore un proceso bien entregado.')
note(b,'Plan propuesto; no garantiza un cliente en 30 días. Toma la ejecución, el foco y la recurrencia de los módulos 2, 8, 9 y 10, sin convertir los retos temporales de clase en resultados prometidos.')

b=page('21 / MAPA FORMATIVO','Qué trasladamos de cada bloque')
table(b,['Bloque del programa','Aplicación a Atlis'],[
['M0-M2 · Negocio y recurrencia','Una oferta concreta, instalación cobrada y cuota que cubre mantenimiento real.'],['M3 · Investigación','Hablar con clínicas, validar dolor y comparar procesos antes de construir.'],['M4 · Oferta','Especialización y estructura de packs. Varias lecciones de pricing y paquetes sin contenido legible: no atribuirles nuestras tarifas.'],['M5 · Prompts','Información aprobada, límites claros y revisión de toda salida.'],['M6 · Agentes','Base de conocimiento, canales, derivación, agenda y pruebas. Herramientas del curso no equivalen a integraciones ya probadas por Atlis.'],['M7 · Presencia','Web y perfiles coherentes; demos claramente identificadas cuando faltan casos propios.'],['M8 · Venta','Empaquetado, ejemplos de precios, diagnóstico, demo, propuesta y tratamiento de objeciones.'],['M9 · Entrega','Accesos, hitos, contrato, cobro y aceptación antes de activar.'],['M10 · Crecimiento','Informe útil, retención, medición y ampliación según necesidad.'],['M11 · Avanzado','Integraciones y voz como evolución, sujeta a validación técnica y económica.'],['M12 · Captación','Personalización, CRM y seguimiento. Corregir la simplificación legal del email.'],['M13 / contenidos legales','Inventariados con cobertura incompleta; no sustituir revisión jurídica por el índice.'],['Tutorías y masterclass','Síntesis disponible para precios, compatibilidad y entrega; muchas categorías carecen de contenido capturado.']],[150,345])
note(b,'Se revisó la guía temática disponible y se contrastaron las fuentes centrales de precios y venta. Esta cobertura no permite afirmar que todas las clases, bonus o grabaciones del campus estén revisadas íntegramente.')

b=page('22 / TRAZABILIDAD','Fuentes y decisiones pendientes')
h(b,'Fuentes utilizadas')
p(b,'<b>[A] ATLIS_prompt-maestro.md.</b> Archivo aportado por el usuario, §§1-8: posicionamiento, tres líneas, método, identidad y veracidad. Base de marca; precios y herramientas figuran por definir.')
p(b,'<b>[B] M1-L7 y M2-L2.</b> «Qué servicios paga el mercado y cuánto cobran» y «El motor del recurrente». Origen de rangos y separación de instalación y cuota.')
p(b,'<b>[C] M8, Define y empaqueta, A-D.</b> Fuente directa de 397/897 €, 297 € + 15 % con mínimo 200 €, y 1.200 € + 300 €/mes. M8, Vender, temas 2-6: demo, reunión, objeciones y primer cliente.')
p(b,'<b>[D] M6, M9 y M10.</b> Agente y pruebas; onboarding y entrega; informe, retención y crecimiento. Se adaptan al contexto administrativo de una clínica.')
p(b,'<b>[E] M11 y M12-L3.</b> Automatización avanzada y «Práctica Apify, Apollo y cold email». Ejemplos y métodos; no se adoptan sus precios de software ni se asume que sus pautas legales sean suficientes.')
p(b,'<b>[F] Guía unificada y tutorías.</b> Carpetas guia/ y catalogo/ del archivo formacion-mkt-hackers. Síntesis de precios con referencias a tutorías 23/03 y 20/04; compatibilidad y entrega con referencias a marzo-mayo de 2026.')
p(b,'<b>[G] BOE, Ley 34/2002, arts. 20-22.</b> Texto consolidado consultado el 28/09/2026. <link href="https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758#a21" color="#007A76">Abrir fuente oficial sobre comunicaciones comerciales</link>.')
h(b,'Pendiente antes de convertirlo en oferta definitiva')
p(b,'Aprobar tarifas y condiciones; escoger herramientas y calcular costes; comprobar integraciones; concretar atención y límites de uso; validar textos, contratos y datos; acreditar las capacidades que se presenten al cliente. Completar M4 y materiales no capturados si se desea una revisión audiovisual íntegra del curso.')
note(b,'Edición 28/09/2026 · Documento interno de trabajo. No hay casos reales, resultados garantizados ni testimonios atribuidos a Atlis. Los ejemplos de números, correos y procesos son ilustrativos. Los logos y la identidad proceden del material del usuario.')

# Corregir etiquetas de salto en el texto de cierre.
for pg in PAGES:
 for i,bl in enumerate(pg['blocks']):
  if bl[0] in ('p','h','note','q'):pg['blocks'][i]=(bl[0],bl[1].replace('<br/><br/>','<br/><br/>').replace('</>','<br/>'))

WIDTH,HEIGHT=595.2756,841.8898
TOTAL=1+len(PAGES)
def decor(c,doc):
 n=doc.page
 c.saveState()
 if n==1:
  c.setFillColor(LIGHT);c.rect(0,0,WIDTH,HEIGHT,fill=1,stroke=0)
  c.drawImage(str(logo),48,706,width=205,height=205*720/2184,mask='auto')
  c.setFillColor(TEAL); c.setFont('InterB',9);c.drawString(50,663,'SERVICIOS · PRECIOS · CONVERSACIÓN COMERCIAL')
  c.setFont('Manrope',37);c.setFillColor(INK)
  for y,t in [(579,'Cada consulta'),(533,'merece un'),(487,'siguiente paso')]:c.drawString(48,y,t)
  c.setFillColor(HexColor('#01C5BD'));c.circle(48+pdfmetrics.stringWidth('siguiente paso','Manrope',37)+7,490,3.6,fill=1,stroke=0)
  c.setFillColor(PETROL);c.roundRect(48,195,499,219,14,fill=1,stroke=0)
  c.setFillColor(white);c.setFont('Manrope',19);c.drawString(70,375,'La oferta de Atlis, llevada a la práctica')
  c.setFont('Inter',11)
  for y,t in [(342,'Webs, asistentes y automatizaciones para clínicas.'),(320,'Captación conectada con atención y seguimiento.'),(298,'Una propuesta de precios y un método para venderla.')]:c.drawString(70,y,t)
  c.setFillColor(HexColor('#A9C3C4'));c.setFont('Inter',9)
  c.drawString(70,247,'Basado en el prompt maestro y los materiales disponibles')
  c.drawString(70,232,'de MKT Hackers. Tarifas propuestas pendientes de validar.')
  c.setFillColor(GRAY);c.setFont('InterB',9);c.drawString(50,136,'DOSSIER INTERNO · 28 SEPTIEMBRE 2026')
  c.setFont('Inter',10);c.drawString(50,115,'Clínicas dentales y de estética · España')
 else:
  c.setFillColor(LIGHT);c.rect(0,HEIGHT-63,WIDTH,63,fill=1,stroke=0)
  c.drawImage(str(icon),45,HEIGHT-50,width=30,height=30,mask='auto')
  c.setFont('InterB',9);c.setFillColor(INK);c.drawString(84,HEIGHT-35,'ATLIS')
  c.setFont('Inter',8);c.setFillColor(GRAY);c.drawRightString(WIDTH-49,HEIGHT-35,'SERVICIOS, PRECIOS Y CAPTACIÓN')
 c.setStrokeColor(BORDER);c.line(49,48,WIDTH-49,48)
 c.setFont('Inter',7.6);c.setFillColor(GRAY);c.drawString(49,32,'ATLIS · Documento de trabajo · Precios propuestos, no aprobados')
 c.drawRightString(WIDTH-49,32,f'{n:02d} / {TOTAL:02d}')
 c.restoreState()

story=[Spacer(1,1),PageBreak()]
for ix,pg in enumerate(PAGES):
 story.append(Paragraph(pg['tag'],S['tag']));story.append(Paragraph(pg['title'],S['h1']))
 for block in pg['blocks']:
  typ=block[0]
  if typ=='table':
   _,heads,rows,widths=block
   data=[[Paragraph(x,S['th']) for x in heads]]+[[Paragraph(x,S['cell']) for x in row] for row in rows]
   t=Table(data,colWidths=widths,hAlign='LEFT',repeatRows=1)
   t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PETROL),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,white]),('LINEBELOW',(0,1),(-1,-1),.4,BORDER)]))
   story.extend([t,Spacer(1,13)])
  else:
   style={'p':'body','h':'h2','note':'small','q':'quote'}[typ]
   story.append(Paragraph(block[1],S[style]))
 if ix<len(PAGES)-1:story.append(PageBreak())
doc=SimpleDocTemplate(str(OUT),pagesize=(WIDTH,HEIGHT),rightMargin=50,leftMargin=50,topMargin=83,bottomMargin=64,title='ATLIS | Servicios, precios y captación para clínicas',author='Atlis',subject='Dossier interno basado en MKT Hackers y prompt maestro de Atlis')
doc.build(story,onFirstPage=decor,onLaterPages=decor)
(ROOT/'tmp/pdfs/atlis/content.json').write_text(json.dumps(PAGES,ensure_ascii=False,indent=2))
print(OUT)
print('Expected pages',TOTAL)
from pypdf import PdfReader
r=PdfReader(str(OUT)); print('Actual pages',len(r.pages))
for i,pg in enumerate(r.pages):
 txt=pg.extract_text(); print(i+1,len(txt),txt[:110].replace('\n',' | '))
