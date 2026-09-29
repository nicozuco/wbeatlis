"use client";

import { useEffect, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Lightbulb, Send } from "lucide-react";

import { ToneChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { contentStatusLabels } from "@/lib/domain";
import { useMindMap } from "../mind-map-context";
import type { ContentIdeaFlowNode } from "../types";
import { BaseNode } from "./base-node";

const statusTone: Record<string, "neutral" | "violet" | "info" | "accent" | "success"> = {
  IDEA: "neutral",
  SCRIPT: "violet",
  DESIGN: "info",
  SCHEDULED: "accent",
  PUBLISHED: "success",
};

export function ContentIdeaNode({ id, data, selected }: NodeProps<ContentIdeaFlowNode>) {
  const { records, updateNodeText, openConvertDialog } = useMindMap();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentItem = data.contentItemId ? records.contentItems[data.contentItemId] : undefined;

  useEffect(() => { if (editing) textareaRef.current?.focus(); }, [editing]);

  const startEditing = () => { setDraft(data.text); setEditing(true); };

  const commit = () => {
    setEditing(false);
    if (draft !== data.text) updateNodeText(id, draft);
  };

  return (
    <BaseNode id={id} selected={selected} minWidth={200} minHeight={100} className="flex min-h-[104px] min-w-52 flex-col gap-2 rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-center gap-2 text-text-muted">
        <Lightbulb className="size-3.5" />
        <span className="section-label">Idea de contenido</span>
      </div>
      {data.contentItemId ? (
        <>
          <p className="truncate text-sm font-medium text-text">{contentItem?.title ?? "Contenido eliminado"}</p>
          {contentItem ? <ToneChip tone={statusTone[contentItem.status] ?? "neutral"}>{contentStatusLabels[contentItem.status as keyof typeof contentStatusLabels] ?? contentItem.status}</ToneChip> : null}
        </>
      ) : editing ? (
        <textarea
          ref={textareaRef}
          className="nodrag nowheel flex-1 resize-none bg-transparent text-sm leading-6 text-text outline-none placeholder:text-text-faint"
          value={draft}
          placeholder="Escribe la idea…"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.stopPropagation(); setDraft(data.text); setEditing(false); }
          }}
        />
      ) : (
        <p onDoubleClick={startEditing} className="flex-1 cursor-text whitespace-pre-wrap break-words text-sm leading-6 text-text">
          {data.text || <span className="text-text-faint">Doble clic para escribir…</span>}
        </p>
      )}
      {!data.contentItemId ? (
        <Button type="button" size="sm" variant="outline" onClick={() => openConvertDialog(id, data.text)} className="mt-auto self-start border-border bg-surface-raised text-text">
          <Send className="size-3.5" /> Convertir en contenido
        </Button>
      ) : null}
    </BaseNode>
  );
}
