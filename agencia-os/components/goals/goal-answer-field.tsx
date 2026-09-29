"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Download, Eye, FileCode2, FileImage, FileText, LoaderCircle, Paperclip, PencilLine, RotateCcw, Trash2 } from "lucide-react";

import { saveGoalStepAnswer } from "@/app/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GOAL_ATTACHMENT_MAX_BYTES, GOAL_ATTACHMENT_MAX_PER_STEP, getGoalAttachmentFormat } from "@/lib/goal-attachments";
import type { GoalStepField } from "@/lib/goal-step-fields";

type SaveStatus = "idle" | "saving" | "error";
export type GoalAttachmentData = { id: string; name: string; contentType: string; size: number };

export function GoalAnswerField({ stepId, answer, attachments, field, onSaved, onAttachmentsChange }: {
  stepId: string;
  answer: string | null;
  attachments: GoalAttachmentData[];
  field: GoalStepField;
  onSaved: (answer: string | null) => void;
  onAttachmentsChange: (attachments: GoalAttachmentData[]) => void;
}) {
  const [draft, setDraft] = useState(answer ?? "");
  const [saved, setSaved] = useState(answer ?? "");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GoalAttachmentData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirty = draft.trim() !== saved;
  const inputId = `goal-answer-${stepId}`;

  const save = useCallback(async (value: string) => {
    const normalized = value.trim();
    if (normalized === saved || status === "saving") return;
    setStatus("saving");
    try {
      await saveGoalStepAnswer({ id: stepId, answer: normalized });
      setSaved(normalized);
      onSaved(normalized || null);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [onSaved, saved, status, stepId]);

  useEffect(() => {
    if (!dirty || status !== "idle") return;
    const timer = window.setTimeout(() => void save(draft), 800);
    return () => window.clearTimeout(timer);
  }, [dirty, draft, save, status]);

  const commonProps = {
    id: inputId,
    value: draft,
    maxLength: 4000,
    placeholder: field.placeholder,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(event.target.value);
      setStatus((current) => current === "error" ? "idle" : current);
    },
    onBlur: () => void save(draft),
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Enter" && (field.multiline ? event.metaKey || event.ctrlKey : true)) {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || uploading) return;
    setAttachmentError(null);
    setUploading(true);
    const updated = [...attachments];
    try {
      for (const file of Array.from(files)) {
        if (updated.length >= GOAL_ATTACHMENT_MAX_PER_STEP) throw new Error("Cada respuesta admite como máximo 10 archivos.");
        if (!getGoalAttachmentFormat(file.name)) throw new Error("Formato no admitido. Usa PDF, HTML, TXT, MD, PNG, JPG o WebP.");
        if (file.size === 0 || file.size > GOAL_ATTACHMENT_MAX_BYTES) throw new Error("Cada archivo debe ocupar entre 1 byte y 4 MB.");
        const form = new FormData();
        form.append("stepId", stepId);
        form.append("file", file);
        const response = await fetch("/api/goals/attachments", { method: "POST", body: form });
        const result = (await response.json().catch(() => ({})) ?? {}) as { attachment?: GoalAttachmentData; error?: string };
        if (!response.ok || !result.attachment) throw new Error(result.error || "No se pudo subir el archivo.");
        updated.push(result.attachment as GoalAttachmentData);
        onAttachmentsChange([...updated]);
      }
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = async (attachment: GoalAttachmentData) => {
    setAttachmentError(null);
    setRemovingId(attachment.id);
    try {
      const response = await fetch(`/api/goals/attachments/${encodeURIComponent(attachment.id)}`, { method: "DELETE" });
      const result = (await response.json().catch(() => ({})) ?? {}) as { error?: string };
      if (!response.ok) throw new Error(result.error || "No se pudo eliminar el archivo.");
      onAttachmentsChange(attachments.filter((item) => item.id !== attachment.id));
      if (preview?.id === attachment.id) setPreview(null);
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "No se pudo eliminar el archivo.");
    } finally {
      setRemovingId(null);
    }
  };

  const previewUrl = preview ? `/api/goals/attachments/${encodeURIComponent(preview.id)}` : "";

  return (
    <div className="mt-3 rounded-lg border border-accent/20 bg-accent/[0.045] p-3 sm:p-3.5">
      <label htmlFor={inputId} className="mb-2 flex items-center gap-2 text-xs font-semibold text-accent">
        <PencilLine className="size-3.5" /> {field.label}
      </label>
      {field.multiline ? (
        <Textarea {...commonProps} rows={3} className="min-h-20 resize-y border-border bg-surface text-sm leading-6 text-text placeholder:text-text-faint" />
      ) : (
        <Input {...commonProps} className="h-10 border-border bg-surface text-sm text-text placeholder:text-text-faint" />
      )}
      <div aria-live="polite" className="mt-2 flex min-h-4 items-center justify-end gap-1.5 text-[11px]">
        {status === "saving" ? <span className="inline-flex items-center gap-1.5 text-text-muted"><LoaderCircle className="size-3 animate-spin" /> Guardando…</span>
          : status === "error" ? <button type="button" onClick={() => void save(draft)} className="inline-flex items-center gap-1.5 text-danger hover:underline"><RotateCcw className="size-3" /> No se guardó · Reintentar</button>
            : dirty ? <span className="text-text-faint">Se guarda automáticamente</span>
              : draft.trim() ? <span className="inline-flex items-center gap-1 text-success"><Check className="size-3" /> Guardado</span>
                : <span className="text-text-faint">Escribe tu respuesta</span>}
      </div>
      <div className="mt-3 border-t border-accent/15 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted"><Paperclip className="size-3.5" /> Documentos {attachments.length ? `· ${attachments.length}` : ""}</span>
          <input ref={fileInputRef} type="file" accept=".pdf,.html,.htm,.txt,.md,.png,.jpg,.jpeg,.webp" multiple className="sr-only" aria-label={`Adjuntar documentos a ${field.label}`} onChange={(event) => void uploadFiles(event.currentTarget.files)} />
          <button type="button" disabled={uploading || attachments.length >= GOAL_ATTACHMENT_MAX_PER_STEP} onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50">
            {uploading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}{uploading ? "Subiendo…" : "Adjuntar archivo"}
          </button>
        </div>
        {attachments.length ? <div className="mt-2 space-y-1.5">{attachments.map((attachment) => {
          const Icon = attachment.contentType === "text/html" ? FileCode2 : attachment.contentType.startsWith("image/") ? FileImage : FileText;
          return <div key={attachment.id} className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-2">
            <Icon className="size-4 shrink-0 text-accent" />
            <button type="button" onClick={() => setPreview(attachment)} className="min-w-0 flex-1 truncate text-left text-xs font-medium text-text hover:text-accent" title={`Previsualizar ${attachment.name}`}>{attachment.name}</button>
            <span className="shrink-0 text-[11px] text-text-faint">{attachment.size < 1024 ? `${attachment.size} B` : `${Math.round(attachment.size / 1024)} KB`}</span>
            <button type="button" onClick={() => setPreview(attachment)} className="rounded p-1 text-text-muted hover:bg-accent/10 hover:text-accent" aria-label={`Previsualizar ${attachment.name}`}><Eye className="size-3.5" /></button>
            <AlertDialog><AlertDialogTrigger asChild><button type="button" disabled={removingId === attachment.id} className="rounded p-1 text-text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50" aria-label={`Eliminar ${attachment.name}`}><Trash2 className="size-3.5" /></button></AlertDialogTrigger><AlertDialogContent className="border-border bg-surface-raised text-text"><AlertDialogHeader><AlertDialogTitle>Eliminar documento</AlertDialogTitle><AlertDialogDescription className="text-text-muted">Se eliminará «{attachment.name}» de esta respuesta.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border bg-surface text-text">Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void removeAttachment(attachment)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>;
        })}</div> : <p className="mt-2 text-[11px] text-text-faint">PDF, HTML, texto o imagen · hasta 4 MB por archivo</p>}
        {attachmentError ? <p role="alert" className="mt-2 text-xs text-danger">{attachmentError}</p> : null}
      </div>
      <Dialog open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="flex max-h-[92vh] flex-col gap-3 overflow-hidden border-border bg-surface-raised p-4 text-text sm:max-w-5xl sm:p-5">
          <DialogHeader className="min-w-0 pr-8"><DialogTitle className="truncate font-heading text-lg">{preview?.name ?? "Documento"}</DialogTitle><DialogDescription className="text-text-muted">Vista previa del documento adjunto</DialogDescription></DialogHeader>
          {preview ? <iframe key={preview.id} title={`Vista previa de ${preview.name}`} src={previewUrl} sandbox={preview.contentType === "text/html" ? "" : undefined} className="h-[min(70vh,720px)] w-full rounded-md border border-border bg-white" /> : null}
          {preview ? <a href={`${previewUrl}?download=1`} className="inline-flex items-center self-start gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium text-text hover:text-accent"><Download className="size-3.5" /> Descargar</a> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
