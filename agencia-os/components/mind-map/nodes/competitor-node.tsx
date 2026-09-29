"use client";

import type { NodeProps } from "@xyflow/react";
import { Radar, Unlink } from "lucide-react";

import { ThreatChip } from "@/components/shared/status-chip";
import { useMindMap } from "../mind-map-context";
import type { CompetitorFlowNode } from "../types";
import { BaseNode } from "./base-node";

export function CompetitorNode({ id, data, selected }: NodeProps<CompetitorFlowNode>) {
  const { records } = useMindMap();
  const competitor = data.competitorId ? records.competitors[data.competitorId] : undefined;

  return (
    <BaseNode
      id={id}
      selected={selected}
      minWidth={200}
      minHeight={100}
      className={`flex min-h-[104px] min-w-52 flex-col gap-2 rounded-xl border bg-surface p-3 shadow-sm ${competitor ? "border-border" : "border-dashed border-danger/50"}`}
    >
      {competitor ? (
        <>
          <div className="flex items-center gap-2 text-text-muted">
            <Radar className="size-3.5" />
            <span className="section-label">Competidor</span>
          </div>
          <p className="truncate text-sm font-medium text-text">{competitor.company}</p>
          <div className="mt-auto flex items-center justify-between gap-2">
            <ThreatChip level={competitor.threatLevel} />
            <span className="font-mono text-[11px] tabular-nums text-text-muted">{competitor.followersCount?.toLocaleString("es-ES") ?? "—"} seg.</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-danger">
            <Unlink className="size-4" />
            <p className="text-sm font-medium">Competidor eliminado</p>
          </div>
          <p className="text-xs text-text-faint">El registro original ya no existe en Competencia.</p>
        </>
      )}
    </BaseNode>
  );
}
