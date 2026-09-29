import { servicePhases, type PipelinePhaseValue } from "./domain";

export const salesPhases = ["UNCONTACTED", "CONTACTED", "RESPONDED", "MEETING_SCHEDULED", "PROPOSAL_SENT", "CONTRACTED"] as const;

// Proceso completo en orden: venta y después servicio.
export const processPhases = [...salesPhases, ...servicePhases] as const;

type PhaseGuide = { objective: string; steps: { key: string; label: string }[]; next: PipelinePhaseValue | null };

export const phaseGuides: Record<PipelinePhaseValue, PhaseGuide> = {
  UNCONTACTED: {
    objective: "Prepara un primer contacto relevante para esta clínica.",
    steps: [
      { key: "research", label: "Revisar la clínica e identificar una necesidad concreta" },
      { key: "decision-maker", label: "Identificar a la persona de contacto y el canal" },
      { key: "outreach", label: "Enviar el primer mensaje personalizado o realizar la llamada" },
    ],
    next: "CONTACTED",
  },
  CONTACTED: {
    objective: "Consigue una respuesta y abre la conversación.",
    steps: [
      { key: "log-contact", label: "Registrar qué se ha enviado y por qué canal" },
      { key: "follow-up", label: "Hacer seguimiento si no hay respuesta" },
      { key: "reply", label: "Confirmar que la clínica ha respondido" },
    ],
    next: "RESPONDED",
  },
  RESPONDED: {
    objective: "Entiende la necesidad y acuerda una reunión.",
    steps: [
      { key: "qualify", label: "Aclarar necesidades, encaje y quién decide" },
      { key: "offer-meeting", label: "Proponer una reunión con un objetivo concreto" },
      { key: "confirm-meeting", label: "Confirmar fecha, hora y asistentes" },
    ],
    next: "MEETING_SCHEDULED",
  },
  MEETING_SCHEDULED: {
    objective: "Convierte el diagnóstico en una propuesta concreta.",
    steps: [
      { key: "hold-meeting", label: "Celebrar la reunión y registrar el diagnóstico" },
      { key: "scope", label: "Definir solución, alcance, precio y plazos" },
      { key: "send-proposal", label: "Enviar la propuesta y acordar su revisión" },
    ],
    next: "PROPOSAL_SENT",
  },
  PROPOSAL_SENT: {
    objective: "Resuelve dudas y formaliza el acuerdo.",
    steps: [
      { key: "objections", label: "Revisar la propuesta y resolver objeciones" },
      { key: "terms", label: "Confirmar precio, condiciones y fecha de inicio" },
      { key: "agreement", label: "Obtener la aceptación o el contrato firmado" },
    ],
    next: "CONTRACTED",
  },
  CONTRACTED: {
    objective: "Formaliza el acuerdo con un contrato firmado.",
    steps: [
      { key: "prepare-contract", label: "Preparar el contrato con precio, alcance y fecha de inicio" },
      { key: "send-contract", label: "Enviar el contrato a la clínica para firmar" },
      { key: "signature", label: "Recibir el contrato firmado y guardarlo" },
    ],
    next: "CONTRACT_SIGNED",
  },
  CONTRACT_SIGNED: {
    objective: "Cobra la primera cuota antes de empezar el servicio.",
    steps: [
      { key: "invoice", label: "Emitir la primera factura" },
      { key: "send-invoice", label: "Enviar la factura con los datos de pago" },
      { key: "payment", label: "Confirmar que el cobro se ha recibido" },
    ],
    next: "FIRST_PAYMENT",
  },
  FIRST_PAYMENT: {
    objective: "Prepara la implantación del servicio.",
    steps: [
      { key: "welcome", label: "Hacer la reunión de bienvenida y recopilar accesos" },
      { key: "setup", label: "Configurar las automatizaciones de la clínica" },
      { key: "tests", label: "Probar el sistema con el equipo de la clínica" },
    ],
    next: "ONBOARDING",
  },
  ONBOARDING: {
    objective: "Pon el servicio en marcha y valida los primeros resultados.",
    steps: [
      { key: "launch", label: "Activar el servicio con pacientes reales" },
      { key: "training", label: "Formar al equipo de la clínica" },
      { key: "first-review", label: "Hacer la primera revisión de resultados" },
    ],
    next: "ACTIVE",
  },
  ACTIVE: { objective: "Servicio en marcha: cobra cada mes y cuida la relación con revisiones periódicas.", steps: [], next: null },
  DISCARDED: { objective: "Oportunidad cerrada. Conserva el motivo en el historial; puedes reabrirla desde la ficha.", steps: [], next: null },
};

// Fases que pueden tener tareas obligatorias: todas las que tienen una fase siguiente.
export const gatePhases = ["UNCONTACTED", "CONTACTED", "RESPONDED", "MEETING_SCHEDULED", "PROPOSAL_SENT", "CONTRACTED", "CONTRACT_SIGNED", "FIRST_PAYMENT", "ONBOARDING"] as const satisfies readonly (typeof processPhases)[number][];
export type GatePhase = (typeof gatePhases)[number];

const processIndex = (phase: PipelinePhaseValue) => (processPhases as readonly string[]).indexOf(phase);

// Avanzar es ir a una fase posterior del proceso (también saltando fases).
// Descartar o volver atrás no cuenta como avance.
export function isForwardMove(from: PipelinePhaseValue, to: PipelinePhaseValue) {
  const fromIndex = processIndex(from);
  return fromIndex >= 0 && processIndex(to) > fromIndex;
}

// ¿Llega a `target` (o la supera) al moverse de `from` a `to`, sin estar ya en ella antes?
export function passesThrough(from: PipelinePhaseValue, to: PipelinePhaseValue, target: PipelinePhaseValue) {
  const fromIndex = processIndex(from);
  const targetIndex = processIndex(target);
  return fromIndex >= 0 && fromIndex < targetIndex && targetIndex <= processIndex(to);
}

export const FIRST_PAYMENT_DESCRIPTION = "Primer cobro";

export type ProcessCheck = { phase: PipelinePhaseValue; stepKey: string; completedAt: string | null };

export function checklistProgress(phase: PipelinePhaseValue, checks: ProcessCheck[]) {
  const steps = phaseGuides[phase].steps;
  const completed = steps.filter((step) => checks.some((check) => check.phase === phase && check.stepKey === step.key && check.completedAt)).length;
  return { completed, total: steps.length, ready: steps.length > 0 && completed === steps.length };
}

export function phaseAgeDays(createdAt: string, events: { changedAt: string }[], now: Date) {
  const enteredAt = events.reduce((latest, event) => Math.max(latest, new Date(event.changedAt).getTime()), new Date(createdAt).getTime());
  return Math.max(0, Math.floor((now.getTime() - enteredAt) / 86_400_000));
}

export function isFollowUpOverdue(date: string | null, now: Date) {
  if (!date) return false;
  const day = (value: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(value);
  return day(new Date(date)) < day(now);
}
