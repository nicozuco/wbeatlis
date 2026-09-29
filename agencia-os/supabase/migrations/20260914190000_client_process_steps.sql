CREATE TABLE "ClinicProcessStep" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "phase" "PipelinePhase" NOT NULL,
  "stepKey" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ClinicProcessStep_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClinicProcessStep_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ClinicProcessStep_clinicId_phase_stepKey_key" ON "ClinicProcessStep"("clinicId", "phase", "stepKey");
ALTER TABLE "ClinicProcessStep" ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ClinicProcessStep" TO agencia_app;
CREATE POLICY "agencia_app_full_access" ON "ClinicProcessStep" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
