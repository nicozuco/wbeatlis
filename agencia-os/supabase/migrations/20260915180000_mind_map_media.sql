-- Mapa mental: imágenes (IMAGE), tarjetas de enlace con vista previa (LINK) y
-- conexiones con trazado, extremos, color y grosor configurables.

ALTER TYPE "MindMapNodeKind" ADD VALUE IF NOT EXISTS 'IMAGE';
ALTER TYPE "MindMapNodeKind" ADD VALUE IF NOT EXISTS 'LINK';

-- media: datos de la imagen (url pública, ruta en Storage, tamaño original) o
-- vista previa del enlace (título, descripción, miniatura, favicon, proveedor).
ALTER TABLE "MindMapNode" ADD COLUMN "media" JSONB;

-- options: trazado (curva, codo, recta), extremos, color, grosor y discontinuo.
-- La columna style se mantiene para los mapas antiguos y se deriva al guardar.
ALTER TABLE "MindMapEdge" ADD COLUMN "options" JSONB;

ALTER TABLE "MindMapNode" DROP CONSTRAINT "MindMapNode_reference_matches_kind";
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_reference_matches_kind" CHECK (
    (kind::text = 'CLIENT' AND "competitorId" IS NULL AND "contentItemId" IS NULL) OR
    (kind::text = 'COMPETITOR' AND "clinicId" IS NULL AND "contentItemId" IS NULL) OR
    (kind::text = 'CONTENT_IDEA' AND "clinicId" IS NULL AND "competitorId" IS NULL) OR
    (kind::text IN ('SHAPE', 'STICKY', 'DRAWING', 'GROUP', 'IMAGE', 'LINK') AND "clinicId" IS NULL AND "competitorId" IS NULL AND "contentItemId" IS NULL)
);

-- Bucket de las imágenes subidas al mapa. Lectura pública (las rutas llevan un
-- UUID imposible de adivinar) para poder pintarlas y exportarlas sin firmar
-- URLs que caducan. Solo las personas con sesión pueden subir o borrar.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('mind-map-images', 'mind-map-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "mind_map_images_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mind-map-images');

CREATE POLICY "mind_map_images_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'mind-map-images');

CREATE POLICY "mind_map_images_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'mind-map-images');
