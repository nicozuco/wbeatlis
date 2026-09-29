export const pipelinePhases = [
  "UNCONTACTED",
  "CONTACTED",
  "RESPONDED",
  "MEETING_SCHEDULED",
  "PROPOSAL_SENT",
  "CONTRACTED",
  "CONTRACT_SIGNED",
  "FIRST_PAYMENT",
  "ONBOARDING",
  "ACTIVE",
  "DISCARDED",
] as const;

export type PipelinePhaseValue = (typeof pipelinePhases)[number];

export const phaseLabels: Record<PipelinePhaseValue, string> = {
  UNCONTACTED: "Por contactar",
  CONTACTED: "Contactado",
  RESPONDED: "Respondido",
  MEETING_SCHEDULED: "Reunión agendada",
  PROPOSAL_SENT: "Propuesta enviada",
  CONTRACTED: "Contratado",
  CONTRACT_SIGNED: "Contrato firmado",
  FIRST_PAYMENT: "Primer cobro",
  ONBOARDING: "Implantación",
  ACTIVE: "Cliente activo",
  DISCARDED: "Descartado",
};

// Fases de servicio (posventa), después de Contratado.
export const servicePhases = ["CONTRACT_SIGNED", "FIRST_PAYMENT", "ONBOARDING", "ACTIVE"] as const;

// Clientes ganados: Contratado o cualquier fase de servicio. Cuentan como
// contratados en las tasas y el embudo comercial.
export const wonPhases = ["CONTRACTED", ...servicePhases] as const;
export const isWonPhase = (phase: string) => (wonPhases as readonly string[]).includes(phase);

// Solo los clientes activos suman al MRR.
export const MRR_PHASE = "ACTIVE" satisfies PipelinePhaseValue;

export const taskStatusLabels = {
  TODO: "Pendiente",
  IN_PROGRESS: "En curso",
  DONE: "Hecha",
} as const;

export const contentStatusLabels = {
  IDEA: "Idea",
  SCRIPT: "Guion",
  DESIGN: "Diseño",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
} as const;

export const threatLabels = {
  LEVEL_1: "Nivel 1",
  LEVEL_2: "Nivel 2",
  LEVEL_3: "Nivel 3",
  LEVEL_4: "Nivel 4",
  LEVEL_5: "Nivel 5",
  INTERNATIONAL: "Internacional",
} as const;

export const mindMapNodeKinds = ["SHAPE", "STICKY", "DRAWING", "CLIENT", "COMPETITOR", "CONTENT_IDEA", "GROUP", "IMAGE", "LINK", "TABLE"] as const;
export type MindMapNodeKindValue = (typeof mindMapNodeKinds)[number];

export const mindMapNodeKindLabels: Record<MindMapNodeKindValue, string> = {
  SHAPE: "Forma",
  STICKY: "Pósit",
  DRAWING: "Dibujo",
  CLIENT: "Cliente",
  COMPETITOR: "Competidor",
  CONTENT_IDEA: "Idea de contenido",
  GROUP: "Grupo",
  IMAGE: "Imagen",
  LINK: "Enlace",
  TABLE: "Tabla",
};

export const mindMapEdgeStyles = ["SOLID", "DASHED", "ARROW"] as const;
export type MindMapEdgeStyleValue = (typeof mindMapEdgeStyles)[number];

export const mindMapEdgeStyleLabels: Record<MindMapEdgeStyleValue, string> = {
  SOLID: "Sólida",
  DASHED: "Discontinua",
  ARROW: "Con flecha",
};

// Misma paleta de tonos que ya usa ToneChip (components/shared/status-chip.tsx),
// reutilizada como color de las formas y los trazos del mapa mental.
export const noteTones = ["neutral", "accent", "success", "warning", "danger", "info", "violet"] as const;
export type NoteTone = (typeof noteTones)[number];
