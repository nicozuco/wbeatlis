import { FinanceWorkspace } from "@/components/finance/finance-workspace";
import { expenseSummaryForMonth } from "@/lib/finance";
import { recordMrrSnapshot } from "@/lib/mrr";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const now = new Date();
  const thisMonth = { gte: new Date(now.getFullYear(), now.getMonth(), 1), lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) };

  const mrr = await recordMrrSnapshot();
  const [entries, incomeAggregate, expenseEntries, incomeByClinic, clinics, snapshots] = await Promise.all([
    prisma.financeEntry.findMany({ include: { clinic: true }, orderBy: { occurredAt: "desc" }, take: 20 }),
    prisma.financeEntry.aggregate({ where: { type: "INCOME", occurredAt: thisMonth }, _sum: { amountCents: true } }),
    // Se cargan todos los gastos porque una suscripción iniciada meses atrás
    // sigue formando parte del gasto del mes actual.
    prisma.financeEntry.findMany({ where: { type: "EXPENSE" }, orderBy: { occurredAt: "desc" } }),
    prisma.financeEntry.groupBy({ by: ["clinicId"], where: { type: "INCOME", occurredAt: thisMonth }, _sum: { amountCents: true } }),
    prisma.clinic.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.mrrSnapshot.findMany({ orderBy: { month: "desc" }, take: 12 }),
  ]);

  const income = incomeAggregate._sum.amountCents ?? 0;
  const expenseSummary = expenseSummaryForMonth(expenseEntries, now);
  const expenses = expenseSummary.total;
  const clinicName = new Map(clinics.map((clinic) => [clinic.id, clinic.name]));
  const incomeByClient = incomeByClinic
    .map((row) => ({ id: row.clinicId, name: row.clinicId ? clinicName.get(row.clinicId) ?? "Cliente eliminado" : "Sin cliente asignado", amountCents: row._sum.amountCents ?? 0 }))
    .sort((a, b) => b.amountCents - a.amountCents);
  const chart = snapshots.reverse().map((snapshot) => ({
    month: new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" }).format(snapshot.month).replace(".", ""),
    amount: snapshot.amountCents / 100,
  }));

  return (
    <FinanceWorkspace
      mrr={mrr}
      income={income}
      expenses={expenses}
      profit={income - expenses}
      chart={chart}
      expenseSummary={expenseSummary}
      incomeByClient={incomeByClient}
      clinics={clinics}
      expenseEntries={expenseEntries.map((entry) => ({ id: entry.id, description: entry.description, amountCents: entry.amountCents, occurredAt: entry.occurredAt.toISOString(), expenseFrequency: entry.expenseFrequency!, expensePayer: entry.expensePayer! }))}
      entries={entries.map((entry) => ({ id: entry.id, type: entry.type, description: entry.description, amountCents: entry.amountCents, occurredAt: entry.occurredAt.toISOString(), clinicName: entry.clinic?.name ?? null, expenseFrequency: entry.expenseFrequency, expensePayer: entry.expensePayer }))}
    />
  );
}
