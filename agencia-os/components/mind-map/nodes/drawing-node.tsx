"use client";

import type { NodeProps } from "@xyflow/react";

import { smoothPath } from "../geometry";
import { useMindMap } from "../mind-map-context";
import type { DrawingFlowNode } from "../types";
import { BaseNode } from "./base-node";

// Trazo a mano alzada. El nodo no recibe el puntero (style pointerEvents: none
// en toFlowNode); solo lo recibe el propio trazo, con una franja invisible más
// ancha para que sea fácil de seleccionar y arrastrar.
export function DrawingNode({ id, data, selected, width, height }: NodeProps<DrawingFlowNode>) {
  const { erasingIds } = useMindMap();
  const w = width ?? data.style.baseWidth ?? 1;
  const h = height ?? data.style.baseHeight ?? 1;
  const d = smoothPath(data.points, w / (data.style.baseWidth ?? w), h / (data.style.baseHeight ?? h));
  const strokeWidth = data.style.strokeWidth ?? 4;
  const highlighter = data.style.tool === "highlighter";

  return (
    <BaseNode
      id={id}
      selected={selected}
      minWidth={8}
      minHeight={8}
      connectable={false}
      className={`mindmap-drawing-stroke mindmap-tone-${data.color} pointer-events-none transition-opacity ${erasingIds.has(id) ? "opacity-30" : ""}`}
    >
      <svg aria-hidden width={w} height={h} className="absolute inset-0 overflow-visible">
        <path d={d} fill="none" stroke="var(--drawing-color)" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={highlighter ? 0.4 : 1} />
        <path d={d} fill="none" stroke="transparent" strokeWidth={Math.max(strokeWidth, 14)} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: "stroke" }} />
      </svg>
    </BaseNode>
  );
}
