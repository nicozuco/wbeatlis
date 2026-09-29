"use client";

import { NodeResizer } from "@xyflow/react";

import { resizerControlStyle } from "../graph-utils";
import { useMindMap } from "../mind-map-context";
import { NodeHandles } from "./node-handles";

// Estructura común de todos los nodos del mapa: redimensionado (siempre montado
// y oculto con estilo, ver resizerControlStyle), conectores visibles solo con el
// nodo seleccionado y el contenedor que ocupa todo el tamaño del nodo.
// `cloneable` añade en cada conector el botón que crea una copia conectada y
// `keepAspectRatio` mantiene la proporción al redimensionar (imágenes).
export function BaseNode({
  id,
  selected,
  minWidth,
  minHeight,
  connectable = true,
  cloneable = false,
  keepAspectRatio = false,
  className = "",
  children,
}: {
  id: string;
  selected: boolean;
  minWidth: number;
  minHeight: number;
  connectable?: boolean;
  cloneable?: boolean;
  keepAspectRatio?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { resizeNode } = useMindMap();

  return (
    <div className={`mindmap-node relative h-full w-full ${className}`}>
      <NodeResizer
        minWidth={minWidth}
        minHeight={minHeight}
        keepAspectRatio={keepAspectRatio}
        handleStyle={resizerControlStyle(selected)}
        lineStyle={resizerControlStyle(selected)}
        onResizeEnd={(_event, params) => resizeNode(id, params)}
      />
      {connectable ? <NodeHandles nodeId={id} selected={selected} cloneable={cloneable} /> : null}
      {children}
    </div>
  );
}
