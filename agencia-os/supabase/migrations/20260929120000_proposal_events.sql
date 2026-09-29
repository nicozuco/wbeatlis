-- Visitas a las propuestas públicas: abierta, leida (llegó a la oferta),
-- demo_pulsada y compartida. Las inserta /api/propuestas/evento.
CREATE TABLE "ProposalEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clinicName" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "device" TEXT,
    "city" TEXT,
    "country" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProposalEvent_slug_occurredAt_idx" ON "ProposalEvent"("slug", "occurredAt");
CREATE INDEX "ProposalEvent_occurredAt_idx" ON "ProposalEvent"("occurredAt");

ALTER TABLE "ProposalEvent" ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ProposalEvent" TO agencia_app;
CREATE POLICY "agencia_app_full_access" ON "ProposalEvent" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
