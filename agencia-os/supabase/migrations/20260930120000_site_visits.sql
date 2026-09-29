-- Visitas a las webs públicas (atlisclinicas.com y propuestas.atlisclinicas.com).
-- Las inserta /api/t. Sin cookies ni IP: el id de sesión es aleatorio y dura
-- mientras la pestaña está abierta.
CREATE TABLE "SiteSession" (
    "id" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT,
    "campaign" TEXT,
    "referrer" TEXT,
    "landingPath" TEXT NOT NULL,
    "currentPath" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "pageviews" INTEGER NOT NULL DEFAULT 1,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SiteSession_lastSeenAt_idx" ON "SiteSession"("lastSeenAt");
CREATE INDEX "SiteSession_startedAt_idx" ON "SiteSession"("startedAt");

CREATE TABLE "SitePageview" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SitePageview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SitePageview_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SiteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SitePageview_occurredAt_idx" ON "SitePageview"("occurredAt");
CREATE INDEX "SitePageview_sessionId_idx" ON "SitePageview"("sessionId");

ALTER TABLE "SiteSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SitePageview" ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON "SiteSession", "SitePageview" TO agencia_app;
CREATE POLICY "agencia_app_full_access" ON "SiteSession" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "SitePageview" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
