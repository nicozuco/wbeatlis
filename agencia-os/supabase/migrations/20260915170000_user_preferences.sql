-- Preferencias de cada usuario: orden y apartados ocultos del menú lateral.
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    -- hrefs de los apartados en el orden elegido; los que falten van al final.
    "navOrder" JSONB NOT NULL DEFAULT '[]',
    -- hrefs de los apartados ocultos en el menú.
    "hiddenNav" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

GRANT SELECT, INSERT, UPDATE, DELETE ON "UserPreference" TO agencia_app;

ALTER TABLE "UserPreference" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencia_app_full_access" ON "UserPreference" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
