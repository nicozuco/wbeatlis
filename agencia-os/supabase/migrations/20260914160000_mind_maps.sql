-- CreateEnum
CREATE TYPE "MindMapNodeKind" AS ENUM ('NOTE', 'CLIENT', 'COMPETITOR', 'CONTENT_IDEA', 'GROUP');

-- CreateEnum
CREATE TYPE "MindMapEdgeStyle" AS ENUM ('SOLID', 'DASHED', 'ARROW');

-- CreateTable
CREATE TABLE "MindMap" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindMapNode" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "kind" "MindMapNodeKind" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "parentId" TEXT,
    "text" TEXT,
    "color" TEXT,
    "clinicId" TEXT,
    "competitorId" TEXT,
    "contentItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMapNode_pkey" PRIMARY KEY ("id"),
    -- Cada nodo solo puede rellenar la columna de referencia que corresponde
    -- a su kind. Un nodo CLIENT puede tener clinicId = NULL (huérfano tras
    -- borrar la clínica) pero nunca puede tener competitorId ni
    -- contentItemId, y viceversa.
    CONSTRAINT "MindMapNode_reference_matches_kind" CHECK (
        (kind = 'CLIENT' AND "competitorId" IS NULL AND "contentItemId" IS NULL) OR
        (kind = 'COMPETITOR' AND "clinicId" IS NULL AND "contentItemId" IS NULL) OR
        (kind = 'CONTENT_IDEA' AND "clinicId" IS NULL AND "competitorId" IS NULL) OR
        (kind IN ('NOTE', 'GROUP') AND "clinicId" IS NULL AND "competitorId" IS NULL AND "contentItemId" IS NULL)
    )
);

-- CreateTable
CREATE TABLE "MindMapEdge" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "sourceHandle" TEXT,
    "targetHandle" TEXT,
    "label" TEXT,
    "style" "MindMapEdgeStyle" NOT NULL DEFAULT 'SOLID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMapEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MindMapNode_mapId_idx" ON "MindMapNode"("mapId");

-- CreateIndex
CREATE INDEX "MindMapNode_parentId_idx" ON "MindMapNode"("parentId");

-- CreateIndex
CREATE INDEX "MindMapNode_clinicId_idx" ON "MindMapNode"("clinicId");

-- CreateIndex
CREATE INDEX "MindMapNode_competitorId_idx" ON "MindMapNode"("competitorId");

-- CreateIndex
CREATE INDEX "MindMapNode_contentItemId_idx" ON "MindMapNode"("contentItemId");

-- CreateIndex
CREATE INDEX "MindMapEdge_mapId_idx" ON "MindMapEdge"("mapId");

-- CreateIndex
CREATE INDEX "MindMapEdge_sourceId_idx" ON "MindMapEdge"("sourceId");

-- CreateIndex
CREATE INDEX "MindMapEdge_targetId_idx" ON "MindMapEdge"("targetId");

-- AddForeignKey
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "MindMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MindMapNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapEdge" ADD CONSTRAINT "MindMapEdge_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "MindMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapEdge" ADD CONSTRAINT "MindMapEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MindMapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindMapEdge" ADD CONSTRAINT "MindMapEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "MindMapNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Extiende los privilegios del rol privado agencia_app a las tablas y tipos
-- nuevos. El GRANT ON ALL TABLES de la migración inicial solo cubrió las
-- tablas que existían en ese momento.
GRANT USAGE ON TYPE "MindMapNodeKind", "MindMapEdgeStyle" TO agencia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "MindMap", "MindMapNode", "MindMapEdge" TO agencia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agencia_app;

-- RLS: mismo patrón que el resto de tablas de negocio — cerradas a
-- anon/authenticated, accesibles solo desde el servidor vía agencia_app.
ALTER TABLE "MindMap" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MindMapNode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MindMapEdge" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencia_app_full_access" ON "MindMap" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "MindMapNode" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "MindMapEdge" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
