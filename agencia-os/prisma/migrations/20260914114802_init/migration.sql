-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'UNCONTACTED',
    "leadSource" TEXT,
    "firstContactAt" DATETIME,
    "lastInteractionAt" DATETIME,
    "nextFollowUpAt" DATETIME,
    "monthlyFeeCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interaction_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicStageEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "fromPhase" TEXT,
    "toPhase" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClinicStageEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threatLevel" TEXT NOT NULL,
    "ranking" INTEGER,
    "company" TEXT NOT NULL,
    "agencyType" TEXT,
    "category" TEXT NOT NULL,
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
    "lastReviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueAt" DATETIME,
    "completedAt" DATETIME,
    "position" INTEGER NOT NULL DEFAULT 0,
    "clinicId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "scheduledFor" DATETIME,
    "script" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "clinicId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinanceEntry_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MrrSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" DATETIME NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ResourceLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_NoteToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_NoteToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_NoteToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "_NoteToTag_AB_unique" ON "_NoteToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_NoteToTag_B_index" ON "_NoteToTag"("B");
