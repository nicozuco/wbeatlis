import { phaseLabels, threatLabels } from "@/lib/domain";

const phaseClasses: Record<string, string> = {
  UNCONTACTED: "phase-uncontacted",
  CONTACTED: "phase-contacted",
  RESPONDED: "phase-responded",
  MEETING_SCHEDULED: "phase-meeting",
  PROPOSAL_SENT: "phase-proposal",
  CONTRACTED: "phase-contracted",
  CONTRACT_SIGNED: "phase-signed",
  FIRST_PAYMENT: "phase-first-payment",
  ONBOARDING: "phase-onboarding",
  ACTIVE: "phase-active",
  DISCARDED: "phase-discarded",
};

const threatClasses: Record<string, string> = {
  LEVEL_1: "threat-1",
  LEVEL_2: "threat-2",
  LEVEL_3: "threat-3",
  LEVEL_4: "threat-4",
  LEVEL_5: "threat-5",
  INTERNATIONAL: "threat-international",
};

export function PhaseChip({ phase }: { phase: string }) {
  return <span className={`status-chip ${phaseClasses[phase] ?? "phase-uncontacted"}`}>{phaseLabels[phase as keyof typeof phaseLabels] ?? phase}</span>;
}

export function ThreatChip({ level }: { level: string }) {
  return <span className={`status-chip ${threatClasses[level] ?? "threat-5"}`}>{threatLabels[level as keyof typeof threatLabels] ?? level}</span>;
}

export function ToneChip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "violet" }) {
  return <span className={`status-chip tone-${tone}`}>{children}</span>;
}
