"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart3, Columns3, LayoutList, ListChecks, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { addInteraction, deleteClinic, moveClinic, saveClinic } from "@/app/actions";
import { fieldClass, selectContentClass, textareaClass } from "@/components/shared/field-styles";
import { KanbanBoard } from "@/components/shared/kanban-board";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SidePanel } from "@/components/shared/side-panel";
import { SortableTable, type Column } from "@/components/shared/sortable-table";
import { PhaseChip } from "@/components/shared/status-chip";
import { ViewToggle } from "@/components/shared/view-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { phaseLabels, pipelinePhases, type PipelinePhaseValue } from "@/lib/domain";
import { formatCurrency, formatDate, toDateInput } from "@/lib/format";

import type { ProcessCheck } from "@/lib/client-process";
import { ProcessBoard, ProcessOverview } from "./process-board";

export type ClientData = {
  id: string;
  name: string;
  city: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  phase: PipelinePhaseValue;
  leadSource: string | null;
  firstContactAt: string | null;
  lastInteractionAt: string | null;
  nextFollowUpAt: string | null;
  monthlyFeeCents: number;
  createdAt: string;
  processSteps: ProcessCheck[];
  stageEvents: { id: string; fromPhase: PipelinePhaseValue | null; toPhase: PipelinePhaseValue; changedAt: string }[];
  tasks: { id: string; title: string; status: string; blocksPhase: PipelinePhaseValue | null }[];
  interactions: { id: string; note: string; occurredAt: string }[];
};

type Metrics = {
  total: number;
  responseRate: string;
  responseCount: number;
  contractRate: string;
  contractCount: number;
  mrr: string;
  activeCount: number;
};

