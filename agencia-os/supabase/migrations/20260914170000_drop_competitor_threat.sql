-- Retira el campo "threat" (Alta/Media/Baja): la amenaza de un competidor se
-- expresa solo con el Nivel 1-5 (1 = más peligroso) o Internacional.
--
-- Antes de borrar la columna se trasladan sus datos al nivel. El nivel ya existe
-- en todas las filas y es más fino, así que manda; "threat" solo corrige los
-- casos en que lo contradice:
--   · Alta  obliga a la banda 1-2 → una fila Alta en Nivel 3-5 pasa a Nivel 2.
--   · Baja  obliga a la banda 4-5 → una fila Baja en Nivel 1-3 pasa a Nivel 4.
--   · Media no se traslada: era el valor por defecto de la columna y en la
--     práctica significa "sin valorar".
--   · Internacional queda fuera de la escala 1-5 y no se toca.

UPDATE "Competitor"
SET "threatLevel" = 'LEVEL_2'
WHERE "threat" = 'HIGH'
  AND "threatLevel" IN ('LEVEL_3', 'LEVEL_4', 'LEVEL_5');

UPDATE "Competitor"
SET "threatLevel" = 'LEVEL_4'
WHERE "threat" = 'LOW'
  AND "threatLevel" IN ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');

DROP INDEX IF EXISTS "Competitor_threat_idx";

ALTER TABLE "Competitor" DROP COLUMN "threat";

DROP TYPE "CompetitorThreat";
