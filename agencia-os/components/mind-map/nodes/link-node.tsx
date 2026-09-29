"use client";

import { useState } from "react";
import { NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import { Copy, ExternalLink, Globe, Play, X } from "lucide-react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { ToolbarTooltip } from "../toolbar";
import type { LinkFlowNode } from "../types";
import { BaseNode } from "./base-node";

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Tarjeta de enlace como en Figma: miniatura, título, descripción y dominio
// con su favicon. Los vídeos de YouTube se reproducen dentro de la propia
// tarjeta con el botón de play; el resto se abre con doble clic o desde la
// barra flotante.
export function LinkNode({ id, data, selected, dragging }: NodeProps<LinkFlowNode>) {
  const { media, loading } = data;
  const [playing, setPlaying] = useState(false);
  const [imageFailed, setImageFailed] = useState<string | null>(null);
  const [faviconFailed, setFaviconFailed] = useState<string | null>(null);
  const host = media.siteName || hostOf(media.url);
  const showImage = Boolean(media.image) && imageFailed !== media.image;
  const isVideo = media.provider === "youtube" && Boolean(media.videoId);
  const open = () => window.open(media.url, "_blank", "noopener,noreferrer");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(media.url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <BaseNode id={id} selected={selected} minWidth={200} minHeight={72} className="mindmap-link flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <NodeToolbar isVisible={selected && !dragging} position={Position.Top} offset={16} className="nodrag nopan">
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1 shadow-lg">
          {isVideo ? (
            <ToolbarTooltip label={playing ? "Detener vídeo" : "Reproducir aquí"}>
              <button type="button" aria-label={playing ? "Detener vídeo" : "Reproducir aquí"} onClick={() => setPlaying((value) => !value)} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text">
                {playing ? <X className="size-4" /> : <Play className="size-4" />}
              </button>
            </ToolbarTooltip>
          ) : null}
          <ToolbarTooltip label="Copiar enlace">
            <button type="button" aria-label="Copiar enlace" onClick={() => void copy()} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text">
              <Copy className="size-4" />
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Abrir en otra pestaña">
            <button type="button" aria-label="Abrir en otra pestaña" onClick={open} className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text">
              <ExternalLink className="size-4" />
            </button>
          </ToolbarTooltip>
        </div>
      </NodeToolbar>

      {playing && media.videoId ? (
        <div className="nodrag nopan nowheel relative aspect-video w-full shrink-0 bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${media.videoId}?autoplay=1&rel=0`}
            title={media.title ?? "Vídeo de YouTube"}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        </div>
      ) : showImage ? (
        <div className="relative min-h-0 flex-1 overflow-hidden border-b border-border bg-surface-raised">
          {/* eslint-disable-next-line @next/next/no-img-element -- miniaturas de dominios arbitrarios */}
          <img src={media.image} alt="" draggable={false} referrerPolicy="no-referrer" onError={() => setImageFailed(media.image ?? null)} className="pointer-events-none size-full object-cover select-none" />
          {isVideo ? (
            <button
              type="button"
              aria-label="Reproducir vídeo"
              onClick={(event) => { event.stopPropagation(); setPlaying(true); }}
              className="nodrag absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white transition-transform hover:scale-110"
            >
              <Play className="ml-0.5 size-5 fill-current" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div onDoubleClick={(event) => { event.stopPropagation(); open(); }} className={`flex min-w-0 flex-col justify-center gap-1 px-3 py-2.5 ${showImage || playing ? "shrink-0" : "flex-1"}`}>
        {loading ? (
          <span className="flex items-center gap-2 text-xs text-text-muted"><Spinner /> Cargando vista previa…</span>
        ) : (
          <p className="line-clamp-2 text-[13px] leading-snug font-medium text-text">{media.title || media.url}</p>
        )}
        {media.description && !loading ? <p className="line-clamp-1 text-xs text-text-muted">{media.description}</p> : null}
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-text-faint">
          {media.favicon && faviconFailed !== media.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element -- favicon del dominio enlazado
            <img src={media.favicon} alt="" referrerPolicy="no-referrer" onError={() => setFaviconFailed(media.favicon ?? null)} className="size-3.5 shrink-0 rounded-sm" />
          ) : (
            <Globe className="size-3.5 shrink-0" />
          )}
          <span className="truncate">{host}</span>
        </div>
      </div>
    </BaseNode>
  );
}
