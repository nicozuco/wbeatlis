import { MRR_PHASE } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

// Clave de MrrSnapshot: día 1 del mes a medianoche UTC (mismo formato que el seed).
export const monthKey = (date = new Date()) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));

// MRR = suma de las cuotas mensuales de las clínicas en fase Cliente activo.
export async function currentMrrCents() {
  const { _sum } = await prisma.clinic.aggregate({ where: { phase: MRR_PHASE }, _sum: { monthlyFeeCents: true } });
  return _sum.monthlyFeeCents ?? 0;
}

// Guarda el MRR del mes en curso. Se llama cada vez que cambia algo que afecta
// al MRR (alta, edición, cambio de fase o borrado de una clínica) y al abrir
// Finanzas. Mientras dura el mes el valor se va actualizando; al empezar el
// siguiente, la fila del mes anterior ya no se vuelve a tocar: ese es el cierre.
export async function recordMrrSnapshot() {
  const amountCents = await currentMrrCents();
  const month = monthKey();
  await prisma.mrrSnapshot.upsert({
    where: { month },
    create: { month, amountCents },
    update: { amountCents, capturedAt: new Date() },
  });
  return amountCents;
}
