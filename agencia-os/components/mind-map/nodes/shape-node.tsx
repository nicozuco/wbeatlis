"use client";

import type { NodeProps } from "@xyflow/react";

import { shapePath, shapeTextInset } from "../geometry";
import { DEFAULT_NODE_SIZE, textStyle } from "../graph-utils";
import type { ShapeFlowNode } from "../types";
import { BaseNode } from "./base-node";
import { RichTextBlock } from "./rich-text-block";

export function ShapeNode({ id, data, selected, width, height }: NodeProps<ShapeFlowNode>) {
  const shape = data.style.shape ?? "rounded";
  const stroke = data.style.stroke ?? "solid";
  const w = width ?? DEFAULT_NODE_SIZE.SHAPE.width;
  const h = height ?? DEFAULT_NODE_SIZE.SHAPE.height;
  const { outline, detail } = shapePath(shape, w, h);
  const strokeProps = { strokeWidth: stroke === "none" ? 0 : 1.5, strokeDasharray: stroke === "dashed" ? "6 4" : undefined };

  return (
    <BaseNode id={id} selected={selected} minWidth={48} minHeight={32} cloneable className={`mindmap-shape mindmap-tone-${data.color}`}>
      <svg aria-hidden width={w} height={h} className="pointer-events-none absolute inset-0 overflow-visible">
        <path d={outline} className="mindmap-shape-fill" {...strokeProps} />
        {detail ? <path d={detail} fill="none" className="mindmap-shape-detail" {...strokeProps} /> : null}
      </svg>
      <RichTextBlock nodeId={id} selected={selected} html={data.text} padding={shapeTextInset(shape, w, h)} verticalAlign="center" textStyle={textStyle(data.style, "center")} placeholder="Escribe…" />
    </BaseNode>
  );
}
