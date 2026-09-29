import type { Edge, Node } from "@xyflow/react";

import type { EdgeOptions, ImageMedia, LinkMedia, MindMapTone, NodeStyle, StickyTone, TableMedia } from "@/lib/mind-map-style";

// El `type` de cada nodo de React Flow es literalmente el `kind` que se
// guarda en MindMapNode — evita una tabla de traducción entre los dos.
// El texto de formas y pósits es HTML con formato (ver lib/rich-text.ts).
export type ShapeNodeData = { text: string; color: MindMapTone; style: NodeStyle };
export type StickyNodeData = { text: string; color: StickyTone; style: NodeStyle };
export type DrawingNodeData = { color: MindMapTone; points: [number, number][]; style: NodeStyle };
export type ClientNodeData = { clinicId: string | null };
export type CompetitorNodeData = { competitorId: string | null };
export type ContentIdeaNodeData = { text: string; contentItemId: string | null };
export type GroupNodeData = { text: string; color: MindMapTone | null };
// `uploading`: la imagen se está subiendo y `src` es aún una vista previa local (blob:).
export type ImageNodeData = { media: ImageMedia; uploading?: boolean };
// `loading`: se está leyendo la vista previa del enlace.
export type LinkNodeData = { media: LinkMedia; loading?: boolean };
export type TableNodeData = { media: TableMedia };

export type ShapeFlowNode = Node<ShapeNodeData, "SHAPE">;
export type StickyFlowNode = Node<StickyNodeData, "STICKY">;
export type DrawingFlowNode = Node<DrawingNodeData, "DRAWING">;
export type ClientFlowNode = Node<ClientNodeData, "CLIENT">;
export type CompetitorFlowNode = Node<CompetitorNodeData, "COMPETITOR">;
export type ContentIdeaFlowNode = Node<ContentIdeaNodeData, "CONTENT_IDEA">;
export type GroupFlowNode = Node<GroupNodeData, "GROUP">;
export type ImageFlowNode = Node<ImageNodeData, "IMAGE">;
export type LinkFlowNode = Node<LinkNodeData, "LINK">;
export type TableFlowNode = Node<TableNodeData, "TABLE">;

export type MindMapFlowNode = ShapeFlowNode | StickyFlowNode | DrawingFlowNode | ClientFlowNode | CompetitorFlowNode | ContentIdeaFlowNode | GroupFlowNode | ImageFlowNode | LinkFlowNode | TableFlowNode;

// `options` siempre llega completo (ver resolveEdgeOptions): el componente no tiene que rellenar huecos.
export type MindMapEdgeData = { label: string | null; options: Required<EdgeOptions> };
export type MindMapFlowEdge = Edge<MindMapEdgeData, "labeled">;

export type MindMapRecords = {
  clinics: Record<string, { name: string; phase: string; nextFollowUpAt: string | null }>;
  competitors: Record<string, { company: string; threatLevel: string; followersCount: number | null }>;
  contentItems: Record<string, { title: string; status: string; format: string }>;
};
