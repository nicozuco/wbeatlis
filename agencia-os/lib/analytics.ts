import { MRR_PHASE, isWonPhase, phaseLabels, pipelinePhases, type PipelinePhaseValue } from "./domain";
import { isFollowUpOverdue, phaseAgeDays, salesPhases } from "./client-process";
import { pipelineCounts } from "./metrics";
import type { ProposalEventRow } from "./proposals";
import type { SitePageviewRow, SiteSessionRow } from "./site-analytics";

export type AnalyticsClient = {
  id: string; name: string; phase: PipelinePhaseValue; city: string | null; leadSource: string | null;
  createdAt: string; firstContactAt: string | null; nextFollowUpAt: string | null; monthlyFeeCents: number;
  stageEvents: { fromPhase: PipelinePhaseValue | null; toPhase: PipelinePhaseValue; changedAt: string }[];
};
export type AnalyticsData = {
  clients: AnalyticsClient[];
  finances: { type: "INCOME" | "EXPENSE"; amountCents: number; occurredAt: string }[];
  tasks: { status: string; createdAt: string; dueAt: string | null }[];
  content: { status: string; createdAt: string }[];
  proposalEvents: ProposalEventRow[];
  siteSessions: SiteSessionRow[];
  sitePageviews: SitePageviewRow[];
  now: string;
};

export const percent = (part: number, total: number) => total > 0 ? part / total * 100 : null;
export const madridDay = (value: string | Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date(value));

