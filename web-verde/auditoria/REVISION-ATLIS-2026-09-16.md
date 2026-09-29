# Revisión de Atlis Clínicas

16 de septiembre de 2026 · Sitio: https://atlisclinicas.com/ · Público: propietarios y responsables de clínicas dentales y de estética.

La web tiene una identidad visual coherente y una buena base para explicar la automatización. Sin embargo, la versión publicada todavía conserva bloqueos de una versión de revisión. Antes de ampliar el diseño o invertir en atraer visitas, hay que resolver la recepción de solicitudes, el menú móvil, los datos empresariales y la configuración de buscadores. Después, la mayor oportunidad está en concretar la oferta, demostrar quién la presta y acortar el recorrido.

## Alcance y grado de certeza

- Consulté el HTML y los recursos públicos servidos por Vercel. La respuesta HTTP de la portada fue 200.
- El navegador de revisión encontró un error de conexión QUIC en el dominio de Atlis. Por ello descargué los archivos publicados y revisé una copia local exacta: comprobé igualdad de los 30 archivos descargados con el build disponible, incluidos HTML, CSS, JavaScript, fuentes e imágenes. Las conclusiones visuales y de interacción se refieren a esa copia. No permiten evaluar latencia real, comportamiento de red en otros dispositivos ni métricas de producción.
- Revisé escritorio de 1280 × 720 y tamaños móviles de 390 × 844 y 360 × 800. Son tamaños de navegador, no pruebas en teléfonos físicos.
- Probé enlaces del menú, pestañas de soluciones y canales, un recorrido de la simulación, la calculadora con asistencia del 60 % y del 100 %, transferencia del cálculo al formulario, validación vacía y envío desactivado con datos ficticios en local.
- No envié solicitudes comerciales ni modifiqué o desplegué la web. Tampoco accedí a Vercel Analytics, Search Console, CRM o resultados comerciales privados.
- Distingo fallos reproducidos, observaciones del contenido y propuestas que habrá que validar con visitantes reales. No atribuyo porcentajes de mejora a cambios sin medirlos.

## Prioridades

| Orden | Prioridad | Cambio | Motivo |
|---|---|---|---|
| 1 | Urgente | Activar una vía real de contacto y recepción de solicitudes | Los nueve enlaces comerciales de la portada terminan en un formulario desactivado. |
| 2 | Urgente | Corregir el clic sobre el icono del menú móvil | El menú se abre y vuelve a cerrarse en el mismo clic. |
| 3 | Urgente | Completar identidad, contacto y documentos publicados | La propia web declara que están pendientes. |
| 4 | Alta, al completar lo anterior | Retirar las restricciones de rastreo e indexación de las páginas comerciales | La configuración sigue siendo la de una revisión privada. |
| 5 | Alta | Explicar el beneficio y mencionar dental y estética en la primera pantalla | La mitad del público objetivo no se ve reflejada. |
| 6 | Alta | Sustituir el caso ficticio por evidencia real o una demostración sin testimonio | Hoy falta una razón verificable para confiar. |
| 7 | Alta | Reescribir con identidad propia los textos cercanos a la competencia | La similitud dificulta recordar y distinguir Atlis. |
| 8 | Alta | Aclarar qué se automatiza, qué se confirma y qué integraciones existen | Reduce dudas prácticas de compra. |
| 9 | Media | Acortar las demostraciones repetidas y mejorar la lectura móvil | La página exige un recorrido muy largo. |
| 10 | Media | Mejorar calculadora, FAQ y explicación de la demo | Permite decidir con menos incertidumbre. |
| 11 | Posterior | Medir el recorrido comercial y desarrollar páginas por especialidad | Da base para mejorar con datos. |

## Fallos y bloqueos confirmados

