export const expenseFrequencies = ["ONE_TIME", "SUBSCRIPTION"] as const;
export type ExpenseFrequencyValue = typeof expenseFrequencies[number];

export const expensePayers = ["NICO", "JOEL", "SHARED"] as const;
export type ExpensePayerValue = typeof expensePayers[number];

export const expenseFrequencyLabels: Record<ExpenseFrequencyValue, string> = {
  ONE_TIME: "Una vez",
  SUBSCRIPTION: "Suscripción",
};

export const expensePayerLabels: Record<ExpensePayerValue, string> = {
  NICO: "Nico",
  JOEL: "Joel",
  SHARED: "Cuenta conjunta",
};

export type ExpenseRecord = {
  type: "INCOME" | "EXPENSE";
  amountCents: number;
  occurredAt: string | Date;
  expenseFrequency: ExpenseFrequencyValue | null;
  expensePayer: ExpensePayerValue | null;
};

function monthKey(value: string | Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
  }).format(new Date(value));
}

export function expenseAppliesToMonth(entry: ExpenseRecord, month: string | Date) {
  if (entry.type !== "EXPENSE") return false;
  const expenseMonth = monthKey(entry.occurredAt);
  const selectedMonth = monthKey(month);
  return entry.expenseFrequency === "SUBSCRIPTION"
    ? expenseMonth <= selectedMonth
    : expenseMonth === selectedMonth;
}

export function expenseSummaryForMonth(entries: ExpenseRecord[], month: string | Date) {
  const applicable = entries.filter((entry) => expenseAppliesToMonth(entry, month));
  const sum = (items: ExpenseRecord[]) => items.reduce((total, entry) => total + entry.amountCents, 0);
  const byPayer = Object.fromEntries(expensePayers.map((payer) => [payer, sum(applicable.filter((entry) => entry.expensePayer === payer))])) as Record<ExpensePayerValue, number>;

  return {
    total: sum(applicable),
    oneTime: sum(applicable.filter((entry) => entry.expenseFrequency !== "SUBSCRIPTION")),
    subscriptions: sum(applicable.filter((entry) => entry.expenseFrequency === "SUBSCRIPTION")),
    byPayer,
  };
}
