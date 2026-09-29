-- Adjuntos de las respuestas escritas de Objetivos. El archivo se guarda en
-- un bucket privado; esta tabla conserva su vínculo con el paso.
CREATE TABLE "GoalStepAttachment" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalStepAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoalStepAttachment_storagePath_key" ON "GoalStepAttachment"("storagePath");
CREATE INDEX "GoalStepAttachment_stepId_createdAt_idx" ON "GoalStepAttachment"("stepId", "createdAt");
ALTER TABLE "GoalStepAttachment" ADD CONSTRAINT "GoalStepAttachment_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "GoalStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON "GoalStepAttachment" TO agencia_app;
ALTER TABLE "GoalStepAttachment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agencia_app_full_access" ON "GoalStepAttachment" FOR ALL TO agencia_app USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('goal-step-attachments', 'goal-step-attachments', false, 4194304,
        ARRAY['application/pdf', 'text/html', 'text/plain', 'image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "goal_step_attachments_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'goal-step-attachments');
CREATE POLICY "goal_step_attachments_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'goal-step-attachments');
CREATE POLICY "goal_step_attachments_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'goal-step-attachments');
