"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Eye, FileUp, Pencil, Plus, Radar, ShieldAlert, Star, Trash2 } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

import { deleteCompetitor, importCompetitors, saveCompetitor, toggleCompetitorFollowed, type CompetitorImportRow } from "@/app/actions";
import { fieldClass, selectContentClass, textareaClass } from "@/components/shared/field-styles";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SortableTable, type Column } from "@/components/shared/sortable-table";
import { ThreatChip, ToneChip } from "@/components/shared/status-chip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMiddleMousePan } from "@/hooks/use-middle-mouse-pan";
import { threatLabels } from "@/lib/domain";
import { formatDate } from "@/lib/format";

type Competitor = {
  id: string;
  threatLevel: string;
  ranking: number | null;
  company: string;
  agencyType: string | null;
  category: string;
  niche: string | null;
  instagram: string | null;
  followersCount: number | null;
  postCount: number | null;
  website: string | null;
  location: string | null;
  trackRecord: string | null;
  publicPrice: string | null;
  ownNotes: string | null;
  followed: boolean;
  lastReviewedAt: string | null;
};

const levelOptions = Object.entries(threatLabels) as Array<[CompetitorImportRow["threatLevel"], string]>;
// Orden de peligrosidad para ordenar la columna: Nivel 1 primero, Internacional al final.
const levelOrder: Record<string, number> = { LEVEL_1: 1, LEVEL_2: 2, LEVEL_3: 3, LEVEL_4: 4, LEVEL_5: 5, INTERNATIONAL: 6 };
const categoryLabels = { AI: "IA", MARKETING: "Marketing", MIXED: "Mixto" } as const;
const categoryLabel = (category: string) => categoryLabels[category as keyof typeof categoryLabels] ?? category;

const blankCompetitor: CompetitorImportRow = {
  threatLevel: "LEVEL_3",
  ranking: null,
  company: "",
  agencyType: "",
  category: "AI",
  niche: "",
  instagram: "",
  followersCount: null,
  postCount: null,
  website: "",
  location: "",
  trackRecord: "",
  publicPrice: "",
  ownNotes: "",
  followed: false,
  lastReviewedAt: null,
};

