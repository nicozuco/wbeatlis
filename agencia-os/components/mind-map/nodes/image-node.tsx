"use client";

import type { NodeProps } from "@xyflow/react";
import { ImageOff } from "lucide-react";
import { useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import type { ImageFlowNode } from "../types";
import { BaseNode } from "./base-node";

// Imagen pegada, arrastrada o elegida desde la barra. Se ajusta al tamaño del
// nodo sin deformarse; al crearla, el nodo toma su proporción original.
export function ImageNode({ id, data, selected }: NodeProps<ImageFlowNode>) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = Boolean(data.media.src) && failedSrc === data.media.src;

  return (
    <BaseNode id={id} selected={selected} minWidth={48} minHeight={48} keepAspectRatio className="mindmap-image overflow-visible">
      {data.media.src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- el lienzo pinta URLs arbitrarias y html-to-image necesita un <img> normal
        <img
          src={data.media.src}
          alt=""
          draggable={false}
          referrerPolicy="no-referrer"
          crossOrigin={data.media.path ? "anonymous" : undefined}
          onError={() => setFailedSrc(data.media.src)}
          className={`pointer-events-none size-full rounded-md object-contain select-none ${data.uploading ? "opacity-60" : ""}`}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface text-text-faint">
          <ImageOff className="size-5" />
          <span className="text-xs">No se pudo cargar la imagen</span>
        </div>
      )}
      {data.uploading ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex items-center gap-2 rounded-lg bg-surface-raised px-2.5 py-1.5 text-xs text-text shadow-lg"><Spinner /> Subiendo…</span>
        </div>
      ) : null}
    </BaseNode>
  );
}