export function periodStart(period: string, now: string) {
  if (period === "all") return null;
  const day = new Date(`${madridDay(now)}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - Number(period) + 1);
  return day.toISOString().slice(0, 10);
}

export function inPeriod(value: string, start: string | null, now: string) {
  const day = madridDay(value);
  return (!start || day >= start) && day <= madridDay(now);
}

// El embudo mide alcance histórico: una fase posterior implica las anteriores.
// Un descarte por sí solo no implica contacto ni respuesta.
export function highestReached(client: AnalyticsClient) {
  // Las fases de servicio implican haber contratado: cuentan como la última fase comercial.
  const rank = (phase: PipelinePhaseValue) => (isWonPhase(phase) ? salesPhases.length - 1 : salesPhases.indexOf(phase as typeof salesPhases[number]));
  return Math.max(0, rank(client.phase), client.firstContactAt ? 1 : 0, ...client.stageEvents.flatMap((event) => [rank(event.toPhase), event.fromPhase ? rank(event.fromPhase) : 0]));
}

export function commercialAnalytics(clients: AnalyticsClient[], now: string) {
  const counts = pipelineCounts(clients);
  const total = clients.length;
  const reached = clients.map(highestReached);
  const funnel = salesPhases.map((phase, index) => {
    const count = reached.filter((rank) => rank >= index).length;
    const previous = index === 0 ? total : reached.filter((rank) => rank >= index - 1).length;
    return { phase, label: index === 0 ? "Registradas" : index === 5 ? "Contrataron alguna vez" : phaseLabels[phase], count, share: percent(count, total), conversion: percent(count, previous), lost: previous - count };
  });
  // Oportunidades abiertas: ni ganadas ni descartadas.
  const active = clients.filter((client) => !isWonPhase(client.phase) && client.phase !== "DISCARDED");
  const discarded = clients.filter((client) => client.phase === "DISCARDED").length;
  const overdue = active.filter((client) => isFollowUpOverdue(client.nextFollowUpAt, new Date(now))).length;
  const missingFollowUp = active.filter((client) => !client.nextFollowUpAt).length;
  const distribution = pipelinePhases.map((phase) => ({ phase, label: phaseLabels[phase], count: clients.filter((client) => client.phase === phase).length }));
  const sources = [...new Set(clients.map((client) => client.leadSource || "Sin origen"))].map((source) => {
    const group = clients.filter((client) => (client.leadSource || "Sin origen") === source);
    const rates = pipelineCounts(group);
    return { source, total: group.length, ...rates, conversion: percent(rates.contracted, rates.contacted), mrr: group.filter((client) => client.phase === MRR_PHASE).reduce((sum, client) => sum + client.monthlyFeeCents, 0) };
  }).sort((a, b) => b.contracted - a.contracted || b.total - a.total);
  const phaseAges = salesPhases.slice(0, -1).map((phase) => {
    const group = active.filter((client) => client.phase === phase);
    return { phase, label: phaseLabels[phase], count: group.length, days: group.length ? group.reduce((sum, client) => sum + phaseAgeDays(client.createdAt, client.stageEvents, new Date(now)), 0) / group.length : null };
  });
  const cycles = clients.flatMap((client) => {
    const contractedAt = client.stageEvents.filter((event) => isWonPhase(event.toPhase) && event.fromPhase !== null && !isWonPhase(event.fromPhase)).map((event) => new Date(event.changedAt).getTime()).sort((a, b) => a - b)[0];
    const first = client.firstContactAt ? new Date(client.firstContactAt).getTime() : null;
    return first !== null && contractedAt !== undefined && contractedAt >= first ? [(contractedAt - first) / 86_400_000] : [];
  });
  return { total, ...counts, funnel, active: active.length, discarded, overdue, missingFollowUp, distribution, sources, phaseAges,
    cycleDays: cycles.length ? cycles.reduce((sum, days) => sum + days, 0) / cycles.length : null, cycleSample: cycles.length,
    mrr: clients.filter((client) => client.phase === MRR_PHASE).reduce((sum, client) => sum + client.monthlyFeeCents, 0),
    potential: active.reduce((sum, client) => sum + client.monthlyFeeCents, 0),
  };
}

export function monthlyActivity(clients: AnalyticsClient[], now: string) {
  const [year, month] = madridDay(now).split("-").map(Number);
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 6 + index, 1, 12));
    const key = date.toISOString().slice(0, 7);
    return {
      month: new Intl.DateTimeFormat("es-ES", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date),
      altas: clients.filter((client) => madridDay(client.createdAt).startsWith(key)).length,
      contratos: clients.filter((client) => {
        const first = client.stageEvents.filter((event) => isWonPhase(event.toPhase) && !(event.fromPhase && isWonPhase(event.fromPhase))).sort((a, b) => a.changedAt.localeCompare(b.changedAt))[0];
        return first && madridDay(first.changedAt).startsWith(key) && first.changedAt <= now;
      }).length,
    };
  });
}

export function financeAnalytics(entries: AnalyticsData["finances"]) {
  const income = entries.filter((entry) => entry.type === "INCOME").reduce((sum, entry) => sum + entry.amountCents, 0);
  const expenses = entries.filter((entry) => entry.type === "EXPENSE").reduce((sum, entry) => sum + entry.amountCents, 0);
  const months = [...new Set(entries.map((entry) => madridDay(entry.occurredAt).slice(0, 7)))].sort();
  // Completa los meses sin movimientos entre el primero y el último.
  if (months.length > 1) {
    const cursor = new Date(`${months[0]}-01T12:00:00Z`);
    const lastMonth = months[months.length - 1];
    while (cursor.toISOString().slice(0, 7) < lastMonth) {
      const key = cursor.toISOString().slice(0, 7);
      if (!months.includes(key)) months.push(key);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    months.sort();
  }
  const monthly = months.map((month) => {
    const group = entries.filter((entry) => madridDay(entry.occurredAt).startsWith(month));
    return { month, ingresos: group.filter((entry) => entry.type === "INCOME").reduce((sum, entry) => sum + entry.amountCents, 0) / 100, gastos: group.filter((entry) => entry.type === "EXPENSE").reduce((sum, entry) => sum + entry.amountCents, 0) / 100 };
  });
  return { income, expenses, balance: income - expenses, margin: income > 0 ? (income - expenses) / income * 100 : null, monthly };
}
