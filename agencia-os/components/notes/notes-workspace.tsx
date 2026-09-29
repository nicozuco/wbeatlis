"use client";

import { useMemo, useState, useTransition } from "react";
import { FileText, Hash, NotebookPen, Plus, Save, Search, Tags, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { deleteNote, saveNote } from "@/app/actions";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";

type NoteData = { id: string; title: string; body: string; updatedAt: string; tags: string[] };

export function NotesWorkspace({ notes }: { notes: NoteData[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const selected = notes.find((note) => note.id === selectedId) ?? null;
  const [draft, setDraft] = useState(() => ({ title: selected?.title ?? "", body: selected?.body ?? "", tags: selected?.tags.join(", ") ?? "" }));
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => notes.filter((note) => note.title.toLowerCase().includes(query.toLowerCase()) || note.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))), [notes, query]);
  const tags = new Set(notes.flatMap((note) => note.tags));
  const selectNote = (note: NoteData | null) => { setSelectedId(note?.id ?? null); setDraft({ title: note?.title ?? "", body: note?.body ?? "", tags: note?.tags.join(", ") ?? "" }); };
  const persist = () => startTransition(async () => { try { await saveNote({ id: selectedId ?? undefined, title: draft.title || "Sin título", body: draft.body, tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean) }); toast.success(selectedId ? "Nota actualizada" : "Nota creada"); } catch { toast.error("No se pudo guardar la nota"); } });
  return <>
    <PageHeader title="Notas" description="Conocimiento · Markdown" actions={<Button onClick={() => selectNote(null)} className="bg-accent text-bg hover:bg-accent-hover"><Plus className="size-4" /> Nueva nota</Button>} />
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Notas" value={String(notes.length)} icon={NotebookPen} /><KpiCard label="Etiquetas" value={String(tags.size)} icon={Tags} /><KpiCard label="Con contenido" value={String(notes.filter((note) => note.body.trim()).length)} icon={FileText} /><KpiCard label="Formato" value="MD" note="Markdown" tone="success" icon={Hash} /></section>
    <section className="mt-4 grid min-h-[650px] overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-[280px_1fr]"><aside className="border-b border-border lg:border-b-0 lg:border-r"><div className="border-b border-border p-3"><label className="relative block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar notas…" className="h-10 border-border bg-surface-raised pl-9 text-text" /></label></div><div className="max-h-64 overflow-y-auto p-2 lg:max-h-[590px]">{filtered.map((note) => <button key={note.id} onClick={() => selectNote(note)} className={`mb-1 w-full rounded-lg p-3 text-left transition-colors ${selectedId === note.id ? "bg-accent-soft" : "hover:bg-surface-raised"}`}><p className={`truncate text-sm font-medium ${selectedId === note.id ? "text-accent" : "text-text"}`}>{note.title}</p><p className="mt-2 font-mono text-[11px] text-text-faint">{formatDate(note.updatedAt)}</p><div className="mt-2 flex flex-wrap gap-1">{note.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-text-muted">#{tag}</span>)}</div></button>)}{filtered.length === 0 ? <p className="p-5 text-center text-sm text-text-muted">No hay coincidencias.</p> : null}</div></aside>
      <div className="grid min-w-0 lg:grid-cols-2"><div className="flex min-h-[600px] flex-col border-b border-border lg:border-b-0 lg:border-r"><div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="section-label">Editor</p><div className="flex gap-2">{selectedId ? <AlertDialog><AlertDialogTrigger asChild><Button size="icon-sm" variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 /></Button></AlertDialogTrigger><AlertDialogContent className="border-border bg-surface-raised text-text"><AlertDialogHeader><AlertDialogTitle>Eliminar nota</AlertDialogTitle><AlertDialogDescription className="text-text-muted">Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => startTransition(async () => { await deleteNote(selectedId); toast.success("Nota eliminada"); selectNote(null); })}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog> : null}<Button size="sm" onClick={persist} disabled={pending || !draft.title.trim()} className="bg-accent text-bg hover:bg-accent-hover"><Save className="size-4" /> {pending ? "Guardando…" : "Guardar"}</Button></div></div><Input value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} placeholder="Título de la nota" className="h-14 rounded-none border-0 border-b border-border bg-transparent px-4 font-heading text-lg text-text shadow-none focus-visible:ring-0" /><Input value={draft.tags} onChange={(e) => setDraft((current) => ({ ...current, tags: e.target.value }))} placeholder="Etiquetas separadas por comas" className="h-11 rounded-none border-0 border-b border-border bg-transparent px-4 text-sm text-text shadow-none focus-visible:ring-0" /><Textarea value={draft.body} onChange={(e) => setDraft((current) => ({ ...current, body: e.target.value }))} placeholder="Escribe en Markdown…" className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent p-4 font-mono text-sm leading-6 text-text shadow-none focus-visible:ring-0" /></div><div className="min-h-[500px] bg-bg/35"><div className="border-b border-border px-4 py-3"><p className="section-label">Vista previa</p></div><article className="markdown-body p-5"><ReactMarkdown>{draft.body || "*La vista previa aparecerá aquí.*"}</ReactMarkdown></article></div></div>
    </section>
  </>;
}
