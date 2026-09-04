-- R5: Revision Runtime Completion
-- Add canonical curriculum references to RevisionItem
ALTER TABLE "RevisionItem" ADD COLUMN "curriculumObjectiveId" TEXT;
ALTER TABLE "RevisionItem" ADD COLUMN "curriculumTopicId" TEXT;
ALTER TABLE "RevisionItem" ADD COLUMN "curriculumSkillId" TEXT;
ALTER TABLE "RevisionItem" ADD COLUMN "originType" TEXT;
ALTER TABLE "RevisionItem" ADD COLUMN "originRef" TEXT;
ALTER TABLE "RevisionItem" ADD COLUMN "dedupeKey" TEXT;

-- PostgreSQL allows multiple NULLs in unique constraints
CREATE UNIQUE INDEX "RevisionItem_userId_dedupeKey_key" ON "RevisionItem"("userId", "dedupeKey") WHERE "dedupeKey" IS NOT NULL;

-- Durable guided revision session state
CREATE TABLE "RevisionGuidedSessionRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revisionItemId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "examFocus" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentStage" TEXT NOT NULL DEFAULT 'recall',
    "lastCompletedStage" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastResult" JSONB,

    CONSTRAINT "RevisionGuidedSessionRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RevisionGuidedSessionRecord_userId_status_idx" ON "RevisionGuidedSessionRecord"("userId", "status");
CREATE INDEX "RevisionGuidedSessionRecord_userId_revisionItemId_idx" ON "RevisionGuidedSessionRecord"("userId", "revisionItemId");
CREATE INDEX "RevisionGuidedSessionRecord_status_idx" ON "RevisionGuidedSessionRecord"("status");

-- Durable guided revision step checkpoint
CREATE TABLE "RevisionGuidedStepRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'claimed',
    "supportAction" TEXT,
    "safeResponseSignal" TEXT,
    "evidenceId" TEXT,
    "masteryApplied" BOOLEAN NOT NULL DEFAULT false,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RevisionGuidedStepRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RevisionGuidedStepRecord_sessionId_stage_key" ON "RevisionGuidedStepRecord"("sessionId", "stage");
CREATE UNIQUE INDEX "RevisionGuidedStepRecord_sessionId_idempotencyKey_key" ON "RevisionGuidedStepRecord"("sessionId", "idempotencyKey");
CREATE INDEX "RevisionGuidedStepRecord_sessionId_idx" ON "RevisionGuidedStepRecord"("sessionId");
CREATE INDEX "RevisionGuidedStepRecord_idempotencyKey_idx" ON "RevisionGuidedStepRecord"("idempotencyKey");

-- Weak signal receipt for idempotent reconciliation
CREATE TABLE "RevisionSourceSignalReceipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "revisionItemId" TEXT NOT NULL,
    "curriculumObjectiveId" TEXT,
    "curriculumTopicId" TEXT,
    "curriculumSkillId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisionSourceSignalReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RevisionSourceSignalReceipt_userId_sourceType_sourceRef_key" ON "RevisionSourceSignalReceipt"("userId", "sourceType", "sourceRef");
CREATE INDEX "RevisionSourceSignalReceipt_userId_idx" ON "RevisionSourceSignalReceipt"("userId");
CREATE INDEX "RevisionSourceSignalReceipt_revisionItemId_idx" ON "RevisionSourceSignalReceipt"("revisionItemId");

-- Revision note link (moved from runtime DDL to schema)
-- R5 Defect N: Use IF NOT EXISTS for legacy databases where runtime DDL already created this table
CREATE TABLE IF NOT EXISTS "RevisionNoteLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceItemId" TEXT NOT NULL,
    "targetItemId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "whyConnected" TEXT NOT NULL,
    "whySignals" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "sharedTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "explainability" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "actionStep" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisionNoteLink_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RevisionNoteLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RevisionNoteLink_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "RevisionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RevisionNoteLink_targetItemId_fkey" FOREIGN KEY ("targetItemId") REFERENCES "RevisionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RevisionNoteLink_user_source_target_uidx" ON "RevisionNoteLink"("userId", "sourceItemId", "targetItemId");
CREATE INDEX IF NOT EXISTS "RevisionNoteLink_user_source_score_idx" ON "RevisionNoteLink"("userId", "sourceItemId", "score" DESC, "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "RevisionNoteLink_user_target_idx" ON "RevisionNoteLink"("userId", "targetItemId");

-- Add foreign keys for guided session
ALTER TABLE "RevisionGuidedSessionRecord" ADD CONSTRAINT "RevisionGuidedSessionRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RevisionGuidedSessionRecord" ADD CONSTRAINT "RevisionGuidedSessionRecord_revisionItemId_fkey" FOREIGN KEY ("revisionItemId") REFERENCES "RevisionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RevisionGuidedStepRecord" ADD CONSTRAINT "RevisionGuidedStepRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RevisionGuidedSessionRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
