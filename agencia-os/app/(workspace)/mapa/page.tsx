import { getMindMapRecords, listMindMaps } from "@/app/actions";
import type { Point } from "@/components/mind-map/geometry";
import { MindMapWorkspace } from "@/components/mind-map/mind-map-workspace";
import type { EdgeOptions, NodeMedia, NodeStyle } from "@/lib/mind-map-style";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const emptyRecords = { clinics: {}, competitors: {}, contentItems: {} };

export default async function MindMapPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const maps = await listMindMaps();
  const activeSummary = (id && maps.find((map) => map.id === id)) || maps[0] || null;

  if (!activeSummary) {
    return <MindMapWorkspace maps={[]} activeMap={null} nodes={[]} edges={[]} records={emptyRecords} />;
  }

  const [nodes, edges] = await Promise.all([
    prisma.mindMapNode.findMany({ where: { mapId: activeSummary.id } }),
    prisma.mindMapEdge.findMany({ where: { mapId: activeSummary.id } }),
  ]);
  const unique = (ids: (string | null)[]) => [...new Set(ids.filter((value): value is string => Boolean(value)))];
  const records = await getMindMapRecords({
    clinicIds: unique(nodes.map((node) => node.clinicId)),
    competitorIds: unique(nodes.map((node) => node.competitorId)),
    contentItemIds: unique(nodes.map((node) => node.contentItemId)),
  });

  return (
    <MindMapWorkspace
      maps={maps.map((map) => ({ id: map.id, name: map.name, updatedAt: map.updatedAt.toISOString() }))}
      activeMap={{ id: activeSummary.id, name: activeSummary.name, updatedAt: activeSummary.updatedAt.toISOString() }}
      nodes={nodes.map((node) => ({
        id: node.id,
        kind: node.kind,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        parentId: node.parentId,
        text: node.text,
        color: node.color,
        clinicId: node.clinicId,
        competitorId: node.competitorId,
        contentItemId: node.contentItemId,
        style: node.style as NodeStyle | null,
        points: node.points as Point[] | null,
        media: node.media as NodeMedia | null,
      }))}
      edges={edges.map((edge) => ({
        id: edge.id,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        style: edge.style,
        options: edge.options as EdgeOptions | null,
      }))}
      records={records}
    />
  );
}
