-- Tareas obligatorias: una tarea vinculada a una clínica puede impedir que la
-- clínica avance desde esa fase hasta que la tarea esté hecha. NULL = tarea
-- normal. Descartar o retroceder de fase no se bloquea.
ALTER TABLE "Task" ADD COLUMN "blocksPhase" "PipelinePhase";

CREATE INDEX "Task_clinicId_blocksPhase_idx" ON "Task"("clinicId", "blocksPhase");
