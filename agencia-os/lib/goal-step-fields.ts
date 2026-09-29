export type GoalStepField = {
  label: string;
  placeholder: string;
  multiline?: boolean;
};

// Solo las decisiones que conviene dejar por escrito tienen un campo propio.
// Los demás pasos siguen siendo una lista de comprobación sencilla.
export const goalStepFields: Record<string, GoalStepField> = {
  "launch-step-01-01": { label: "Nicho elegido", placeholder: "Ej. Clínicas dentales" },
  "launch-step-01-03": { label: "Proceso que vamos a automatizar", placeholder: "Ej. Responder consultas y recuperar citas perdidas", multiline: true },
  "launch-step-01-04": { label: "Micronicho elegido", placeholder: "Ej. Clínicas dentales de 2–5 gabinetes en Madrid" },
  "launch-step-01-05": { label: "Nuestro cliente ideal", placeholder: "¿Quién decide, qué le preocupa y cómo habla de su problema?", multiline: true },
  "launch-step-01-06": { label: "Dolor principal y coste", placeholder: "Ej. Pierden solicitudes fuera de horario y dejan citas sin cerrar", multiline: true },
  "launch-step-01-07": { label: "Resultado que desea", placeholder: "Ej. Más primeras visitas sin ampliar el equipo de recepción", multiline: true },
  "launch-step-01-08": { label: "Objeciones que debemos resolver", placeholder: "Ej. Precio, tiempo de implementación y miedo a perder el trato humano", multiline: true },
  "launch-step-01-09": { label: "Competidores encontrados", placeholder: "Nombres o enlaces de las alternativas más relevantes", multiline: true },
  "launch-step-01-10": { label: "Análisis de la competencia", placeholder: "Resume sus promesas, mecanismos, ofertas, precios y llamadas a la acción", multiline: true },
  "launch-step-01-11": { label: "Oportunidad de diferenciación", placeholder: "¿Qué están dejando sin resolver los competidores?", multiline: true },
  "launch-step-01-13": { label: "Análisis de anuncios activos", placeholder: "Anota los ángulos, ofertas, creatividades, mensajes y llamadas a la acción que has encontrado", multiline: true },
  "launch-step-02-01": { label: "Nuestra propuesta de valor", placeholder: "Ayudamos a [micronicho] a [resultado] mediante [mecanismo], sin [objeción]", multiline: true },
  "launch-step-02-02": { label: "Resultado económico prometido", placeholder: "Ej. Recuperar 15 citas al mes" },
  "launch-step-02-03": { label: "Mecanismo IA", placeholder: "¿Cómo consigue la solución ese resultado? Explícalo sin tecnicismos", multiline: true },
  "launch-step-02-04": { label: "Oferta elegida", placeholder: "Ej. Auditoría gratuita + piloto de 14 días", multiline: true },
  "launch-step-02-05": { label: "Precio, mantenimiento y límites", placeholder: "Setup, cuota mensual, qué incluye y qué queda fuera", multiline: true },
  "launch-step-02-06": { label: "Lead magnet elegido", placeholder: "Ej. Checklist: 7 fugas de citas en tu clínica" },
  "launch-step-03-02": { label: "Titular de la página", placeholder: "Escribe aquí la frase principal que verá el visitante", multiline: true },
  "launch-step-03-06": { label: "Llamada a la acción", placeholder: "Ej. Reserva una auditoría gratuita" },
  "launch-step-04-03": { label: "Bio del perfil", placeholder: "Promesa, público y siguiente paso en pocas líneas", multiline: true },
  "launch-step-05-02": { label: "Guion de primer contacto", placeholder: "Escribe el mensaje base que usarás para iniciar conversaciones", multiline: true },
  "launch-step-06-10": { label: "Modelo de campañas elegido", placeholder: "Ej. Modelo directo: MOFU + BOFU" },
};

export function hasGoalStepField(id: string) {
  return Object.prototype.hasOwnProperty.call(goalStepFields, id);
}