**01. El formulario no recibe solicitudes.** En la [página de demo](https://atlisclinicas.com/demo.html) aparece el aviso de versión de revisión. El [archivo público de configuración](https://atlisclinicas.com/js/config.js) contiene `endpoint: null` y `privacyReady: false`. La prueba local con campos válidos termina informando de que no se ha enviado ningún dato. No basta con quitar el aviso: hay que conectar el receptor, validar en servidor y comprobar que la solicitud llega al destino real. Criterio de cierre: envío válido recibido una sola vez, confirmación real, error comprensible si falla y posibilidad de reintentar sin perder datos.

**02. El icono del menú móvil provoca un cierre inmediato.** Reproducido al pulsar el SVG del botón: `aria-expanded` continúa en `false`; al pulsar Enter, el menú sí abre y sus enlaces funcionan. En `js/main.js`, el clic cambia el `innerHTML` del botón, eliminando el SVG que originó el evento. Después el manejador del documento comprueba si ese elemento sigue dentro de la cabecera y lo interpreta como clic exterior. Corregir el manejo del evento —por ejemplo, conservar el nodo del icono o usar la ruta original del evento para determinar si el clic fue exterior— y verificar icono, espacio del botón, teclado, Escape y clic fuera. Es el fallo de facilidad de navegación más importante detectado.

**03. No hay una vía alternativa de contacto.** En la portada y la página de demo no encontré enlaces de email, teléfono o WhatsApp comercial. Con el formulario desactivado, el visitante no dispone de un siguiente paso útil. Añadir email corporativo visible y un canal atendido realmente; si se incorpora WhatsApp, indicar que es para hablar con Atlis y evitar confundirlo con la simulación del asistente para pacientes.

**04. La identidad de la empresa sigue pendiente.** El pie declara que el contacto y los datos empresariales están por confirmar. El [aviso legal](https://atlisclinicas.com/aviso-legal.html) y la [información de privacidad](https://atlisclinicas.com/privacidad.html) son documentos de revisión. Completar con información real y coherente con la operación. Desde la perspectiva comercial, pedir a una clínica que confíe sus procesos exige que pueda identificar claramente al proveedor. Esto es una observación de contenido y confianza; no constituye una auditoría jurídica.

**05. La configuración pública restringe los buscadores.** Las cuatro páginas HTML incluyen `noindex, nofollow`; [robots.txt](https://atlisclinicas.com/robots.txt) contiene `Disallow: /` y la declaración de sitemap comentada. Permitir el rastreo y retirar `noindex` de las páginas que deban posicionar cuando estén listas. Después, verificar la URL y el sitemap en Search Console. Matiz: bloquear rastreo no garantiza que una URL nunca aparezca; también impide a Google leer el `noindex`. No basta con cambiar solo uno de los dos. [Explicación oficial de Google](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

## Mensaje, especialización y diferenciación

**06. La primera pantalla es demasiado abstracta.** El titular sobre consultas que avanzan y tareas que frenan suena bien, pero no permite saber inmediatamente qué compras. Hay que explicar qué hace Atlis, por qué canal y para quién. Un propietario debería entenderlo sin bajar a las demostraciones. Conservar el tono tranquilo, pero introducir acciones concretas: responder consultas, recoger solicitudes de cita, enviar recordatorios y dar seguimiento.

**07. Estética no aparece como público propio.** La etiqueta inicial, el título SEO, la descripción, los ejemplos y el pie hablan de dental. Incluir ambos sectores en los puntos principales y mostrar situaciones específicas: primera visita y presupuestos en dental; citas de valoración, sesiones y continuidad de atención en estética. No mezclar procedimientos ni prometer asesoramiento sanitario automático. A medio plazo, crear dos páginas con ejemplos propios y enlazarlas claramente desde la portada.

**08. El posicionamiento necesita una elección explícita.** La web presenta respuesta y seguimiento, pero algunos botones pueden hacer pensar que también vendes captación publicitaria. Explicar si trabajas sobre las consultas que la clínica ya recibe, si generas demanda o si ofreces ambos servicios. La oportunidad sugerida por la web actual es ayudar a clínicas a aprovechar sus contactos y reducir tareas de recepción. Confirmar que ese es el servicio que puedes entregar.

**09. Evitar terminología del proveedor.** La frase sobre SaaS obliga al lector a interpretar una categoría tecnológica. Sustituirla por una explicación práctica: configuración, pruebas y acompañamiento para que el equipo pueda usar el sistema. Lo relevante para la clínica es quién lo pone en marcha, cuánto trabajo requiere y a quién llama cuando necesita ayuda.

**10. Definir una identidad verbal propia.** Hay coincidencias textuales y de estructura con AI Automatiza en la nota de consultoría, los beneficios, la calculadora y algunos botones. No permite concluir quién originó cada texto, pero sí detectar escasa diferenciación. Reescribir desde el servicio real de Atlis y las preguntas de sus clientes; modificar unos adjetivos o colores no resuelve el problema. [Referencia comparada](https://www.aiautomatiza.com/).

**11. Concretar qué se entrega.** Un bloque corto debería responder: canales incluidos, proceso inicial, configuración, formación, revisiones, soporte y qué se presupuesta aparte. No inventar paquetes o capacidades todavía inexistentes. Una oferta a medida también puede describir con precisión el trabajo habitual.

**12. Explicar la frontera entre solicitud y cita confirmada.** El calendario muestra una solicitud pendiente de confirmación humana, mientras que parte del lenguaje comercial habla de llenar la agenda o citas confirmadas. Unificar la explicación: qué hace el asistente por sí mismo, qué revisa recepción y cuándo queda reservada una hora. Si existen distintas modalidades, presentarlas como tales.

**13. Aclarar los canales y las integraciones.** Google Calendar tiene mucha presencia visual y puede llevar a pensar que es la única agenda compatible o que la integración ya está disponible para cualquier clínica. Mostrar compatibilidades verificadas y distinguir integración directa, revisión necesaria y solución alternativa. No publicar logotipos como prueba de compatibilidad si aún no existe. Si no hay llamadas automatizadas, evitar que ejemplos que mencionan teléfono hagan suponer lo contrario.

**14. Separar elaboración de presupuestos y seguimiento.** Son problemas diferentes. Explicar si Atlis genera un borrador a partir de conceptos aprobados, organiza documentación o recuerda presupuestos pendientes. Mantener la revisión profesional que ya se explica y demostrar el ahorro administrativo concreto.

## Confianza y prueba

**15. Retirar el testimonio ficticio.** El caso de la clínica de ejemplo está identificado como ilustrativo, lo cual es correcto, pero incluye métricas y una cita atribuidas a una dirección ficticia. Un visitante que escanea puede interpretarlo como prueba comercial y después sentirse decepcionado. Hasta tener un cliente documentado, transformarlo en un esquema de funcionamiento sin comillas testimoniales ni resultados inventados. Nunca ocultar su condición ilustrativa. [Sección del caso](https://atlisclinicas.com/#caso).

**16. Construir un caso real con contexto.** Cuando exista, incluir problema inicial, intervención, periodo, volumen y resultados medidos. Diferenciar aumento relativo de puntos porcentuales y separar citas solicitadas, confirmadas, asistidas y tratamientos aceptados. Usar únicamente identidad y declaraciones autorizadas. Un piloto documentado aporta más confianza que una cifra espectacular sin contexto.

**17. Enseñar a las personas que atienden al cliente.** No aparece una presentación real del equipo o responsable de la implantación. Añadir nombre, fotografía real, función y experiencia relevante verificable. Explicar quién acompaña la puesta en marcha y por qué canal se resuelven incidencias. Un pequeño bloque humano sería más útil que añadir otra ilustración abstracta.

**18. Etiquetar visualmente la actividad simulada.** La banda animada muestra eventos con importes y la palabra “ahora”. Su nombre accesible indica que son ejemplos, pero falta una explicación visible igualmente clara junto a esa banda. Cambiar a un rótulo permanente de simulación, quitar la apariencia de actividad en directo o eliminar la banda si repite los beneficios ya explicados.

**19. Dar respuestas prácticas sobre los datos.** La FAQ actual se limita a decir que se revisarán datos, accesos y proveedores. Antes de vender, preparar una explicación verificada de quién accede, qué proveedores intervienen, dónde se aloja la información, qué se conserva, cómo se deriva a una persona y cómo se termina el servicio. Publicar únicamente compromisos que puedas cumplir; no añadir sellos o declaraciones absolutas sin soporte.

## Navegación, diseño y móvil

**20. Acortar el recorrido.** La portada mide aproximadamente 11.110 píxeles de alto en la prueba de escritorio y 16.449 en la de 390 × 844: casi veinte alturas de pantalla móvil. Es una medición de longitud, no una tasa de abandono. La combinación de conversación inicial, cuatro soluciones interactivas y tres escenarios vuelve a explicar partes del mismo proceso. Mantendría una explicación breve arriba y una sola demostración principal.

**21. Ordenar el menú como la página.** El menú coloca “Cómo funciona” antes de la calculadora, mientras que en el documento el método va después de calculadora y caso. Unificar el orden y usar rótulos que ayuden a decidir: soluciones, ejemplo, cómo empezamos, preguntas y contacto. Si se mantiene la calculadora como punto destacado, situarla en el lugar correspondiente del menú.

**22. Dar acceso directo a la demostración principal.** La sección interactiva no tiene una entrada propia en el menú principal. Se llega desde un enlace dentro del ejemplo inicial o recorriendo la página. Un enlace secundario “Ver un ejemplo” junto al botón principal permitiría explorar sin comprometerse a pedir una reunión.

**23. Unificar la acción comercial.** Hay nueve enlaces de la portada hacia `demo.html` con expresiones distintas. Repetir el acceso es razonable en una página larga, pero conviene mantener una etiqueta reconocible como “Solicitar demo gratuita”. Reservar otras etiquetas para acciones distintas. “Trabajemos juntos” puede sugerir una decisión de contratación antes de conocer el servicio.

**24. Aumentar la legibilidad de la letra pequeña.** En móvil medí textos importantes de 11 px en la nota bajo el botón y en el aviso de compatibilidad; las etiquetas de la calculadora son de 12 px. Recomiendo 14 px aproximadamente para aclaraciones relevantes y 16 px para cuerpo de lectura, ajustando el diseño. Es una recomendación de usabilidad, no la afirmación de que exista un mínimo universal de fuente WCAG.

**25. Ampliar el botón del menú.** Su área medida es de 37 × 40 px. Propongo al menos 44 × 44 para facilitar el uso con el pulgar, reduciendo antes el texto del botón comercial si hace falta. No debe confundirse esta propuesta con el criterio mínimo AA de 24 × 24 y sus excepciones. [Referencia W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

**26. Simplificar la parte visual del calendario en móvil.** Conversación y calendario se apilan, y la primera sección ocupa unas 2,4 alturas de pantalla a 390 × 844. Mostrar primero el resultado útil —solicitud recogida y siguiente paso— y dejar el calendario detallado como ampliación. Mantener una fecha fija solo si queda claro que es un ejemplo; en meses posteriores puede parecer contenido desactualizado.

**27. Reducir espacios y mensajes repetidos.** El aire visual ayuda, pero hay introducciones, subtítulos, remates y notas que repiten que el equipo conserva el control. Concentrar esa promesa en un bloque breve y demostrarla en el flujo. Reducir espacio vertical antes que reducir aún más el tamaño del texto.

**28. Moderar movimiento decorativo.** Hay órbitas, tarjetas y actividad que se desplazan, además de un cursor decorativo en el cierre. Priorizar una demostración que el usuario inicia y animaciones que expliquen un cambio. Mantener el soporte de movimiento reducido ya presente. No hace falta añadir más efectos para transmitir calidad.

**29. Conservar lo que funciona en accesibilidad.** Hay enlace para saltar al contenido, etiquetas de campos, estados ARIA, foco visible, pestañas, respuestas mediante `details` y reglas de movimiento reducido. Los enlaces de sección dejan espacio para la cabecera. No detecté desbordamiento horizontal del documento a 360 y 390 px, y las imágenes de la portada comprobadas cargaban. Esto no equivale a una certificación completa: faltan pruebas en lector de pantalla, zoom y dispositivos físicos.

## Calculadora y solicitud de demo

**30. Cambiar la interpretación económica del resultado.** La calculadora estima facturación adicional al aumentar hasta diez puntos la asistencia. No calcula beneficio, dinero efectivamente perdido ni una mejora garantizada por Atlis. Sustituir el mensaje principal por “Facturación adicional estimada en este escenario” y mantener el supuesto visible, junto al número. La FAQ habla de “margen estimado”, mientras la fórmula calcula facturación: corregir esa inconsistencia también en los datos estructurados.

**31. Separar ausencias totales y visitas recuperadas.** Con los valores iniciales hay 80 citas, 60 % de asistencia, 50 % de aceptación y 1.200 € por tratamiento. El escenario calcula 32 ausencias actuales, pero solo 8 visitas adicionales con diez puntos más de asistencia; estas producirían una media de 4 tratamientos y 4.800 € de facturación adicional. Mostrar las 32 junto a 4.800 € sin suficiente jerarquía puede hacer pensar que toda esa pérdida se recuperará. Presentar situación actual, cambio supuesto y resultado incremental en ese orden.

**32. Hacer explícita la incertidumbre del escenario.** Mantener la fórmula desplegable, pero mostrar fuera de ella que no se descuentan costes ni el servicio y que no hay garantía. Identificar los valores iniciales como ejemplo, no como datos medios del sector. Permitir una hipótesis conservadora y otra más ambiciosa solo si sigue siendo fácil de usar. No hace falta convertir la portada en una hoja financiera.

**33. Ayudar a quien no conoce sus métricas.** Explicar cada porcentaje en lenguaje cotidiano y ofrecer seguir con una estimación o pedir ayuda. En estética, facilitar un valor acorde con una sesión o un tratamiento según la métrica elegida. El usuario debe entender qué cifra introducir, sin tener que calcular previamente su negocio.

**34. Mantener la continuidad del cálculo con transparencia.** El cambio realizado en la calculadora se conservó al llegar al formulario: es una función útil. Aclarar qué cifras se adjuntan y permitir descartarlas. Actualmente el formulario anuncia que las envía aunque, en esta versión, no hay envío conectado; al activar el receptor, verificar que el resumen enviado coincide con el mostrado y que queda explicado el uso de esos datos.

**35. Precisar qué es la demo.** La página explica los temas que se revisarán, pero falta indicar duración aproximada, formato, quién participa, si se verá un sistema funcionando y qué recibe el propietario al terminar. Publicar un plazo real de respuesta. Si el servicio inicial es una conversación de diagnóstico, llamarla así y distinguirla del ejemplo interactivo de la portada.

**36. Mantener el formulario ligero.** Ya cuenta con tres campos obligatorios y dos opcionales; no hay necesidad de convertirlo en un cuestionario largo. Para distinguir dental y estética puede sustituirse el desplegable opcional actual por tipo de clínica o adaptar sus opciones. Pedir herramientas, sedes y volumen después si no son imprescindibles para responder. Mantener etiquetas visibles, teléfono opcional y mensajes de error específicos.

**37. Diseñar la confirmación y los fallos.** Una solicitud real debería confirmar recepción, explicar el siguiente paso y dar un canal alternativo. El código ya evita considerar cualquier respuesta como éxito y mantiene los datos en pantalla cuando falla: conservar esa intención. Falta comprobar el receptor real, evitar duplicados por reintento y completar el recorrido hasta la atención humana. El clic en el botón no debe medirse como una solicitud recibida.

**38. Responder mejor las objeciones de compra.** Las FAQ sobre plazos y coste son prudentes, pero demasiado abiertas. Añadir qué determina el presupuesto, implantación frente a cuota recurrente, consumos de canales, mantenimiento, permanencia si existe y condiciones de salida. Explicar qué necesita aportar la clínica y cómo se forma al equipo. Dar rangos solo cuando puedas sostenerlos; no publicar importes o calendarios inventados.

## Técnica, SEO y medición

**39. Aprovechar la base técnica actual.** HTML estático, fuentes locales, imágenes con dimensiones, metadatos, canonical, sitemap y datos estructurados son una base útil. No veo una razón derivada de esta auditoría para migrar de plataforma o de framework. El problema principal de SEO es la configuración restrictiva ya señalada, no que esté alojada en Vercel.

**40. Crear contenido que responda a la intención del comprador.** Una vez resueltos los bloqueos, preparar páginas distintas para automatización dental y de estética, con ejemplos, preguntas y alcance propios. Actualizar títulos, descripciones y presentación al compartir enlaces. Evitar páginas duplicadas que solo cambien una palabra y evitar posicionarse como clínica asistencial: Atlis es el proveedor de servicios para clínicas. Mantener coherentes la web visible y sus datos estructurados.

**41. Medir rendimiento real antes de rediseñar por velocidad.** Los tres CSS de la portada publicados suman 129.290 bytes sin compresión. Hay varias capas de estilos, animaciones y desenfoques: conviene revisar reglas no usadas, coste visual y caché de recursos, pero ese tamaño por sí solo no prueba lentitud. No se ejecutó una auditoría Lighthouse ni se obtuvieron métricas de campo. Medir LCP, INP y CLS en producción y móvil; referencias de buen rendimiento: LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1, evaluadas al percentil 75. [Referencia oficial de Web Vitals](https://web.dev/articles/vitals).

**42. Medir el recorrido hasta una oportunidad real.** En el cliente publicado no encontré una integración explícita de analítica de marketing; no he inspeccionado registros ni paneles de Vercel. Definir eventos de clic principal, ejemplo visto, cálculo utilizado, formulario iniciado, solicitud recibida, demo realizada y oportunidad cualificada. Separar dental y estética y el canal de llegada. Evitar registrar datos de pacientes o el contenido de formularios en herramientas de analítica y revisar el tratamiento de datos del sistema elegido antes de activarlo.

**43. Comprobar despliegue y disponibilidad como una tarea separada.** La consulta HTTP al dominio respondió, pero el navegador integrado no consiguió acceder por QUIC en los intentos realizados. Eso no permite afirmar que la web esté caída para tus visitantes. Comprobar con otro navegador y redes reales; si se reproduce, revisar dominio, DNS y entrega en Vercel. Tras cada publicación, verificar portada, recursos, formulario y documentos en la URL pública, no únicamente en local. Revisar también redirección HTTP→HTTPS, versión con y sin www, URL canónica y una 404 útil; estos últimos comportamientos no se han certificado aquí.

## Cómo te sitúas frente a los competidores

Esta comparación valora lo que sus webs comunican, no certifica sus resultados o garantías comerciales.

| Referencia | Qué comunica con más claridad | Aprendizaje para Atlis |
|---|---|---|
| [AI Automatiza](https://www.aiautomatiza.com/) | Automatización comercial para clínicas con volumen, pantallas de producto y un caso identificado. | Concretar el funcionamiento y presentar evidencia propia; encontrar un segmento y una oferta que puedas atender de forma diferencial. |
| [Climadent](https://www.climadent.com/) | Captación dental, catálogo de servicios, testimonios y acceso a equipo y contacto. | Hacer visibles especialización, personas y resultados; explicar cómo encaja Atlis con el marketing que la clínica ya tiene. |

No copiaría garantías, cifras de clientes, urgencia comercial ni afirmaciones absolutas. La diferenciación más defendible para Atlis tiene que nacer de algo que puedas demostrar: facilidad de implantación, proceso concreto, atención personal, compatibilidad real o una especialización clínica determinada. La hipótesis de empezar por una tarea y ampliar después encaja con tu mensaje actual, pero falta concretarla como oferta.

## Propuesta de primera pantalla

Texto propuesto para validar con tu servicio real:

**Etiqueta:** Automatización para clínicas dentales y de estética.

**Titular:** Más consultas atendidas. Más tiempo para tus pacientes.

**Descripción:** Atlis responde por WhatsApp y web, recoge solicitudes de cita y automatiza recordatorios y seguimientos. Lo configuramos con las reglas de tu clínica y la supervisión de tu equipo.

**Botón principal:** Solicitar demo gratuita.

**Enlace secundario:** Ver un ejemplo.

**Texto de apoyo:** Revisamos tus herramientas y elegimos contigo el primer proceso que merece la pena automatizar.

El objetivo es explicar el trabajo y el beneficio en pocos segundos, sin asegurar resultados que aún no estén demostrados. Si hay reserva automática real y verificada, sustituir “recoge solicitudes de cita” por la formulación exacta correspondiente. Si no, conservarlo.

## Estructura recomendada de la portada

1. Qué hace Atlis, para quién y cómo contactar.
2. Tres problemas cotidianos que resuelve, con un ejemplo dental y otro de estética.
3. Una demostración principal breve y opcional.
4. Qué incluye el servicio, cómo se conecta y dónde interviene el equipo.
5. Evidencia real y personas responsables; mientras no haya caso, una prueba de funcionamiento claramente identificada.
6. Cómo se empieza, esfuerzo de la clínica y acompañamiento.
7. Calculadora opcional, con hipótesis transparentes.
8. Preguntas prácticas sobre precio, plazos, soporte y datos.
9. Contacto claro y pie con identidad completa.

La estructura no requiere nueve bloques enormes. Algunas respuestas pueden compartir un mismo bloque. El criterio es que una persona pueda entender la oferta, confiar y contactar sin completar todas las interacciones.

## Secuencia de trabajo propuesta

**Primera entrega: hacer útil la web publicada.** Corregir menú; completar identidad y documentos; conectar y verificar solicitudes; añadir contacto alternativo; retirar restricciones de buscadores de las páginas preparadas. Criterio: un propietario puede navegar desde móvil y llegar a una persona de Atlis sin encontrarse notas de revisión.

**Segunda entrega: aclarar oferta y confianza.** Reescribir portada para ambos sectores, unificar botones, precisar integraciones y alcance, presentar al equipo y retirar el testimonio ficticio. Criterio: alguien que no conoce Atlis puede explicar qué ofrece, para quién y qué ocurre al pedir una demo.

**Tercera entrega: reducir esfuerzo y medir.** Unificar demostraciones, mejorar tamaño de texto, afinar calculadora y FAQ, instrumentar el recorrido y revisar rendimiento en producción. Criterio: comparar solicitudes cualificadas y demos realizadas antes y después, sin confundir más clics con mejor negocio.

**Cuarta entrega: desarrollar adquisición orgánica.** Páginas por especialidad y casos reales, guiadas por consultas de clientes y datos de búsqueda. Priorizar esto después de que el contacto funcione y la propuesta esté clara.

## Qué conservaría

La paleta verde y los fondos claros; la consistencia de botones y tarjetas; la explicación de intervención humana; el uso de situaciones reales de recepción; las etiquetas visibles del formulario; las entradas numéricas junto a los deslizadores; el traspaso del cálculo a la solicitud; la implementación accesible ya presente. La mejora no requiere rehacerlo todo: requiere completar la operación, simplificar y aportar pruebas.