const clientColumns: Column<ClientData>[] = [
  { id: "name", header: "Clínica", cell: (client) => client.name, sortValue: (client) => client.name, className: "px-5 font-medium text-text", headClassName: "px-5" },
  { id: "city", header: "Ciudad", cell: (client) => client.city || "—", sortValue: (client) => client.city, className: "text-text-muted" },
  { id: "contact", header: "Contacto", cell: (client) => client.contactName || "—", sortValue: (client) => client.contactName, className: "text-text-muted" },
  { id: "phase", header: "Fase", cell: (client) => <PhaseChip phase={client.phase} />, sortValue: (client) => pipelinePhases.indexOf(client.phase) },
  { id: "next", header: "Próximo paso", cell: (client) => formatDate(client.nextFollowUpAt), sortValue: (client) => client.nextFollowUpAt, className: "font-mono text-sm tabular-nums text-text-muted" },
  { id: "fee", header: "Cuota", align: "right", cell: (client) => (client.monthlyFeeCents ? formatCurrency(client.monthlyFeeCents) : "—"), sortValue: (client) => client.monthlyFeeCents || null, className: "font-mono font-medium tabular-nums text-text" },
  { id: "open", header: "", cell: () => <ArrowUpRight className="size-4 text-text-faint transition-colors group-hover:text-accent" />, className: "w-12", headClassName: "w-12" },
];

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${fieldClass} ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={selectContentClass}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="focus:bg-accent-soft focus:text-text">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ClinicForm({ client, onSaved, onDeleted }: { client: ClientData | null; onSaved: () => void; onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [expectedPhase] = useState(client?.phase);
  const [form, setForm] = useState({
    name: client?.name ?? "",
    city: client?.city ?? "",
    contactName: client?.contactName ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    instagram: client?.instagram ?? "",
    website: client?.website ?? "",
    phase: client?.phase ?? "UNCONTACTED",
    leadSource: client?.leadSource ?? "",
    firstContactAt: toDateInput(client?.firstContactAt),
    nextFollowUpAt: toDateInput(client?.nextFollowUpAt),
    monthlyFee: client ? String(client.monthlyFeeCents / 100) : "",
  });
  const [interaction, setInteraction] = useState("");

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await saveClinic({ id: client?.id, expectedPhase, ...form, phase: form.phase as PipelinePhaseValue });
        toast.success(client ? "Clínica actualizada" : "Clínica añadida");
        onSaved();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo guardar la clínica");
      }
    });
  };

  const addNote = () => {
    if (!client || !interaction.trim()) return;
    startTransition(async () => {
      try {
        await addInteraction({ clinicId: client.id, note: interaction });
        setInteraction("");
        toast.success("Interacción registrada");
        onSaved();
      } catch {
        toast.error("No se pudo registrar la interacción");
      }
    });
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="grid gap-5 overflow-y-auto px-5 py-6 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Label className="mb-2 text-text-muted">Nombre de la clínica</Label>
          <Input required value={form.name} onChange={(e) => set("name", e.target.value)} className={fieldClass} />
        </label>
        <label>
          <Label className="mb-2 text-text-muted">Ciudad</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} className={fieldClass} />
        </label>
        <div>
          <Label className="mb-2 text-text-muted">Fase</Label>
          {client && <p className="mb-2 text-xs text-text-muted">Cambio manual para corregir, descartar o reabrir. Avanza con los pasos guiados desde Proceso.</p>}
          <SelectField value={form.phase} onChange={(value) => set("phase", value)} options={pipelinePhases.map((phase) => ({ value: phase, label: phaseLabels[phase] }))} className="w-full" />
        </div>
        <label>
          <Label className="mb-2 text-text-muted">Persona de contacto</Label>
          <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={fieldClass} />
        </label>
        <label>
          <Label className="mb-2 text-text-muted">Teléfono</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={fieldClass} />
        </label>
        <label>
          <Label className="mb-2 text-text-muted">Email</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={fieldClass} />
        </label>
        <label>
          <Label className="mb-2 text-text-muted">Instagram</Label>
          <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} className={fieldClass} />
        </label>
        <label className="sm:col-span-2">
          <Label className="mb-2 text-text-muted">Web</Label>
          <Input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} className={fieldClass} />
        </label>
        <label>
          <Label className="mb-2 text-text-muted">Origen del lead</Label>
          <Input value={form.leadSource} onChange={(e) => set("leadSource", e.target.value)} className={fieldClass} />
        </label>
        <label>
          <Label className="mb-2 text-text-muted">Cuota mensual (€)</Label>
          <Input type="number" min="0" step="0.01" value={form.monthlyFee} onChange={(e) => set("monthlyFee", e.target.value)} className={fieldClass} />
        </label>
        <label>
          <Label className="mb-2 text-text-muted">Primer contacto</Label>
          <Input type="date" value={form.firstContactAt} onChange={(e) => set("firstContactAt", e.target.value)} className={fieldClass} />
        </label>
        <label>
          <Label className="mb-2 text-text-muted">Próximo seguimiento</Label>
          <Input type="date" value={form.nextFollowUpAt} onChange={(e) => set("nextFollowUpAt", e.target.value)} className={fieldClass} />
        </label>

        {client ? (
          <section className="border-t border-border pt-5 sm:col-span-2">
            <p className="section-label">Historial de interacciones</p>
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Textarea value={interaction} onChange={(e) => setInteraction(e.target.value)} placeholder="Añade una nota al historial…" className={`min-h-20 ${textareaClass}`} />
                <Button type="button" disabled={isPending || !interaction.trim()} onClick={addNote} className="self-end bg-accent text-bg hover:bg-accent-hover">Añadir</Button>
              </div>
              {client.interactions.map((item) => (
                <article key={item.id} className="rounded-lg border border-border bg-bg p-3">
                  <p className="text-sm leading-6 text-text">{item.note}</p>
                  <p className="mt-2 font-mono text-[11px] tabular-nums text-text-faint">{formatDate(item.occurredAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <footer className="mt-auto flex items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4">
        {client ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /> Eliminar</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-surface-raised text-text">
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar clínica</AlertDialogTitle>
                <AlertDialogDescription className="text-text-muted">También se eliminarán su historial y movimientos. Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => startTransition(async () => { await deleteClinic(client.id); toast.success("Clínica eliminada"); onDeleted(); })}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : <span />}
        <Button type="submit" disabled={isPending} className="bg-accent text-bg hover:bg-accent-hover">{isPending ? "Guardando…" : "Guardar clínica"}</Button>
      </footer>
    </form>
  );
}

// Exportado para que otras secciones (el mapa mental) abran la misma ficha de
// cliente en vez de duplicar el formulario.
export function ClientSheet({ client, open, onOpenChange, onSaved, onDeleted }: { client: ClientData | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void; onDeleted: () => void }) {
  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={client ? client.name : "Nueva clínica"}
      description={client ? "Edita la ficha y registra cada interacción." : "Añade una nueva oportunidad al pipeline."}
    >
      <ClinicForm key={client?.id ?? "new"} client={client} onSaved={onSaved} onDeleted={onDeleted} />
    </SidePanel>
  );
}

export function ClientsWorkspace({ clients, metrics, now }: { clients: ClientData[]; metrics: Metrics; now: string }) {
  const [view, setView] = useState<"process" | "list" | "kanban">("process");
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [city, setCity] = useState("ALL");
  const [selected, setSelected] = useState<ClientData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMoving, startMoving] = useTransition();

  const sources = useMemo(() => Array.from(new Set(clients.map((client) => client.leadSource).filter(Boolean) as string[])).sort(), [clients]);
  const cities = useMemo(() => Array.from(new Set(clients.map((client) => client.city).filter(Boolean) as string[])).sort(), [clients]);
  const filtered = useMemo(() => clients.filter((client) => {
    const matchesSearch = client.name.toLocaleLowerCase("es").includes(search.toLocaleLowerCase("es"));
    return matchesSearch && (phase === "ALL" || client.phase === phase) && (source === "ALL" || client.leadSource === source) && (city === "ALL" || client.city === city);
  }), [clients, search, phase, source, city]);

  const openClient = (client: ClientData | null) => { setSelected(client); setSheetOpen(true); };
  const moveToPhase = (client: ClientData, nextPhase: PipelinePhaseValue) => {
    startMoving(async () => {
      try { await moveClinic(client.id, nextPhase); toast.success(`Movida a ${phaseLabels[nextPhase]}`); }
      catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo mover la clínica"); }
    });
  };

  return (
    <>
      <PageHeader title="Clientes" description="Proceso comercial · Un siguiente paso claro" actions={<><Button variant="outline" asChild className="h-10"><Link href="/analitica"><BarChart3 className="size-4" /> Ver analítica</Link></Button><Button onClick={() => openClient(null)} className="h-10 bg-accent text-bg hover:bg-accent-hover"><Plus className="size-4" /> Añadir clínica</Button></>} />

      <section aria-label="Resumen de clientes" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Clínicas registradas" value={String(metrics.total)} note="todas las fases" />
        <KpiCard label="Tasa de respuesta" value={metrics.responseRate} note={`${metrics.responseCount} respondidos`} />
        <KpiCard label="Tasa de contratación" value={metrics.contractRate} note={`${metrics.contractCount} contratos`} />
        <KpiCard label="MRR" value={metrics.mrr} note={metrics.activeCount === 1 ? "1 cliente activo" : `${metrics.activeCount} clientes activos`} />
      </section>

      {view === "process" && <ProcessOverview clients={clients} phase={phase} onPhaseChange={setPhase} />}

      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <ViewToggle value={view} onChange={setView} options={[{ value: "process", label: "Proceso", icon: ListChecks }, { value: "list", label: "Lista", icon: LayoutList }, { value: "kanban", label: "Kanban", icon: Columns3 }]} />
          <div className="flex flex-col flex-wrap gap-2 md:flex-row">
            <label className="relative block min-w-0 md:w-64">
              <span className="sr-only">Buscar por nombre</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre…" className={`${fieldClass} pl-9`} />
            </label>
            <SelectField value={phase} onChange={setPhase} options={[{ value: "ALL", label: "Todas las fases" }, ...pipelinePhases.map((value) => ({ value, label: phaseLabels[value] }))]} className="w-full md:w-44" />
            <SelectField value={source} onChange={setSource} options={[{ value: "ALL", label: "Todos los orígenes" }, ...sources.map((value) => ({ value, label: value }))]} className="w-full md:w-44" />
            <SelectField value={city} onChange={setCity} options={[{ value: "ALL", label: "Todas las ciudades" }, ...cities.map((value) => ({ value, label: value }))]} className="w-full md:w-44" />
          </div>
        </div>

        {view === "process" ? <ProcessBoard clients={filtered} phase={phase} now={now} onOpen={openClient} /> : view === "list" ? (
          <SortableTable rows={filtered} columns={clientColumns} getRowId={(client) => client.id} onRowClick={openClient} rowClassName="group h-[66px]" />
        ) : (
          <KanbanBoard
            layout="scroll"
            columns={pipelinePhases.map((value) => ({ id: value, header: <PhaseChip phase={value} /> }))}
            items={filtered}
            getItemId={(client) => client.id}
            getItemColumn={(client) => client.phase}
            getItemLabel={(client) => client.name}
            onMove={moveToPhase}
            busy={isMoving}
            emptyLabel="Arrastra una clínica aquí"
            renderCard={(client) => (
              <>
                <button type="button" onClick={() => openClient(client)} className="block min-w-0 text-left">
                  <p className="truncate text-sm font-medium text-text">{client.name}</p>
                  <p className="mt-1 text-xs text-text-muted">{client.city || "Sin ciudad"}</p>
                </button>
                <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                  <span>{formatDate(client.nextFollowUpAt)}</span>
                  <span className="font-mono tabular-nums text-text">{client.monthlyFeeCents ? formatCurrency(client.monthlyFeeCents) : "—"}</span>
                </div>
              </>
            )}
          />
        )}

        {filtered.length === 0 && view !== "process" ? <div className="grid min-h-48 place-items-center border-t border-border p-6 text-center text-sm text-text-muted">No hay clínicas que coincidan con los filtros.</div> : null}
        <footer className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-text-muted"><span><span className="font-mono tabular-nums text-text">{filtered.length}</span> de {clients.length} clínicas</span></footer>
      </section>

      <ClientSheet client={selected ? clients.find((client) => client.id === selected.id) ?? null : null} open={sheetOpen} onOpenChange={setSheetOpen} onSaved={() => setSheetOpen(false)} onDeleted={() => setSheetOpen(false)} />
    </>
  );
}
