// Analítica de las propuestas públicas (propuestas.atlisclinicas.com).
// Cada evento se envía una vez por sesión del navegador, así que «abierta»
// cuenta visitas y el resto, visitas que llegaron a ese punto.

export const proposalEvents = ["abierta", "leida", "demo_pulsada", "compartida"] as const;
export type ProposalEventName = typeof proposalEvents[number];

export const proposalEventLabels: Record<ProposalEventName, string> = {
  abierta: "Abrió la propuesta",
  leida: "Llegó a la oferta",
  demo_pulsada: "Pulsó «Pedir demo»",
  compartida: "La compartió",
};

export const isProposalEvent = (value: string): value is ProposalEventName => (proposalEvents as readonly string[]).includes(value);

export type ProposalEventRow = {
  slug: string; clinicName: string; event: string; seconds: number;
  device: string | null; city: string | null; occurredAt: string;
};

export type ProposalSummary = {
  slug: string; clinicName: string; clinicId: string | null;
  visits: number; read: number; demo: number; shared: number;
  firstAt: string; lastAt: string; lastDevice: string | null; lastCity: string | null;
  stage: ProposalEventName;
};

// Normaliza para emparejar «Clínica Déniz» con la ficha «clinica deniz» del CRM.
export const normalizeName = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const stageRank: Record<ProposalEventName, number> = { abierta: 0, leida: 1, compartida: 2, demo_pulsada: 3 };

export function proposalAnalytics(events: ProposalEventRow[], clinics: { id: string; name: string }[] = []) {
  const clinicByName = new Map(clinics.map((clinic) => [normalizeName(clinic.name), clinic.id]));
  const bySlug = new Map<string, ProposalSummary>();
  const sorted = [...events].filter((event) => isProposalEvent(event.event)).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  for (const event of sorted) {
    const name = event.event as ProposalEventName;
    let row = bySlug.get(event.slug);
    if (!row) {
      row = { slug: event.slug, clinicName: event.clinicName || event.slug, clinicId: null, visits: 0, read: 0, demo: 0, shared: 0, firstAt: event.occurredAt, lastAt: event.occurredAt, lastDevice: null, lastCity: null, stage: "abierta" };
      bySlug.set(event.slug, row);
    }
    if (event.clinicName) row.clinicName = event.clinicName;
    if (name === "abierta") row.visits += 1;
    if (name === "leida") row.read += 1;
    if (name === "demo_pulsada") row.demo += 1;
    if (name === "compartida") row.shared += 1;
    if (stageRank[name] > stageRank[row.stage]) row.stage = name;
    row.lastAt = event.occurredAt;
    row.lastDevice = event.device ?? row.lastDevice;
    row.lastCity = event.city || row.lastCity;
  }

  const rows = [...bySlug.values()]
    .map((row) => ({ ...row, clinicId: clinicByName.get(normalizeName(row.clinicName)) ?? null }))
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  return {
    rows,
    opened: rows.filter((row) => row.visits > 0).length,
    read: rows.filter((row) => row.read > 0).length,
    demo: rows.filter((row) => row.demo > 0).length,
    shared: rows.filter((row) => row.shared > 0).length,
    visits: rows.reduce((sum, row) => sum + row.visits, 0),
    recent: [...sorted].reverse().slice(0, 15),
  };
}
