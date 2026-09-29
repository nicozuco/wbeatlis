"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteContentItem, saveContentItem } from "@/app/actions";
import { fieldClass, selectContentClass, textareaClass } from "@/components/shared/field-styles";
import type { Column } from "@/components/shared/sortable-table";
import { ToneChip } from "@/components/shared/status-chip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { contentStatusLabels } from "@/lib/domain";
import { formatDate, toDateInput } from "@/lib/format";

// Piezas de contenido de Instagram. Viven dentro de la Agenda (vista Contenido y
// en su fecha prevista).

export type ContentStatus = keyof typeof contentStatusLabels;
export type ContentFormat = "IMAGE" | "CAROUSEL" | "REEL";
export type ContentItem = { id: string; title: string; format: ContentFormat; status: ContentStatus; scheduledFor: string | null; script: string | null };

const statusOrder = Object.keys(contentStatusLabels) as ContentStatus[];
export const contentStatusTone: Record<ContentStatus, "neutral" | "violet" | "info" | "accent" | "success"> = { IDEA: "neutral", SCRIPT: "violet", DESIGN: "info", SCHEDULED: "accent", PUBLISHED: "success" };
export const contentFormatLabel: Record<ContentFormat, string> = { IMAGE: "Imagen", CAROUSEL: "Carrusel", REEL: "Reel" };

export const contentColumns: Column<ContentItem>[] = [
  { id: "title", header: "Pieza", cell: (item) => item.title, sortValue: (item) => item.title, className: "px-5 font-medium text-text", headClassName: "px-5" },
  { id: "format", header: "Formato", cell: (item) => contentFormatLabel[item.format], sortValue: (item) => contentFormatLabel[item.format], className: "text-text-muted" },
  { id: "status", header: "Estado", cell: (item) => <ToneChip tone={contentStatusTone[item.status]}>{contentStatusLabels[item.status]}</ToneChip>, sortValue: (item) => statusOrder.indexOf(item.status) },
  { id: "scheduledFor", header: "Fecha prevista", cell: (item) => formatDate(item.scheduledFor), sortValue: (item) => item.scheduledFor, className: "font-mono tabular-nums text-text-muted" },
  { id: "script", header: "Guion", cell: (item) => <span className="block max-w-sm truncate text-text-muted">{item.script || "—"}</span> },
];

export function ContentForm({ item, defaultDate, onClose }: { item: ContentItem | null; defaultDate?: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ title: item?.title ?? "", format: item?.format ?? "IMAGE", status: item?.status ?? "IDEA", scheduledFor: item ? toDateInput(item.scheduledFor) : defaultDate ?? "", script: item?.script ?? "" });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <form onSubmit={(event) => { event.preventDefault(); startTransition(async () => { try { await saveContentItem({ id: item?.id, ...form, format: form.format as ContentFormat, status: form.status as ContentStatus }); toast.success(item ? "Contenido actualizado" : "Contenido añadido"); onClose(); } catch { toast.error("No se pudo guardar el contenido"); } }); }} className="flex min-h-0 flex-1 flex-col"><div className="grid gap-5 overflow-y-auto px-5 py-6"><label><Label className="mb-2 text-text-muted">Título</Label><Input required value={form.title} onChange={(e) => set("title", e.target.value)} className={fieldClass} /></label><div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-2 text-text-muted">Formato</Label><Select value={form.format} onValueChange={(value) => set("format", value)}><SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}>{Object.entries(contentFormatLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label className="mb-2 text-text-muted">Estado</Label><Select value={form.status} onValueChange={(value) => set("status", value)}><SelectTrigger className={`${fieldClass} w-full`}><SelectValue /></SelectTrigger><SelectContent className={selectContentClass}>{Object.entries(contentStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div><label><Label className="mb-2 text-text-muted">Fecha prevista</Label><Input type="date" value={form.scheduledFor} onChange={(e) => set("scheduledFor", e.target.value)} className={fieldClass} /></label><label><Label className="mb-2 text-text-muted">Guion</Label><Textarea value={form.script} onChange={(e) => set("script", e.target.value)} placeholder="Idea, estructura o guion completo…" className={`min-h-64 ${textareaClass}`} /></label></div><footer className="mt-auto flex justify-between border-t border-border p-5">{item ? <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 className="size-4" /> Eliminar</Button></AlertDialogTrigger><AlertDialogContent className="border-border bg-surface-raised text-text"><AlertDialogHeader><AlertDialogTitle>Eliminar contenido</AlertDialogTitle><AlertDialogDescription className="text-text-muted">Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => startTransition(async () => { await deleteContentItem(item.id); toast.success("Contenido eliminado"); onClose(); })}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : <span />}<Button disabled={pending} className="bg-accent text-bg hover:bg-accent-hover">{pending ? "Guardando…" : "Guardar"}</Button></footer></form>;
}
