"use client";

import type { NodeProps } from "@xyflow/react";
import { Building2, Unlink } from "lucide-react";

import { PhaseChip } from "@/components/shared/status-chip";
import { formatDate } from "@/lib/format";
import { useMindMap } from "../mind-map-context";
import type { ClientFlowNode } from "../types";
import { BaseNode } from "./base-node";

// La ficha del cliente se abre con doble clic (onNodeDoubleClick en el
// lienzo): un clic simple solo selecciona, como en Figma. React Flow llama al
// onClick del nodo aunque haya habido arrastre, así que abrirla con un clic la
// abriría también al soltar el nodo tras moverlo.
export function ClientNode({ id, data, selected }: NodeProps<ClientFlowNode>) {
  const { records } = useMindMap();
  const clinic = data.clinicId ? records.clinics[data.clinicId] : undefined;

  return (
    <BaseNode
      id={id}
      selected={selected}
      minWidth={200}
      minHeight={100}
      className={`flex min-h-[104px] min-w-52 flex-col gap-2 rounded-xl border bg-surface p-3 shadow-sm ${clinic ? "border-border" : "justify-center border-dashed border-danger/50"}`}
    >
      {clinic ? (
        <>
          <div className="flex items-center gap-2 text-text-muted">
            <Building2 className="size-3.5" />
            <span className="section-label">Cliente</span>
          </div>
          <p className="truncate text-sm font-medium text-text">{clinic.name}</p>
          <div className="mt-auto flex items-center justify-between gap-2">
            <PhaseChip phase={clinic.phase} />
            <span className="font-mono text-[11px] tabular-nums text-text-muted">{formatDate(clinic.nextFollowUpAt)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-danger">
            <Unlink className="size-4" />
            <p className="text-sm font-medium">Cliente eliminado</p>
          </div>
          <p className="text-xs text-text-faint">El registro original ya no existe en Clientes.</p>
        </>
      )}
    </BaseNode>
  );
}
