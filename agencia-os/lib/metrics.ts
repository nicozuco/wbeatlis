import { isWonPhase, wonPhases } from "./domain";

// Fases que implican que la clínica llegó a responder en algún momento
// (incluidas Contratado y todas las de servicio).
const RESPONDED_PHASES = new Set<string>(["RESPONDED", "MEETING_SCHEDULED", "PROPOSAL_SENT", ...wonPhases]);

type ClinicForRates = {
  phase: string;
  firstContactAt: Date | string | null;
  stageEvents: { toPhase: string; fromPhase?: string | null }[];
};

// Un descarte previo al contacto no es una clínica contactada.
const contactedPhases = new Set(["CONTACTED", ...RESPONDED_PHASES]);
export const isContacted = (clinic: ClinicForRates) => contactedPhases.has(clinic.phase) || clinic.firstContactAt !== null || clinic.stageEvents.some((event) => contactedPhases.has(event.toPhase) || (event.fromPhase != null && contactedPhases.has(event.fromPhase)));

// Numeradores y denominador de las tasas del pipeline. Respondidas y contratadas
// se cuentan solo dentro del grupo de contactadas, así una tasa nunca pasa del
// 100%. Una clínica cuenta como respondida si está en una fase de respuesta o
// pasó por alguna (aunque luego se descartara). Contratadas son las que están en
// Contratado o en una fase de servicio.
export function pipelineCounts(clinics: ClinicForRates[]) {
  const contacted = clinics.filter(isContacted);
  const responded = contacted.filter((clinic) => RESPONDED_PHASES.has(clinic.phase) || clinic.stageEvents.some((event) => RESPONDED_PHASES.has(event.toPhase) || (event.fromPhase != null && RESPONDED_PHASES.has(event.fromPhase))));
  const contracted = contacted.filter((clinic) => isWonPhase(clinic.phase));
  return { contacted: contacted.length, responded: responded.length, contracted: contracted.length };
}
