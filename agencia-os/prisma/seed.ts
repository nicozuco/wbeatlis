import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Datos ficticios solo para desarrollo: no se cargan salvo con SEED_DEMO=1.
  if (process.env.SEED_DEMO !== "1") {
    console.log("Seed de ejemplo omitido. Usa SEED_DEMO=1 para cargar datos ficticios.");
    return;
  }
  const existing = await prisma.clinic.count();
  if (existing > 0) return;

  const velazquez = await prisma.clinic.create({
    data: {
      name: "Clínica Dental Velázquez",
      city: "Madrid",
      contactName: "Lucía Herrera",
      phone: "+34 610 234 890",
      email: "lucia@clinicavelazquez.es",
      instagram: "@clinicavelazquez",
      website: "https://example.com/velazquez",
      phase: "MEETING_SCHEDULED",
      leadSource: "Instagram",
      firstContactAt: new Date("2026-09-02T09:30:00+02:00"),
      lastInteractionAt: new Date("2026-09-13T11:20:00+02:00"),
      nextFollowUpAt: new Date("2026-09-14T16:30:00+02:00"),
      monthlyFeeCents: 120000,
      interactions: {
        create: [
          { occurredAt: new Date("2026-09-02T09:30:00+02:00"), note: "Primer contacto por Instagram. Interés en automatizar la recepción." },
          { occurredAt: new Date("2026-09-13T11:20:00+02:00"), note: "Reunión agendada con dirección para revisar el flujo de pacientes." },
        ],
      },
      stageEvents: {
        create: [
          { fromPhase: "UNCONTACTED", toPhase: "CONTACTED", changedAt: new Date("2026-09-02T09:30:00+02:00") },
          { fromPhase: "CONTACTED", toPhase: "RESPONDED", changedAt: new Date("2026-09-05T12:10:00+02:00") },
          { fromPhase: "RESPONDED", toPhase: "MEETING_SCHEDULED", changedAt: new Date("2026-09-13T11:20:00+02:00") },
        ],
      },
    },
  });

  const turia = await prisma.clinic.create({
    data: {
      name: "Instituto Dental Turia",
      city: "Valencia",
      contactName: "Carlos Mena",
      phone: "+34 620 485 110",
      email: "carlos@dentalturia.es",
      instagram: "@dentalturia",
      phase: "RESPONDED",
      leadSource: "Email frío",
      firstContactAt: new Date("2026-09-07T10:10:00+02:00"),
      lastInteractionAt: new Date("2026-09-12T17:45:00+02:00"),
      nextFollowUpAt: new Date("2026-09-15T10:00:00+02:00"),
      interactions: { create: [{ occurredAt: new Date("2026-09-12T17:45:00+02:00"), note: "Carlos respondió y pidió casos de uso en clínicas de tamaño similar." }] },
      stageEvents: { create: [{ fromPhase: "CONTACTED", toPhase: "RESPONDED", changedAt: new Date("2026-09-12T17:45:00+02:00") }] },
    },
  });

  const norte = await prisma.clinic.create({
    data: {
      name: "Clínica Sonrisa Norte",
      city: "Bilbao",
      contactName: "Elena Ruiz",
      email: "elena@sonrisanorte.es",
      website: "https://example.com/sonrisa-norte",
      phase: "PROPOSAL_SENT",
      leadSource: "Referido",
      firstContactAt: new Date("2026-08-22T12:00:00+02:00"),
      lastInteractionAt: new Date("2026-09-10T09:15:00+02:00"),
      nextFollowUpAt: new Date("2026-09-11T09:00:00+02:00"),
      monthlyFeeCents: 95000,
      interactions: { create: [{ occurredAt: new Date("2026-09-10T09:15:00+02:00"), note: "Propuesta enviada para captación y seguimiento automático de leads." }] },
      stageEvents: { create: [{ fromPhase: "MEETING_SCHEDULED", toPhase: "PROPOSAL_SENT", changedAt: new Date("2026-09-10T09:15:00+02:00") }] },
    },
  });

  await prisma.clinic.create({
    data: {
      name: "Dental Costa Brava",
      city: "Girona",
      contactName: "Marc Vidal",
      phone: "+34 611 980 452",
      phase: "CONTACTED",
      leadSource: "LinkedIn",
      firstContactAt: new Date("2026-09-11T12:40:00+02:00"),
      lastInteractionAt: new Date("2026-09-11T12:40:00+02:00"),
      nextFollowUpAt: new Date("2026-09-19T12:00:00+02:00"),
      interactions: { create: [{ occurredAt: new Date("2026-09-11T12:40:00+02:00"), note: "Mensaje enviado al director de la clínica por LinkedIn." }] },
      stageEvents: { create: [{ fromPhase: "UNCONTACTED", toPhase: "CONTACTED", changedAt: new Date("2026-09-11T12:40:00+02:00") }] },
    },
  });

  const alba = await prisma.clinic.create({
    data: {
      name: "Centro Odontológico Alba",
      city: "Sevilla",
      contactName: "Ana Robles",
      email: "ana@odontologiaalba.es",
      phase: "CONTRACTED",
      leadSource: "Referido",
      firstContactAt: new Date("2026-07-08T10:00:00+02:00"),
      lastInteractionAt: new Date("2026-09-12T10:30:00+02:00"),
      nextFollowUpAt: new Date("2026-09-22T10:30:00+02:00"),
      monthlyFeeCents: 145000,
      interactions: { create: [{ occurredAt: new Date("2026-09-12T10:30:00+02:00"), note: "Revisión semanal: 18 solicitudes cualificadas y 7 citas confirmadas." }] },
      stageEvents: { create: [{ fromPhase: "PROPOSAL_SENT", toPhase: "CONTRACTED", changedAt: new Date("2026-07-20T13:00:00+02:00") }] },
    },
  });

  await prisma.clinic.create({
    data: {
      name: "Clínica Dental Mar",
      city: "Alicante",
      contactName: "Marta Soler",
      phase: "UNCONTACTED",
      leadSource: "Prospección",
    },
  });

  await prisma.task.createMany({
    data: [
      { title: "Preparar demo para Velázquez", category: "Ventas", priority: "URGENT", status: "IN_PROGRESS", dueAt: new Date("2026-09-14T16:00:00+02:00"), clinicId: velazquez.id },
      { title: "Enviar casos de éxito a Turia", category: "Seguimiento", priority: "IMPORTANT", status: "TODO", dueAt: new Date("2026-09-15T10:00:00+02:00"), clinicId: turia.id },
      { title: "Revisar propuesta Sonrisa Norte", category: "Ventas", priority: "URGENT", status: "TODO", dueAt: new Date("2026-09-12T12:00:00+02:00"), clinicId: norte.id },
      { title: "Actualizar automatización de Alba", category: "Operaciones", priority: "IMPORTANT", status: "DONE", dueAt: new Date("2026-09-13T18:00:00+02:00"), completedAt: new Date("2026-09-13T17:20:00+02:00"), clinicId: alba.id },
    ],
  });

  await prisma.competitor.createMany({
    data: [
      { threatLevel: "LEVEL_1", ranking: 1, company: "Dental Growth Lab", agencyType: "Agencia nicho", category: "MIXED", niche: "Clínicas dentales", instagram: "@dentalgrowthlab", followersCount: 18400, postCount: 642, website: "https://example.com/dental-growth", location: "Madrid", trackRecord: "6 años", publicPrice: "Desde 1.500 €/mes", followed: true, lastReviewedAt: new Date("2026-09-10T10:00:00+02:00") },
      { threatLevel: "LEVEL_2", ranking: 2, company: "ClinicFlow AI", agencyType: "Automatización", category: "AI", niche: "Salud privada", instagram: "@clinicflowai", followersCount: 9200, postCount: 311, website: "https://example.com/clinic-flow", location: "Barcelona", trackRecord: "3 años", publicPrice: "Consultar", followed: true, lastReviewedAt: new Date("2026-09-08T10:00:00+02:00") },
      { threatLevel: "INTERNATIONAL", ranking: 3, company: "Patient Engine", agencyType: "SaaS + agencia", category: "MIXED", niche: "Dental", followersCount: 31700, postCount: 905, website: "https://example.com/patient-engine", location: "Reino Unido", trackRecord: "9 años", publicPrice: "2.000 €/mes", followed: false, lastReviewedAt: new Date("2026-08-28T10:00:00+02:00") },
    ],
  });

  await prisma.contentItem.createMany({
    data: [
      { title: "5 fugas de pacientes en recepción", format: "CAROUSEL", status: "DESIGN", scheduledFor: new Date("2026-09-16T12:00:00+02:00"), script: "Abrir con el coste real de no responder un lead en menos de cinco minutos." },
      { title: "Demo: seguimiento automático", format: "REEL", status: "SCRIPT", scheduledFor: new Date("2026-09-19T12:00:00+02:00"), script: "Mostrar conversación, recordatorio y cita confirmada en menos de 30 segundos." },
      { title: "Caso Alba: 7 citas en una semana", format: "IMAGE", status: "SCHEDULED", scheduledFor: new Date("2026-09-22T12:00:00+02:00"), script: "Resultado, contexto y llamada a conversación privada." },
    ],
  });

  await prisma.financeEntry.createMany({
    data: [
      { type: "INCOME", description: "Cuota Centro Odontológico Alba", amountCents: 145000, occurredAt: new Date("2026-09-01T09:00:00+02:00"), clinicId: alba.id },
      { type: "INCOME", description: "Implementación Clínica Río", amountCents: 220000, occurredAt: new Date("2026-09-04T09:00:00+02:00") },
      { type: "EXPENSE", description: "Herramientas de automatización", amountCents: 38900, occurredAt: new Date("2026-09-05T09:00:00+02:00") },
      { type: "EXPENSE", description: "Publicidad", amountCents: 62000, occurredAt: new Date("2026-09-08T09:00:00+02:00") },
    ],
  });

  await prisma.mrrSnapshot.createMany({
    data: [
      { month: new Date("2026-04-01T00:00:00Z"), amountCents: 180000 },
      { month: new Date("2026-05-01T00:00:00Z"), amountCents: 275000 },
      { month: new Date("2026-06-01T00:00:00Z"), amountCents: 350000 },
      { month: new Date("2026-07-01T00:00:00Z"), amountCents: 470000 },
      { month: new Date("2026-08-01T00:00:00Z"), amountCents: 565000 },
      { month: new Date("2026-09-01T00:00:00Z"), amountCents: 648000 },
    ],
  });

  // Entradas de muestra sin credenciales. El gestor cifra las cuentas en el servidor.
  await prisma.vaultItem.createMany({
    data: [
      { title: "Figma", url: "https://figma.com", description: "Diseño de propuestas y creatividades.", category: "Diseño" },
      { title: "Documentación interna", url: "https://example.com/docs", description: "Procesos, playbooks y entregables.", category: "Operaciones" },
      { title: "Airtable", url: "https://airtable.com", description: "Bases auxiliares y fuentes compartidas.", category: "Datos" },
    ],
  });

  await prisma.note.create({
    data: {
      title: "Argumentos para la próxima propuesta",
      body: "## Enfoque\n\n- Hablar de **citas confirmadas**, no de tecnología.\n- Mostrar el coste de responder tarde.\n- Terminar con un plan de implantación de 14 días.",
      tags: { create: [{ name: "ventas" }, { name: "propuestas" }] },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
