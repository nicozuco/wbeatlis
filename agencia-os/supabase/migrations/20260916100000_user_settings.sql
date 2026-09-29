-- Ajustes de cada usuario: perfil, apariencia y página de inicio.
ALTER TABLE "UserPreference"
    ADD COLUMN "displayName" TEXT,
    ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'dark',
    ADD COLUMN "accent" TEXT NOT NULL DEFAULT 'teal',
    ADD COLUMN "textSize" TEXT NOT NULL DEFAULT 'normal',
    ADD COLUMN "reduceMotion" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "startPage" TEXT NOT NULL DEFAULT '/hoy';

ALTER TABLE "UserPreference"
    ADD CONSTRAINT "UserPreference_theme_check" CHECK ("theme" IN ('dark', 'light', 'system')),
    ADD CONSTRAINT "UserPreference_accent_check" CHECK ("accent" IN ('teal', 'blue', 'violet', 'green', 'amber', 'rose')),
    ADD CONSTRAINT "UserPreference_textSize_check" CHECK ("textSize" IN ('small', 'normal', 'large')),
    ADD CONSTRAINT "UserPreference_displayName_length" CHECK ("displayName" IS NULL OR char_length("displayName") <= 60);
