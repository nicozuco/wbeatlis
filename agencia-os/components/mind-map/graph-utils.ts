import type { CSSProperties } from "react";

import type { MindMapEdgeStyleValue, MindMapNodeKindValue } from "@/lib/domain";
import { DEFAULT_EDGE_OPTIONS, fontSizePx, type EdgeOptions, type ImageMedia, type LinkMedia, type MindMapTone, type NodeMedia, type NodeStyle, type TableMedia, type StickyTone, type TextAlign } from "@/lib/mind-map-style";
import type { Point } from "./geometry";
import type { MindMapFlowEdge, MindMapFlowNode } from "./types";

// NodeResizer se deja siempre montado (no se le pasa isVisible={selected}) y
// se oculta con estilo. Si en vez de esto se monta/desmonta como efecto del
// primer clic de una interacción (seleccionar o empezar a arrastrar), ese
// clic inserta 8 nodos nuevos en el DOM a mitad de gesto — eso rompe la
// detección de doble clic del propio navegador (dos clics ya no caen sobre
// el mismo elemento) y puede dejar enganchado el arrastre que empezaba con
// ese mismo clic. Ocultarlo con opacidad + pointer-events evita la mutación.
export function resizerControlStyle(selected: boolean): CSSProperties {
  return { opacity: selected ? 1 : 0, pointerEvents: selected ? "auto" : "none" };
}

// Por debajo de este zoom los conectores no se muestran (como en FigJam al alejarse).
export const HANDLE_MIN_ZOOM = 0.45;

// Separación entre una forma y la copia que se crea desde uno de sus conectores.
// La vista previa en globals.css (.mindmap-clone-ghost-*) usa la misma distancia.
export const CLONE_GAP = 80;

// Forma de un nodo y una conexión tal como se leen y se guardan en base de datos.
export type RawMindMapNode = {
  id: string;
  kind: MindMapNodeKindValue;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  parentId: string | null;
  text: string | null;
  color: string | null;
  clinicId: string | null;
  competitorId: string | null;
  contentItemId: string | null;
  style: NodeStyle | null;
  points: Point[] | null;
  media: NodeMedia | null;
};

export type RawMindMapEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle: string | null;
  targetHandle: string | null;
  label: string | null;
  style: MindMapEdgeStyleValue;
  options: EdgeOptions | null;
};

export const DEFAULT_NODE_SIZE: Record<MindMapNodeKindValue, { width: number; height: number }> = {
  SHAPE: { width: 200, height: 120 },
  STICKY: { width: 200, height: 200 },
  DRAWING: { width: 40, height: 40 },
  CLIENT: { width: 220, height: 120 },
  COMPETITOR: { width: 220, height: 120 },
  CONTENT_IDEA: { width: 220, height: 140 },
  GROUP: { width: 340, height: 240 },
  IMAGE: { width: 320, height: 220 },
  LINK: { width: 320, height: 264 },
  TABLE: { width: 360, height: 120 },
};

// Las conexiones guardadas antes de existir `options` solo tenían style
// (SOLID/DASHED/ARROW): se leen como rectas, igual que las nuevas.
export function resolveEdgeOptions(options: EdgeOptions | null, legacyStyle: MindMapEdgeStyleValue = "SOLID"): Required<EdgeOptions> {
  if (!options) return { ...DEFAULT_EDGE_OPTIONS, end: legacyStyle === "ARROW" ? "arrow" : "none", dashed: legacyStyle === "DASHED" };
  return { ...DEFAULT_EDGE_OPTIONS, ...options };
}

export function toFlowNode(node: RawMindMapNode): MindMapFlowNode {
  const size = DEFAULT_NODE_SIZE[node.kind];
  const base = {
    id: node.id,
    position: { x: node.x, y: node.y },
    width: node.width ?? size.width,
    height: node.height ?? size.height,
    parentId: node.parentId ?? undefined,
    // Un grupo debe dibujarse detrás de sus hijos.
    zIndex: node.kind === "GROUP" ? -1 : undefined,
  };
  switch (node.kind) {
    case "SHAPE":
      return { ...base, type: "SHAPE", data: { text: node.text ?? "", color: (node.color as MindMapTone) ?? "accent", style: node.style ?? {} } };
    case "STICKY":
      return { ...base, type: "STICKY", data: { text: node.text ?? "", color: (node.color as StickyTone) ?? "yellow", style: node.style ?? {} } };
    case "DRAWING":
      // Solo el propio trazo recibe el puntero (ver DrawingNode): la caja vacía
      // alrededor no debe tapar lo que haya debajo.
      return { ...base, type: "DRAWING", style: { pointerEvents: "none" }, data: { color: (node.color as MindMapTone) ?? "neutral", points: node.points ?? [], style: node.style ?? {} } };
    case "CLIENT":
      return { ...base, type: "CLIENT", data: { clinicId: node.clinicId } };
    case "COMPETITOR":
      return { ...base, type: "COMPETITOR", data: { competitorId: node.competitorId } };
    case "CONTENT_IDEA":
      return { ...base, type: "CONTENT_IDEA", data: { text: node.text ?? "", contentItemId: node.contentItemId } };
    case "GROUP":
      return { ...base, type: "GROUP", data: { text: node.text ?? "", color: (node.color as MindMapTone | null) ?? null } };
    case "IMAGE":
      return { ...base, type: "IMAGE", data: { media: (node.media as ImageMedia | null) ?? { src: "" } } };
    case "LINK":
      return { ...base, type: "LINK", data: { media: (node.media as LinkMedia | null) ?? { url: "" } } };
    case "TABLE":
      return { ...base, type: "TABLE", data: { media: (node.media as TableMedia | null) ?? { cells: [[""]] } } };
  }
}

