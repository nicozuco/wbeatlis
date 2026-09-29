-- Agenda: recordatorios con aviso push a la hora exacta en todos los dispositivos.

CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "remindAt" TIMESTAMP(3) NOT NULL,
    -- Momento en que se envió el aviso; NULL = pendiente. Cambiar la hora lo reinicia.
    "sentAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reminder_remindAt_idx" ON "Reminder"("remindAt");
CREATE INDEX "Reminder_sentAt_remindAt_idx" ON "Reminder"("sentAt", "remindAt");

-- Un registro por navegador o dispositivo que ha activado los avisos.
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

GRANT SELECT, INSERT, UPDATE, DELETE ON "Reminder", "PushSubscription" TO agencia_app;

ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencia_app_full_access" ON "Reminder" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "PushSubscription" FOR ALL TO agencia_app USING (true) WITH CHECK (true);

-- Envío programado. Cada minuto pg_cron comprueba si hay recordatorios vencidos
-- sin enviar y, solo entonces, llama por HTTPS a /api/reminders/dispatch de la
-- app, que envía los avisos. La URL y el secreto se leen de Supabase Vault
-- (secretos "reminders_dispatch_url" y "reminders_cron_secret"); mientras no
-- existan, la función no hace nada.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.dispatch_due_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    target_url text;
    cron_secret text;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "Reminder"
        WHERE "sentAt" IS NULL AND "doneAt" IS NULL AND "remindAt" <= (now() AT TIME ZONE 'UTC')
    ) THEN
        RETURN;
    END IF;

    SELECT decrypted_secret INTO target_url FROM vault.decrypted_secrets WHERE name = 'reminders_dispatch_url';
    SELECT decrypted_secret INTO cron_secret FROM vault.decrypted_secrets WHERE name = 'reminders_cron_secret';
    IF target_url IS NULL OR cron_secret IS NULL THEN
        RETURN;
    END IF;

    PERFORM net.http_post(
        url := target_url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || cron_secret),
        body := '{}'::jsonb,
        timeout_milliseconds := 10000
    );
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_due_reminders() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('dispatch-due-reminders', '* * * * *', 'SELECT public.dispatch_due_reminders()');
