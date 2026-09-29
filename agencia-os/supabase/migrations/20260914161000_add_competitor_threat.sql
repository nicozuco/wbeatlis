CREATE TYPE "CompetitorThreat" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

ALTER TABLE "Competitor"
ADD COLUMN "threat" "CompetitorThreat" NOT NULL DEFAULT 'MEDIUM';

CREATE INDEX "Competitor_threat_idx" ON "Competitor"("threat");