const normalize = (value: string) => value.replace(/^﻿/, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const valueOf = (row: Record<string, string>, ...keys: string[]) => {
  const found = Object.entries(row).find(([key]) => keys.includes(normalize(key)));
  return found?.[1]?.trim() ?? "";
};
const threatLevelValue = (value: string) => {
  const normalized = normalize(value).replaceAll(" ", "_");
  if (normalized.includes("internacional")) return "INTERNATIONAL" as const;
  const digit = normalized.match(/[1-5]/)?.[0] ?? "5";
  return `LEVEL_${digit}` as CompetitorImportRow["threatLevel"];
};
const categoryValue = (value: string) => {
  const normalized = normalize(value);
  if (normalized === "ia" || normalized.includes("inteligencia")) return "AI" as const;
  if (normalized.includes("marketing")) return "MARKETING" as const;
  return "MIXED" as const;
};
const websiteHref = (value: string) => /^https?:\/\//i.test(value) ? value : `https://${value}`;
const dateTimeInput = (value: string | null | undefined) => value ? value.slice(0, 16) : "";
const categoryTone = (category: string) => (category === "AI" ? "violet" : category === "MARKETING" ? "info" : "accent");

function NumberField({ label, value, onChange }: { label: string; value: number | null | undefined; onChange: (value: number | null) => void }) {
  return <label className="grid gap-2"><Label className="text-text-muted">{label}</Label><Input type="number" min={label === "Ranking" ? 1 : 0} value={value ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} className={fieldClass} /></label>;
}

function CompetitorForm({ competitor, onClose }: { competitor: Competitor | null; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<CompetitorImportRow>(() => competitor ? {
    id: competitor.id,
    threatLevel: competitor.threatLevel as CompetitorImportRow["threatLevel"],
    ranking: competitor.ranking,
    company: competitor.company,
    agencyType: competitor.agencyType ?? "",
    category: competitor.category as CompetitorImportRow["category"],
    niche: competitor.niche ?? "",
    instagram: competitor.instagram ?? "",
    followersCount: competitor.followersCount,
    postCount: competitor.postCount,
    website: competitor.website ?? "",
    location: competitor.location ?? "",
    trackRecord: competitor.trackRecord ?? "",
    publicPrice: competitor.publicPrice ?? "",
    ownNotes: competitor.ownNotes ?? "",
    followed: competitor.followed,
    lastReviewedAt: dateTimeInput(competitor.lastReviewedAt),
  } : { ...blankCompetitor });
  const set = <K extends keyof CompetitorImportRow>(key: K, value: CompetitorImportRow[K]) => setForm((current) => ({ ...current, [key]: value }));

  return <form onSubmit={(event) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await saveCompetitor(form);
        toast.success(competitor ? "Competidor actualizado" : "Competidor añadido");
        onClose();
      } catch {
        toast.error("Revisa los campos obligatorios del competidor");
      }
    });
  }}>
    <div className="grid max-h-[64vh] gap-4 overflow-y-auto px-1 py-1 sm:grid-cols-2">
      <label className="grid gap-2 sm:col-span-2"><Label className="text-text-muted">Empresa *</Label><Input required value={form.company} onChange={(event) => set("company", event.target.value)} className={fieldClass} /></label>
      <label className="grid gap-2"><Label className="text-text-muted">Nivel de amenaza *</Label><Select value={form.threatLevel} onValueChange={(value) => set("threatLevel", value as CompetitorImportRow["threatLevel"])}><SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}>{levelOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
      <NumberField label="Ranking" value={form.ranking} onChange={(value) => set("ranking", value)} />
      <label className="grid gap-2"><Label className="text-text-muted">Tipo de agencia</Label><Input value={form.agencyType ?? ""} onChange={(event) => set("agencyType", event.target.value)} className={fieldClass} /></label>
      <label className="grid gap-2"><Label className="text-text-muted">Categoría *</Label><Select value={form.category} onValueChange={(value) => set("category", value as CompetitorImportRow["category"])}><SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}><SelectItem value="AI">IA</SelectItem><SelectItem value="MARKETING">Marketing</SelectItem><SelectItem value="MIXED">Mixto</SelectItem></SelectContent></Select></label>
      <label className="grid gap-2"><Label className="text-text-muted">Nicho</Label><Input value={form.niche ?? ""} onChange={(event) => set("niche", event.target.value)} className={fieldClass} /></label>
      <label className="grid gap-2"><Label className="text-text-muted">Instagram</Label><Input placeholder="@cuenta" value={form.instagram ?? ""} onChange={(event) => set("instagram", event.target.value)} className={fieldClass} /></label>
      <NumberField label="Seguidores IG" value={form.followersCount} onChange={(value) => set("followersCount", value)} />
      <NumberField label="Publicaciones IG" value={form.postCount} onChange={(value) => set("postCount", value)} />
      <label className="grid gap-2"><Label className="text-text-muted">Web</Label><Input placeholder="https://" value={form.website ?? ""} onChange={(event) => set("website", event.target.value)} className={fieldClass} /></label>
      <label className="grid gap-2"><Label className="text-text-muted">Ubicación</Label><Input value={form.location ?? ""} onChange={(event) => set("location", event.target.value)} className={fieldClass} /></label>
      <label className="grid gap-2"><Label className="text-text-muted">Trayectoria / tamaño</Label><Input value={form.trackRecord ?? ""} onChange={(event) => set("trackRecord", event.target.value)} className={fieldClass} /></label>
      <label className="grid gap-2"><Label className="text-text-muted">Precio público</Label><Input value={form.publicPrice ?? ""} onChange={(event) => set("publicPrice", event.target.value)} className={fieldClass} /></label>
      <label className="grid gap-2"><Label className="text-text-muted">Última revisión</Label><Input type="datetime-local" value={dateTimeInput(form.lastReviewedAt)} onChange={(event) => set("lastReviewedAt", event.target.value)} className={fieldClass} /></label>
      <label className="flex items-center gap-3 self-end rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-text-muted"><Checkbox checked={form.followed} onCheckedChange={(checked) => set("followed", checked === true)} /> En seguimiento</label>
      <label className="grid gap-2 sm:col-span-2"><Label className="text-text-muted">Por qué está aquí</Label><Textarea value={form.ownNotes ?? ""} onChange={(event) => set("ownNotes", event.target.value)} className={`min-h-24 ${textareaClass}`} /></label>
    </div>
    <DialogFooter className="mt-5 border-t border-border pt-4">
      {competitor ? <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="ghost" className="mr-auto text-danger hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /> Eliminar</Button></AlertDialogTrigger><AlertDialogContent className="border-border bg-surface-raised text-text"><AlertDialogHeader><AlertDialogTitle>Eliminar competidor</AlertDialogTitle><AlertDialogDescription className="text-text-muted">Se eliminará {competitor.company} de la base de competencia.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => startTransition(async () => { try { await deleteCompetitor(competitor.id); toast.success("Competidor eliminado"); onClose(); } catch { toast.error("No se pudo eliminar el competidor"); } })}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : <span />}
      <Button type="button" variant="outline" onClick={onClose} className="border-border bg-surface text-text">Cancelar</Button>
      <Button type="submit" disabled={pending} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Guardando…" : competitor ? "Guardar cambios" : "Añadir competidor"}</Button>
    </DialogFooter>
  </form>;
}