// Inverso de toFlowNode: lo que se envía al guardar.
export function fromFlowNode(node: MindMapFlowNode): RawMindMapNode {
  const size = DEFAULT_NODE_SIZE[node.type];
  const base: RawMindMapNode = {
    id: node.id,
    kind: node.type,
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? node.measured?.width ?? size.width,
    height: node.height ?? node.measured?.height ?? size.height,
    parentId: node.parentId ?? null,
    text: null,
    color: null,
    clinicId: null,
    competitorId: null,
    contentItemId: null,
    style: null,
    points: null,
    media: null,
  };
  switch (node.type) {
    case "SHAPE":
    case "STICKY":
      return { ...base, text: node.data.text, color: node.data.color, style: node.data.style };
    case "DRAWING":
      return { ...base, color: node.data.color, style: node.data.style, points: node.data.points };
    case "CLIENT":
      return { ...base, clinicId: node.data.clinicId };
    case "COMPETITOR":
      return { ...base, competitorId: node.data.competitorId };
    case "CONTENT_IDEA":
      return { ...base, text: node.data.contentItemId ? null : node.data.text, contentItemId: node.data.contentItemId };
    case "GROUP":
      return { ...base, text: node.data.text, color: node.data.color };
    case "IMAGE":
    case "LINK":
    case "TABLE":
      return { ...base, media: node.data.media };
  }
}

export function toFlowEdge(edge: RawMindMapEdge): MindMapFlowEdge {
  return {
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    type: "labeled",
    data: { label: edge.label, options: resolveEdgeOptions(edge.options, edge.style) },
  };
}

export function fromFlowEdge(edge: MindMapFlowEdge): RawMindMapEdge {
  const options = edge.data?.options ?? resolveEdgeOptions(null);
  return {
    id: edge.id,
    sourceId: edge.source,
    targetId: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    label: edge.data?.label ?? null,
    style: options.dashed ? "DASHED" : options.end !== "none" ? "ARROW" : "SOLID",
    options,
  };
}

// Tipografía del texto de formas y pósits a partir de su estilo guardado.
export function textStyle(style: NodeStyle, defaultAlign: TextAlign): CSSProperties {
  const font = style.font ?? "sans";
  return {
    fontFamily: font === "mono" ? "var(--font-jetbrains-mono), monospace" : font === "heading" ? "var(--font-inter-tight), sans-serif" : "var(--font-inter), sans-serif",
    fontSize: fontSizePx[style.fontSize ?? "md"],
    textAlign: style.align ?? defaultAlign,
  };
}

// Ids de los registros reales que referencian los nodos, para leer sus datos en vivo.
export function referencedRecordIds(nodes: MindMapFlowNode[]) {
  const clinicIds = new Set<string>();
  const competitorIds = new Set<string>();
  const contentItemIds = new Set<string>();
  for (const node of nodes) {
    if (node.type === "CLIENT" && node.data.clinicId) clinicIds.add(node.data.clinicId);
    if (node.type === "COMPETITOR" && node.data.competitorId) competitorIds.add(node.data.competitorId);
    if (node.type === "CONTENT_IDEA" && node.data.contentItemId) contentItemIds.add(node.data.contentItemId);
  }
  return { clinicIds: [...clinicIds], competitorIds: [...competitorIds], contentItemIds: [...contentItemIds] };
}

// Ordena los nodos para que un grupo aparezca siempre antes que sus hijos —
// React Flow lo exige para calcular correctamente la posición absoluta de
// los nodos anidados.
export function sortNodesParentFirst(nodes: MindMapFlowNode[]): MindMapFlowNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depthOf = (node: MindMapFlowNode, seen = new Set<string>()): number => {
    if (!node.parentId || seen.has(node.id)) return 0;
    seen.add(node.id);
    const parent = byId.get(node.parentId);
    return parent ? 1 + depthOf(parent, seen) : 0;
  };
  return [...nodes].sort((a, b) => depthOf(a) - depthOf(b));
}

export function isDescendantOf(nodes: MindMapFlowNode[], candidateId: string, ancestorId: string): boolean {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let current = byId.get(candidateId);
  const seen = new Set<string>();
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    if (seen.has(current.id)) break;
    seen.add(current.id);
    current = byId.get(current.parentId);
  }
  return false;
}

// Un grupo puede contener cualquier nodo, incluido otro grupo, siempre que no
// se intente convertir uno de sus descendientes en su padre (crearía un ciclo).
export function canReparentNodeToGroup(nodes: MindMapFlowNode[], nodeId: string, groupId: string): boolean {
  const group = nodes.find((node) => node.id === groupId);
  return group?.type === "GROUP" && group.id !== nodeId && !isDescendantOf(nodes, group.id, nodeId);
}
