# Pendientes para la publicación

## Necesarios

1. **Identidad legal y contacto**: razón social o nombre del titular, identificación fiscal y datos de contacto que procedan. El propietario debe facilitar la información verificada.
2. **Privacidad y aviso legal reales**: textos aprobados, URLs definitivas e información resumida del tratamiento del formulario. No se han redactado políticas ficticias. Los controles actuales muestran avisos de revisión.
3. **Receptor del formulario**: decidir dónde recibe ATLIS las solicitudes (correo mediante un proveedor, CRM o webhook propio) y facilitar la configuración correspondiente. El receptor debe confirmar la recepción según el contrato del README. Hace falta probar una solicitud real al activarlo.
4. **Dominio y alojamiento**: confirmar el destino y autorizar la publicación. Establecer `PUBLIC_ORIGIN`, HTTPS, gestión de secretos y límite de envíos adaptado al alojamiento. No reutilizar la configuración ni las credenciales de la app.

## Marca y contenido

- Facilitar un **logotipo oficial apto para fondo claro** para cumplir literalmente esa indicación del briefing. El único logotipo completo disponible tiene letras blancas; se conserva intacto sobre una pequeña placa verde petróleo. El símbolo turquesa mantiene su color.
- Confirmar si se quiere mostrar un contacto comercial público. No se ha inventado un teléfono ni un email.
- Confirmar el alcance real de canales e integraciones. La web los describe como propuestas y comprueba la compatibilidad antes de comprometer funciones.
- Incorporar casos documentados y testimonios autorizados solo si llegan a existir. De momento se muestran criterios de medición sin cifras inventadas.

## Antes de lanzar

- Sustituir los avisos de revisión por los enlaces reales; activar y verificar el formulario.
- Completar los metadatos del dominio, canonical y `og:url`; quitar `noindex` cuando se autorice la indexación. El título, la descripción y los metadatos de texto ya están preparados.
- Medir Lighthouse sobre el alojamiento definitivo. No se ha inventado ninguna puntuación.
- Si se añaden analítica, publicidad o cookies no esenciales, definir la gestión de preferencias y los textos correspondientes antes de activar esos proveedores.
- No emitir un evento de demo reservada hasta conectar una agenda y recibir una confirmación de reserva real.
- En el ejemplo del hero, el recordatorio es **de revisión de la solicitud**, no una confirmación de cita. El recorrido interactivo explica cuándo se programa el recordatorio de una cita ya confirmada.