export function CompetitorsWorkspace({ competitors, reviewedRecently }: { competitors: Competitor[]; reviewedRecently: number }) {
  const [level, setLevel] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<Competitor | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [preview, setPreview] = useState<CompetitorImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  useMiddleMousePan(tableScrollRef);

  const filtered = useMemo(() => competitors.filter((item) => (level === "ALL" || item.threatLevel === level) && (category === "ALL" || item.category === category)), [competitors, level, category]);
  const openEditor = (competitor: Competitor | null) => { setSelected(competitor); setEditorOpen(true); };
  const moveTable = (direction: -1 | 1) => tableScrollRef.current?.scrollBy({ left: direction * 520, behavior: "smooth" });

  const columns: Column<Competitor>[] = [
    { id: "threatLevel", header: "Amenaza", cell: (item) => <ThreatChip level={item.threatLevel} />, sortValue: (item) => levelOrder[item.threatLevel], className: "px-4", headClassName: "px-4" },
    { id: "ranking", header: "Ranking", cell: (item) => item.ranking ?? "—", sortValue: (item) => item.ranking, className: "font-mono tabular-nums text-text-muted" },
    { id: "company", header: "Empresa", cell: (item) => <span className="flex items-center gap-2 whitespace-nowrap"><span>{item.company}</span>{item.website ? <a href={websiteHref(item.website)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent hover:text-accent-hover">Visitar <ArrowUpRight className="size-3" /></a> : null}</span>, sortValue: (item) => item.company, className: "font-medium text-text" },
    { id: "agencyType", header: "Tipo de agencia", cell: (item) => item.agencyType || "—", sortValue: (item) => item.agencyType, className: "text-text-muted" },
    { id: "category", header: "Categoría", cell: (item) => <ToneChip tone={categoryTone(item.category)}>{categoryLabel(item.category)}</ToneChip>, sortValue: (item) => categoryLabel(item.category) },
    { id: "niche", header: "Nicho", cell: (item) => item.niche || "—", sortValue: (item) => item.niche, className: "text-text-muted" },
    { id: "instagram", header: "Instagram", cell: (item) => item.instagram || "—", sortValue: (item) => item.instagram, className: "text-text-muted" },
    { id: "followersCount", header: "Seguidores IG", cell: (item) => item.followersCount?.toLocaleString("es-ES") ?? "—", sortValue: (item) => item.followersCount, className: "font-mono tabular-nums text-text-muted" },
    { id: "postCount", header: "Publicaciones IG", cell: (item) => item.postCount?.toLocaleString("es-ES") ?? "—", sortValue: (item) => item.postCount, className: "font-mono tabular-nums text-text-muted" },
    { id: "location", header: "Ubicación", cell: (item) => item.location || "—", sortValue: (item) => item.location, className: "text-text-muted" },
    { id: "trackRecord", header: "Trayectoria / tamaño", cell: (item) => item.trackRecord || "—", sortValue: (item) => item.trackRecord, className: "text-text-muted" },
    { id: "publicPrice", header: "Precio público", cell: (item) => item.publicPrice || "—", sortValue: (item) => item.publicPrice, className: "text-text-muted" },
    { id: "ownNotes", header: "Por qué está aquí", cell: (item) => <span className="block max-w-64 truncate text-text-muted" title={item.ownNotes ?? undefined}>{item.ownNotes || "—"}</span>, sortValue: (item) => item.ownNotes },
    { id: "lastReviewedAt", header: "Última revisión", cell: (item) => formatDate(item.lastReviewedAt), sortValue: (item) => item.lastReviewedAt, className: "font-mono tabular-nums text-text-muted" },
    { id: "followed", header: "Seguido", sortValue: (item) => item.followed, cell: (item) => <Checkbox checked={item.followed} disabled={pending} onCheckedChange={(checked) => startTransition(async () => { try { await toggleCompetitorFollowed(item.id, checked === true); } catch { toast.error("No se pudo actualizar el seguimiento"); } })} aria-label={`Seguir ${item.company}`} /> },
    { id: "actions", header: "Acciones", align: "right", cell: (item) => <Button variant="ghost" size="sm" onClick={() => openEditor(item)} className="text-text-muted hover:bg-accent-soft hover:text-accent"><Pencil className="size-4" /> Editar</Button> },
  ];

  const parseFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length) toast.error(`El CSV contiene ${errors.length} errores de lectura`);
        const rows: CompetitorImportRow[] = data.filter((row) => valueOf(row, "empresa")).map((row) => ({
          threatLevel: threatLevelValue(valueOf(row, "nivel de amenaza", "nivel")),
          ranking: Number(valueOf(row, "ranking")) || null,
          company: valueOf(row, "empresa"),
          agencyType: valueOf(row, "tipo de agencia", "tipo") || null,
          category: categoryValue(valueOf(row, "categoria")),
          niche: valueOf(row, "nicho") || null,
          instagram: valueOf(row, "instagram") || null,
          followersCount: Number(valueOf(row, "seguidores ig", "seguidores")) || null,
          postCount: Number(valueOf(row, "publicaciones ig", "publicaciones")) || null,
          website: valueOf(row, "web") || null,
          location: valueOf(row, "ubicacion") || null,
          trackRecord: valueOf(row, "trayectoria / tamano", "trayectoria") || null,
          publicPrice: valueOf(row, "precio publico", "precio") || null,
          ownNotes: valueOf(row, "por que esta aqui", "notas propias", "notas") || null,
          followed: false,
          lastReviewedAt: null,
        }));
        if (!rows.length) { toast.error("No se han encontrado filas con empresa"); return; }
        setPreview(rows);
        setImportOpen(true);
      },
    });
  };

  return <>
    <PageHeader title="Competencia" description="Mercado · Inteligencia competitiva" actions={<><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) parseFile(file); event.currentTarget.value = ""; }} /><Button variant="outline" onClick={() => openEditor(null)} className="border-border bg-surface text-text hover:bg-surface-raised"><Plus className="size-4" /> Añadir competidor</Button><Button onClick={() => inputRef.current?.click()} className="bg-accent text-bg hover:bg-accent-hover"><FileUp className="size-4" /> Importar CSV</Button></>} />
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Rivales analizados" value={String(competitors.length)} icon={Radar} /><KpiCard label="Amenaza alta" value={String(competitors.filter((item) => item.threatLevel === "LEVEL_1" || item.threatLevel === "LEVEL_2").length)} note="niveles 1 y 2" tone="danger" icon={ShieldAlert} /><KpiCard label="En seguimiento" value={String(competitors.filter((item) => item.followed).length)} tone="warning" icon={Star} /><KpiCard label="Revisados · 30 días" value={String(reviewedRecently)} tone="success" icon={Eye} /></section>
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap gap-2 border-b border-border p-4">
        <Select value={level} onValueChange={setLevel}><SelectTrigger className={`${fieldClass} w-52`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}><SelectItem value="ALL">Todos los niveles</SelectItem>{levelOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={category} onValueChange={setCategory}><SelectTrigger className={`${fieldClass} w-44`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}><SelectItem value="ALL">Todas las categorías</SelectItem><SelectItem value="AI">IA</SelectItem><SelectItem value="MARKETING">Marketing</SelectItem><SelectItem value="MIXED">Mixto</SelectItem></SelectContent></Select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-muted">{filtered.length} resultados</span>
          <Button type="button" variant="outline" size="icon" onClick={() => moveTable(-1)} aria-label="Desplazar tabla a la izquierda" title="Desplazar tabla a la izquierda" className="border-border bg-surface-raised text-text hover:bg-accent-soft hover:text-accent"><ChevronLeft className="size-4" /></Button>
          <Button type="button" variant="outline" size="icon" onClick={() => moveTable(1)} aria-label="Desplazar tabla a la derecha" title="Desplazar tabla a la derecha" className="border-border bg-surface-raised text-text hover:bg-accent-soft hover:text-accent"><ChevronRight className="size-4" /></Button>
        </div>
      </div>
      {/*
        La tabla se desplaza dentro de este recuadro (alto de la ventana): la barra
        horizontal queda siempre a la vista y la cabecera fija. El contenedor
        interno de <Table> deja de desplazarse para que las flechas y el arrastre
        con la rueda central actúen sobre este mismo recuadro.
      */}
      <div ref={tableScrollRef} className="max-h-[calc(100vh-13rem)] min-h-80 overflow-auto overscroll-contain [&_[data-slot=table-container]]:overflow-visible [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead_tr]:bg-surface">
        <SortableTable rows={filtered} columns={columns} getRowId={(item) => item.id} initialSort={{ id: "ranking", desc: false }} tableClassName="min-w-[1800px]" emptyMessage="No hay competidores que coincidan con los filtros." />
      </div>
    </section>
    <Dialog open={editorOpen} onOpenChange={setEditorOpen}><DialogContent className="max-h-[90vh] overflow-hidden border-border bg-surface-raised text-text sm:max-w-4xl"><DialogHeader><DialogTitle className="font-heading text-xl">{selected ? `Editar ${selected.company}` : "Añadir competidor"}</DialogTitle><DialogDescription className="text-text-muted">Completa los campos de la ficha competitiva. Los campos con * son obligatorios.</DialogDescription></DialogHeader><CompetitorForm key={selected?.id ?? "new"} competitor={selected} onClose={() => setEditorOpen(false)} /></DialogContent></Dialog>
    <Dialog open={importOpen} onOpenChange={setImportOpen}><DialogContent className="max-h-[85vh] overflow-hidden border-border bg-surface-raised text-text sm:max-w-4xl"><DialogHeader><DialogTitle className="font-heading text-xl">Previsualizar importación</DialogTitle><DialogDescription className="text-text-muted">{fileName} · Revisa las primeras filas antes de añadirlas.</DialogDescription></DialogHeader><div className="overflow-auto rounded-lg border border-border"><Table><TableHeader><TableRow className="border-border bg-bg"><TableHead>Amenaza</TableHead><TableHead>Empresa</TableHead><TableHead>Categoría</TableHead><TableHead>Ubicación</TableHead><TableHead>Seguidores IG</TableHead></TableRow></TableHeader><TableBody>{preview.slice(0, 8).map((row, index) => <TableRow key={`${row.company}-${index}`} className="border-border"><TableCell><ThreatChip level={row.threatLevel} /></TableCell><TableCell className="font-medium text-text">{row.company}</TableCell><TableCell>{categoryLabels[row.category]}</TableCell><TableCell>{row.location || "—"}</TableCell><TableCell className="font-mono tabular-nums">{row.followersCount || "—"}</TableCell></TableRow>)}</TableBody></Table></div><p className="text-xs text-text-muted">Se importarán {preview.length} filas. Las filas existentes no se modifican.</p><DialogFooter><Button variant="outline" onClick={() => setImportOpen(false)} className="border-border bg-surface text-text">Cancelar</Button><Button disabled={pending || preview.length === 0} onClick={() => startTransition(async () => { try { await importCompetitors(preview); toast.success(`${preview.length} rivales importados`); setImportOpen(false); } catch { toast.error("No se pudo completar la importación. Revisa las columnas y fechas."); } })} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Importando…" : `Importar ${preview.length} filas`}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
