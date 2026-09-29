-- Recursos pasa a ser un gestor de contraseñas con clave maestra.
--
-- Cifrado de extremo a extremo: usuario, contraseña y notas se cifran en el
-- navegador (AES-GCM 256 con una clave derivada por PBKDF2 de la clave maestra)
-- y aquí solo se guarda el texto cifrado. Ni Supabase ni el servidor pueden
-- descifrarlos. Título, enlace, categoría y descripción quedan en claro para
-- poder listar y abrir recursos sin desbloquear.

-- Parámetros de derivación de la clave maestra (una sola fila). `verifier` es un
-- texto conocido cifrado con la clave: descifrarlo comprueba que la clave es la buena.
CREATE TABLE "VaultConfig" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "salt" TEXT NOT NULL,
    "iterations" INTEGER NOT NULL,
    "verifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultConfig_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VaultConfig_single_row" CHECK ("id" = 'main')
);

CREATE TABLE "VaultItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    -- NULL = entrada solo con enlace, sin credenciales.
    "secret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VaultItem_category_idx" ON "VaultItem"("category");

-- Los recursos existentes pasan al gestor como entradas sin credenciales.
INSERT INTO "VaultItem" ("id", "title", "url", "category", "description", "createdAt", "updatedAt")
SELECT "id", "title", "url", "category", "description", "createdAt", "updatedAt" FROM "ResourceLink";

DROP TABLE "ResourceLink";

GRANT SELECT, INSERT, UPDATE, DELETE ON "VaultConfig", "VaultItem" TO agencia_app;

ALTER TABLE "VaultConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VaultItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencia_app_full_access" ON "VaultConfig" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "VaultItem" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
