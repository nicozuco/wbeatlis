"use client";

import type { NodeProps } from "@xyflow/react";

import { textStyle } from "../graph-utils";
import type { StickyFlowNode } from "../types";
import { BaseNode } from "./base-node";
import { RichTextBlock } from "./rich-text-block";

export function StickyNode({ id, data, selected }: NodeProps<StickyFlowNode>) {
  return (
    <BaseNode id={id} selected={selected} minWidth={80} minHeight={80} cloneable className={`mindmap-sticky mindmap-sticky-${data.color}`}>
      <RichTextBlock nodeId={id} selected={selected} html={data.text} padding="16px" verticalAlign="top" textStyle={textStyle(data.style, "left")} placeholder="Escribe en el pósit…" />
    </BaseNode>
  );
}
