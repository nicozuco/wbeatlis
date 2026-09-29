-- Mapa mental: tablas (TABLE). Las celdas y la fila de cabecera se guardan en
-- la columna media: { "cells": [["...", ...], ...], "header": true }.

ALTER TYPE "MindMapNodeKind" ADD VALUE IF NOT EXISTS 'TABLE';

ALTER TABLE "MindMapNode" DROP CONSTRAINT "MindMapNode_reference_matches_kind";
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_reference_matches_kind" CHECK (
    (kind::text = 'CLIENT' AND "competitorId" IS NULL AND "contentItemId" IS NULL) OR
    (kind::text = 'COMPETITOR' AND "clinicId" IS NULL AND "contentItemId" IS NULL) OR
    (kind::text = 'CONTENT_IDEA' AND "clinicId" IS NULL AND "competitorId" IS NULL) OR
    (kind::text IN ('SHAPE', 'STICKY', 'DRAWING', 'GROUP', 'IMAGE', 'LINK', 'TABLE') AND "clinicId" IS NULL AND "competitorId" IS NULL AND "contentItemId" IS NULL)
);
