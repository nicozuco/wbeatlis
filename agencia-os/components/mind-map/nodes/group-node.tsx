"use client";

import { useEffect, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";

import { useMindMap } from "../mind-map-context";
import type { GroupFlowNode } from "../types";
import { BaseNode } from "./base-node";

export function GroupNode({ id, data, selected }: NodeProps<GroupFlowNode>) {
  const { updateNodeText } = useMindMap();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const startEditing = () => { setDraft(data.text); setEditing(true); };

  const commit = () => {
    setEditing(false);
    if (draft !== data.text) updateNodeText(id, draft);
  };

  return (
    <BaseNode id={id} selected={selected} minWidth={220} minHeight={160} connectable={false} className={`mindmap-group mindmap-tone-${data.color ?? "neutral"} rounded-lg border`}>
      {/* Título dentro de la esquina superior izquierda, como las secciones de Figma. */}
      <div className="absolute top-2.5 left-2.5 max-w-[calc(100%-20px)]">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit();
              if (event.key === "Escape") { event.stopPropagation(); setDraft(data.text); setEditing(false); }
            }}
            className="nodrag h-7 rounded-md border border-accent bg-surface px-2 text-[13px] font-medium text-text outline-none"
          />
        ) : (
          <p onDoubleClick={startEditing} className="mindmap-group-title cursor-text truncate rounded-md px-2 py-0.5 text-[13px] font-medium">
            {data.text || "Grupo"}
          </p>
        )}
      </div>
    </BaseNode>
  );
}
