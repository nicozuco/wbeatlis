-- Mapa mental estilo FigJam: las notas pasan a ser formas (SHAPE) y se añaden
-- pósits (STICKY) y trazos dibujados a mano alzada (DRAWING).

ALTER TYPE "MindMapNodeKind" RENAME VALUE 'NOTE' TO 'SHAPE';
ALTER TYPE "MindMapNodeKind" ADD VALUE IF NOT EXISTS 'STICKY';
ALTER TYPE "MindMapNodeKind" ADD VALUE IF NOT EXISTS 'DRAWING';

-- style: forma, borde, fuente, tamaño y alineación del texto, o herramienta y
-- grosor de un trazo. points: puntos de un trazo relativos al propio nodo.
ALTER TABLE "MindMapNode" ADD COLUMN "style" JSONB, ADD COLUMN "points" JSONB;

-- El texto de formas y pósits es HTML con formato (negrita, tachado, enlaces y
-- listas). Las notas antiguas eran texto plano: se escapan y los saltos de línea
-- pasan a <br>. Se compara como texto porque los valores nuevos del enum no se
-- pueden usar dentro de la misma transacción en la que se añaden.
UPDATE "MindMapNode"
SET "text" = replace(replace(replace(replace("text", '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), E'\n', '<br>')
WHERE kind::text = 'SHAPE' AND "text" IS NOT NULL;

ALTER TABLE "MindMapNode" DROP CONSTRAINT "MindMapNode_reference_matches_kind";
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_reference_matches_kind" CHECK (
    (kind::text = 'CLIENT' AND "competitorId" IS NULL AND "contentItemId" IS NULL) OR
    (kind::text = 'COMPETITOR' AND "clinicId" IS NULL AND "contentItemId" IS NULL) OR
    (kind::text = 'CONTENT_IDEA' AND "clinicId" IS NULL AND "competitorId" IS NULL) OR
    (kind::text IN ('SHAPE', 'STICKY', 'DRAWING', 'GROUP') AND "clinicId" IS NULL AND "competitorId" IS NULL AND "contentItemId" IS NULL)
);
