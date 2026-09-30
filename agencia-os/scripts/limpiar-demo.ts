// Borra los datos de ejemplo que crea prisma/seed.ts (clínicas, tareas,
// competidores, contenido, finanzas, MRR, gestor y nota ficticios).
// Solo toca registros que coinciden exactamente con los valores del seed.
//
//   npx tsx scripts/limpiar-demo.ts            -> muestra qué borraría
//   npx tsx scripts/limpiar-demo.ts --aplicar  -> lo borra
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const aplicar = process.argv.includes("--aplicar");

const clinicas = [
  { name: "Clínica Dental Velázquez", email: "lucia@clinicavelazquez.es" },
  { name: "Instituto Dental Turia", email: "carlos@dentalturia.es" },
  { name: "Clínica Sonrisa Norte", email: "elena@sonrisanorte.es" },
  { name: "Dental Costa Brava", contactName: "Marc Vidal" },
  { name: "Centro Odontológico Alba", email: "ana@odontologiaalba.es" },
  { name: "Clínica Dental Mar", contactName: "Marta Soler" },
];
const tareas = ["Preparar demo para Velázquez", "Enviar casos de éxito a Turia", "Revisar propuesta Sonrisa Norte", "Actualizar automatización de Alba"];
const competidores = ["Dental Growth Lab", "ClinicFlow AI", "Patient Engine"];
const contenido = ["5 fugas de pacientes en recepción", "Demo: seguimiento automático", "Caso Alba: 7 citas en una semana"];
const finanzas = [
  { description: "Cuota Centro Odontológico Alba", amountCents: 145000 },
  { description: "Implementación Clínica Río", amountCents: 220000 },
  { description: "Herramientas de automatización", amountCents: 38900 },
  { description: "Publicidad", amountCents: 62000 },
];
const mrr = [
  ["2026-04-01", 180000], ["2026-05-01", 275000], ["2026-06-01", 350000],
  ["2026-07-01", 470000], ["2026-08-01", 565000], ["2026-09-01", 648000],
] as const;
const gestor = [
  { title: "Figma", url: "https://figma.com" },
  { title: "Documentación interna", url: "https://example.com/docs" },
  { title: "Airtable", url: "https://airtable.com" },
];
const nota = "Argumentos para la próxima propuesta";

async function main() {
  const whereClinicas = { OR: clinicas };
  const whereTareas = { title: { in: tareas } };
  const whereCompetidores = { company: { in: competidores } };
  const whereContenido = { title: { in: contenido } };
  const whereFinanzas = { OR: finanzas };
  const whereMrr = { OR: mrr.map(([m, a]) => ({ month: new Date(`${m}T00:00:00Z`), amountCents: a })) };
  const whereGestor = { OR: gestor };
  const whereNota = { title: nota };

  const resumen = {
    clinicas: await prisma.clinic.findMany({ where: whereClinicas, select: { name: true } }),
    tareas: await prisma.task.count({ where: whereTareas }),
    competidores: await prisma.competitor.count({ where: whereCompetidores }),
    contenido: await prisma.contentItem.count({ where: whereContenido }),
    finanzas: await prisma.financeEntry.count({ where: whereFinanzas }),
    mrr: await prisma.mrrSnapshot.count({ where: whereMrr }),
    gestor: await prisma.vaultItem.count({ where: whereGestor }),
    nota: await prisma.note.count({ where: whereNota }),
  };
  console.log("Clínicas de ejemplo encontradas:", resumen.clinicas.map((c) => c.name).join(", ") || "ninguna");
  console.log(`Tareas ${resumen.tareas} · Competidores ${resumen.competidores} · Contenido ${resumen.contenido} · Finanzas ${resumen.finanzas} · MRR ${resumen.mrr} · Gestor ${resumen.gestor} · Nota ${resumen.nota}`);

  if (!aplicar) {
    console.log("\nNo se ha borrado nada. Ejecuta con --aplicar para borrarlo.");
    return;
  }

  await prisma.$transaction([
    prisma.task.deleteMany({ where: whereTareas }),
    prisma.financeEntry.deleteMany({ where: whereFinanzas }),
    prisma.clinic.deleteMany({ where: whereClinicas }),
    prisma.competitor.deleteMany({ where: whereCompetidores }),
    prisma.contentItem.deleteMany({ where: whereContenido }),
    prisma.mrrSnapshot.deleteMany({ where: whereMrr }),
    prisma.vaultItem.deleteMany({ where: whereGestor }),
    prisma.note.deleteMany({ where: whereNota }),
  ]);
  console.log("\nDatos de ejemplo borrados.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
