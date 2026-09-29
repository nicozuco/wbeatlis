"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, Receipt, Repeat2, TrendingUp, UserRound, WalletCards } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { saveFinanceEntry } from "@/app/actions";
import { KpiCard } from "@/components/shared/kpi-card";
import { fieldClass, selectContentClass } from "@/components/shared/field-styles";
import { PageHeader } from "@/components/shared/page-header";
import { SidePanel } from "@/components/shared/side-panel";
import { ToneChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { expenseFrequencyLabels, expensePayerLabels, expensePayers, type ExpenseFrequencyValue, type ExpensePayerValue } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/format";

type Entry = {
  id: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amountCents: number;
  occurredAt: string;
  clinicName: string | null;
  expenseFrequency: ExpenseFrequencyValue | null;
  expensePayer: ExpensePayerValue | null;
};
type Expense = Omit<Entry, "type" | "clinicName"> & { expenseFrequency: ExpenseFrequencyValue; expensePayer: ExpensePayerValue };
type ClinicOption = { id: string; name: string };
type ClientIncome = { id: string | null; name: string; amountCents: number };
type ExpenseSummary = { total: number; oneTime: number; subscriptions: number; byPayer: Record<ExpensePayerValue, number> };

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const todayInMadrid = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(new Date());

function MrrChart({ data }: { data: { month: string; amount: number }[] }) {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!mounted) return <div className="h-[270px] w-full" aria-hidden="true" />;
  return (
    <div className="h-[270px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
          <defs><linearGradient id="mrr-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-faint)", fontSize: 11 }} tickFormatter={(value) => `${value / 1000}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value) * 100)} contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
          <Area type="monotone" dataKey="amount" name="MRR" stroke="var(--accent)" strokeWidth={2} fill="url(#mrr-fill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FinanceForm({ clinics, initialType, onClose }: { clinics: ClinicOption[]; initialType: "INCOME" | "EXPENSE"; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    type: initialType,
    description: "",
    amount: "",
    occurredAt: todayInMadrid(),
    clinicId: "NONE",
    expenseFrequency: "ONE_TIME",
    expensePayer: "SHARED",
  });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const isExpense = form.type === "EXPENSE";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            await saveFinanceEntry({
              ...form,
              type: form.type as "INCOME" | "EXPENSE",
              clinicId: form.clinicId === "NONE" ? null : form.clinicId,
              expenseFrequency: isExpense ? form.expenseFrequency as ExpenseFrequencyValue : null,
              expensePayer: isExpense ? form.expensePayer as ExpensePayerValue : null,
            });
            toast.success(isExpense ? "Gasto guardado" : "Ingreso registrado");
            onClose();
          } catch {
            toast.error(isExpense ? "No se pudo guardar el gasto" : "No se pudo registrar el ingreso");
          }
        });
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="grid gap-5 px-5 py-6">
        <div>
          <Label className="mb-2 text-text-muted">Tipo de movimiento</Label>
          <Select value={form.type} onValueChange={(value) => set("type", value)}>
            <SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentClass}><SelectItem value="INCOME">Ingreso</SelectItem><SelectItem value="EXPENSE">Gasto</SelectItem></SelectContent>
          </Select>
        </div>

        <label>
          <Label className="mb-2 text-text-muted">Concepto</Label>
          <Input required value={form.description} onChange={(event) => set("description", event.target.value)} placeholder={isExpense ? "Ej. Suscripción a Make" : "Ej. Primer pago del cliente"} className={fieldClass} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <Label className="mb-2 text-text-muted">Importe (€)</Label>
            <Input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => set("amount", event.target.value)} className={fieldClass} />
          </label>
          <label>
            <Label className="mb-2 text-text-muted">{isExpense && form.expenseFrequency === "SUBSCRIPTION" ? "Inicio de la suscripción" : "Fecha"}</Label>
            <Input required type="date" value={form.occurredAt} onChange={(event) => set("occurredAt", event.target.value)} className={fieldClass} />
          </label>
        </div>

        {isExpense ? (
          <div className="grid gap-4 rounded-xl border border-border bg-bg/45 p-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 text-text-muted">Frecuencia</Label>
              <Select value={form.expenseFrequency} onValueChange={(value) => set("expenseFrequency", value)}>
                <SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentClass}><SelectItem value="ONE_TIME">Una vez</SelectItem><SelectItem value="SUBSCRIPTION">Suscripción mensual</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 text-text-muted">¿Quién lo paga?</Label>
              <Select value={form.expensePayer} onValueChange={(value) => set("expensePayer", value)}>
                <SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentClass}><SelectItem value="NICO">Nico</SelectItem><SelectItem value="JOEL">Joel</SelectItem><SelectItem value="SHARED">Cuenta conjunta</SelectItem></SelectContent>
              </Select>
            </div>
            {form.expenseFrequency === "SUBSCRIPTION" ? <p className="text-xs leading-5 text-text-muted sm:col-span-2">El importe se añadirá automáticamente a los gastos de cada mes desde la fecha de inicio.</p> : null}
          </div>
        ) : (
          <div>
            <Label className="mb-2 text-text-muted">Cliente relacionado</Label>
            <Select value={form.clinicId} onValueChange={(value) => set("clinicId", value)}>
              <SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentClass}><SelectItem value="NONE">Ninguno</SelectItem>{clinics.map((clinic) => <SelectItem key={clinic.id} value={clinic.id}>{clinic.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
      <footer className="mt-auto flex justify-end border-t border-border p-5">
        <Button disabled={pending} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Guardando…" : isExpense ? "Guardar gasto" : "Registrar ingreso"}</Button>
      </footer>
    </form>
  );
}

function ExpensesSection({ expenses, summary, onAdd }: { expenses: Expense[]; summary: ExpenseSummary; onAdd: () => void }) {
  const maxPayer = Math.max(...expensePayers.map((payer) => summary.byPayer[payer]), 1);

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
        <div>
          <p className="section-label">Control de costes</p>
          <h2 className="mt-2 font-heading text-xl font-semibold">Gastos</h2>
          <p className="mt-1 text-sm text-text-muted">Pagos puntuales y suscripciones mensuales, organizados por quién los paga.</p>
        </div>
        <Button onClick={onAdd} variant="outline" className="border-border bg-surface-raised"><Plus className="size-4" /> Añadir gasto</Button>
      </div>

      <div className="grid gap-3 border-b border-border bg-bg/30 p-5 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4"><div className="flex items-center justify-between"><p className="section-label">Suscripciones</p><Repeat2 className="size-4 text-accent" /></div><p className="mt-3 font-mono text-xl font-semibold">{formatCurrency(summary.subscriptions)}</p><p className="mt-1 text-xs text-text-muted">coste mensual recurrente</p></div>
        <div className="rounded-lg border border-border bg-surface p-4"><div className="flex items-center justify-between"><p className="section-label">Una vez</p><Receipt className="size-4 text-warning" /></div><p className="mt-3 font-mono text-xl font-semibold">{formatCurrency(summary.oneTime)}</p><p className="mt-1 text-xs text-text-muted">pagos puntuales de este mes</p></div>
        <div className="rounded-lg border border-border bg-surface p-4"><div className="flex items-center justify-between"><p className="section-label">Total del mes</p><WalletCards className="size-4 text-text-faint" /></div><p className="mt-3 font-mono text-xl font-semibold">{formatCurrency(summary.total)}</p><p className="mt-1 text-xs text-text-muted">puntuales + recurrentes</p></div>
      </div>

      <div className="grid min-w-0 xl:grid-cols-[0.72fr_1.6fr]">
        <div className="border-b border-border p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-2"><UserRound className="size-4 text-text-faint" /><h3 className="font-heading font-semibold">Quién paga este mes</h3></div>
          <div className="mt-6 space-y-5">
            {expensePayers.map((payer) => (
              <div key={payer}>
                <div className="flex justify-between gap-3 text-sm"><span className="text-text-muted">{expensePayerLabels[payer]}</span><span className="font-mono tabular-nums">{formatCurrency(summary.byPayer[payer])}</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-warning" style={{ width: `${summary.byPayer[payer] / maxPayer * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="border-border bg-bg/55"><TableHead className="px-5 text-text-muted">Concepto</TableHead><TableHead className="text-text-muted">Frecuencia</TableHead><TableHead className="text-text-muted">Pagador</TableHead><TableHead className="text-text-muted">Fecha / inicio</TableHead><TableHead className="pr-5 text-right text-text-muted">Importe</TableHead></TableRow></TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} className="border-border">
                  <TableCell className="px-5 font-medium text-text">{expense.description}</TableCell>
                  <TableCell><ToneChip tone={expense.expenseFrequency === "SUBSCRIPTION" ? "accent" : "neutral"}>{expenseFrequencyLabels[expense.expenseFrequency]}</ToneChip></TableCell>
                  <TableCell className="whitespace-nowrap text-text-muted">{expensePayerLabels[expense.expensePayer]}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-text-muted">{formatDate(expense.occurredAt)}</TableCell>
                  <TableCell className="whitespace-nowrap pr-5 text-right font-mono font-medium">{formatCurrency(expense.amountCents)}{expense.expenseFrequency === "SUBSCRIPTION" ? <span className="ml-1 text-xs text-text-faint">/mes</span> : null}</TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-text-muted">Aún no hay gastos. Añade el primero para empezar el control.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

export function FinanceWorkspace({ mrr, income, expenses: monthlyExpenses, profit, chart, entries, expenseEntries, expenseSummary, incomeByClient, clinics }: {
  mrr: number;
  income: number;
  expenses: number;
  profit: number;
  chart: { month: string; amount: number }[];
  entries: Entry[];
  expenseEntries: Expense[];
  expenseSummary: ExpenseSummary;
  incomeByClient: ClientIncome[];
  clinics: ClinicOption[];
}) {
  const [panelType, setPanelType] = useState<"INCOME" | "EXPENSE" | null>(null);
  const maxIncome = Math.max(...incomeByClient.map((row) => row.amountCents), 1);

  return (
    <>
      <PageHeader
        title="Finanzas"
        description="Control financiero · EUR"
        actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setPanelType("INCOME")}><ArrowUpRight className="size-4" /> Registrar ingreso</Button><Button onClick={() => setPanelType("EXPENSE")} className="bg-accent text-bg hover:bg-accent-hover"><Plus className="size-4" /> Añadir gasto</Button></div>}
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="MRR actual" value={formatCurrency(mrr)} tone="success" icon={TrendingUp} />
        <KpiCard label="Ingresos del mes" value={formatCurrency(income)} icon={ArrowUpRight} />
        <KpiCard label="Gastos del mes" value={formatCurrency(monthlyExpenses)} tone="warning" icon={ArrowDownLeft} />
        <KpiCard label="Beneficio" value={formatCurrency(profit)} tone={profit >= 0 ? "success" : "danger"} icon={Landmark} />
      </section>

      <ExpensesSection expenses={expenseEntries} summary={expenseSummary} onAdd={() => setPanelType("EXPENSE")} />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <p className="section-label">Evolución</p>
          <h2 className="mt-2 font-heading text-xl font-semibold">MRR mes a mes</h2>
          <div className="mt-3"><MrrChart data={chart} /></div>
        </section>
        <section className="rounded-xl border border-border bg-surface p-5">
          <p className="section-label">Ingresos registrados · este mes</p>
          <h2 className="mt-2 font-heading text-xl font-semibold">Desglose por cliente</h2>
          <div className="mt-6 space-y-5">
            {incomeByClient.map((row) => (
              <div key={row.id ?? "sin-cliente"}>
                <div className="flex justify-between gap-3 text-sm"><span className="truncate text-text-muted">{row.name}</span><span className="font-mono tabular-nums text-text">{formatCurrency(row.amountCents)}</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, row.amountCents / maxIncome * 100)}%` }} /></div>
              </div>
            ))}
            {incomeByClient.length === 0 ? <p className="text-sm text-text-muted">No hay ingresos registrados este mes.</p> : null}
          </div>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-5"><p className="section-label">Libro del mes</p><h2 className="mt-2 font-heading text-xl font-semibold">Últimos movimientos</h2></div>
        <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-border bg-bg/55"><TableHead className="px-5 text-text-muted">Concepto</TableHead><TableHead className="text-text-muted">Cliente / pagador</TableHead><TableHead className="text-text-muted">Fecha</TableHead><TableHead className="text-text-muted">Tipo</TableHead><TableHead className="pr-5 text-right text-text-muted">Importe</TableHead></TableRow></TableHeader><TableBody>{entries.map((entry) => <TableRow key={entry.id} className="border-border"><TableCell className="px-5 font-medium text-text">{entry.description}</TableCell><TableCell className="text-text-muted">{entry.type === "EXPENSE" && entry.expensePayer ? expensePayerLabels[entry.expensePayer] : entry.clinicName || "—"}</TableCell><TableCell className="whitespace-nowrap font-mono text-text-muted">{formatDate(entry.occurredAt)}</TableCell><TableCell><ToneChip tone={entry.type === "INCOME" ? "success" : entry.expenseFrequency === "SUBSCRIPTION" ? "accent" : "warning"}>{entry.type === "INCOME" ? "Ingreso" : entry.expenseFrequency === "SUBSCRIPTION" ? "Suscripción" : "Gasto"}</ToneChip></TableCell><TableCell className={`whitespace-nowrap pr-5 text-right font-mono font-medium ${entry.type === "INCOME" ? "text-success" : "text-text"}`}>{entry.type === "INCOME" ? "+" : "−"}{formatCurrency(entry.amountCents)}</TableCell></TableRow>)}{entries.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-text-muted">No hay movimientos registrados.</TableCell></TableRow> : null}</TableBody></Table></div>
      </section>

      <SidePanel open={panelType !== null} onOpenChange={(open) => { if (!open) setPanelType(null); }} title={panelType === "EXPENSE" ? "Añadir gasto" : "Registrar ingreso"} description={panelType === "EXPENSE" ? "Indica si es puntual o recurrente y quién realiza el pago." : "Añade un ingreso a la contabilidad interna."}>
        {panelType ? <FinanceForm key={panelType} clinics={clinics} initialType={panelType} onClose={() => setPanelType(null)} /> : null}
      </SidePanel>
    </>
  );
}
