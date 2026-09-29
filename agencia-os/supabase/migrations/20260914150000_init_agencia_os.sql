-- CreateEnum
CREATE TYPE "PipelinePhase" AS ENUM ('UNCONTACTED', 'CONTACTED', 'RESPONDED', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'CONTRACTED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "ThreatLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "CompetitorCategory" AS ENUM ('AI', 'MARKETING', 'MIXED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('URGENT', 'IMPORTANT');

-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('IMAGE', 'CAROUSEL', 'REEL');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('IDEA', 'SCRIPT', 'DESIGN', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "FinanceEntryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "phase" "PipelinePhase" NOT NULL DEFAULT 'UNCONTACTED',
    "leadSource" TEXT,
    "firstContactAt" TIMESTAMP(3),
    "lastInteractionAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "monthlyFeeCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicStageEvent" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "fromPhase" "PipelinePhase",
    "toPhase" "PipelinePhase" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicStageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "threatLevel" "ThreatLevel" NOT NULL,
    "ranking" INTEGER,
    "company" TEXT NOT NULL,
    "agencyType" TEXT,
    "category" "CompetitorCategory" NOT NULL,
    "niche" TEXT,
    "instagram" TEXT,
    "followersCount" INTEGER,
    "postCount" INTEGER,
    "website" TEXT,
    "location" TEXT,
    "trackRecord" TEXT,
    "publicPrice" TEXT,
    "ownNotes" TEXT,
    "followed" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" "TaskPriority",
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "clinicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "format" "ContentFormat" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'IDEA',
    "scheduledFor" TIMESTAMP(3),
    "script" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "clinicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MrrSnapshot" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MrrSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NoteToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NoteToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Clinic_phase_idx" ON "Clinic"("phase");

-- CreateIndex
CREATE INDEX "Clinic_city_idx" ON "Clinic"("city");

-- CreateIndex
CREATE INDEX "Clinic_leadSource_idx" ON "Clinic"("leadSource");

-- CreateIndex
CREATE INDEX "Clinic_nextFollowUpAt_idx" ON "Clinic"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Interaction_clinicId_occurredAt_idx" ON "Interaction"("clinicId", "occurredAt");

-- CreateIndex
CREATE INDEX "Interaction_occurredAt_idx" ON "Interaction"("occurredAt");

-- CreateIndex
CREATE INDEX "ClinicStageEvent_clinicId_changedAt_idx" ON "ClinicStageEvent"("clinicId", "changedAt");

-- CreateIndex
CREATE INDEX "ClinicStageEvent_changedAt_idx" ON "ClinicStageEvent"("changedAt");

-- CreateIndex
CREATE INDEX "Competitor_threatLevel_idx" ON "Competitor"("threatLevel");

-- CreateIndex
CREATE INDEX "Competitor_category_idx" ON "Competitor"("category");

-- CreateIndex
CREATE INDEX "Competitor_ranking_idx" ON "Competitor"("ranking");

-- CreateIndex
CREATE INDEX "Task_status_position_idx" ON "Task"("status", "position");

-- CreateIndex
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");

-- CreateIndex
CREATE INDEX "Task_clinicId_idx" ON "Task"("clinicId");

-- CreateIndex
CREATE INDEX "ContentItem_status_position_idx" ON "ContentItem"("status", "position");

-- CreateIndex
CREATE INDEX "ContentItem_scheduledFor_idx" ON "ContentItem"("scheduledFor");

-- CreateIndex
CREATE INDEX "FinanceEntry_type_occurredAt_idx" ON "FinanceEntry"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "FinanceEntry_clinicId_idx" ON "FinanceEntry"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "MrrSnapshot_month_key" ON "MrrSnapshot"("month");

-- CreateIndex
CREATE INDEX "ResourceLink_category_idx" ON "ResourceLink"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "_NoteToTag_B_index" ON "_NoteToTag"("B");

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicStageEvent" ADD CONSTRAINT "ClinicStageEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NoteToTag" ADD CONSTRAINT "_NoteToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NoteToTag" ADD CONSTRAINT "_NoteToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Private application role. Its password is set out-of-band and never stored
-- in migrations or versioned files.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agencia_app') THEN
        CREATE ROLE agencia_app LOGIN NOINHERIT;
    END IF;
END
$$;

GRANT CONNECT ON DATABASE postgres TO agencia_app;
GRANT USAGE ON SCHEMA public TO agencia_app;
GRANT USAGE ON TYPE
    "PipelinePhase",
    "ThreatLevel",
    "CompetitorCategory",
    "TaskStatus",
    "TaskPriority",
    "ContentFormat",
    "ContentStatus",
    "FinanceEntryType"
TO agencia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO agencia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agencia_app;

-- Supabase exposes the public schema through PostgREST. RLS keeps every table
-- closed to anon/authenticated API clients while allowing only the private
-- database role used by this server-side Next.js application.
ALTER TABLE "Clinic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Interaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClinicStageEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Competitor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinanceEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MrrSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResourceLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_NoteToTag" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencia_app_full_access" ON "Clinic" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "Interaction" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "ClinicStageEvent" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "Competitor" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "Task" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "ContentItem" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "FinanceEntry" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "MrrSnapshot" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "ResourceLink" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "Note" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "Tag" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
CREATE POLICY "agencia_app_full_access" ON "_NoteToTag" FOR ALL TO agencia_app USING (true) WITH CHECK (true);
