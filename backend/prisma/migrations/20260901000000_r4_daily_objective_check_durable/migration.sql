-- R4 Daily Objective Check Durable State
-- Additive migration: create four Prisma models for daily-check lifecycle and add confidence uniqueness
-- No existing tables are altered destructively.

CREATE TABLE IF NOT EXISTS "DailyObjectiveCheckSessionRecord" (
    "checkSessionId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "topicId" TEXT,
    "skillId" TEXT,
    "objectiveId" TEXT NOT NULL,
    "dailySeedId" TEXT,
    "blueprintId" TEXT,
    "sourceTruthStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requiredSteps" JSONB NOT NULL DEFAULT '[]',
    "completedSteps" JSONB NOT NULL DEFAULT '[]',
    "confidenceBefore" TEXT,
    "confidenceAfter" TEXT,
    "safeSignalBuckets" JSONB NOT NULL DEFAULT '[]',
    "safeEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "modeDestinationsUsed" JSONB NOT NULL DEFAULT '[]',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "hintUsageBucket" TEXT,
    "explanationQualityBucket" TEXT,
    "recallQualityBucket" TEXT,
    "teachBackQualityBucket" TEXT,
    "transferCheckBucket" TEXT,
    "delayedRecallBucket" TEXT,
    "antiCheatSignalLabels" JSONB NOT NULL DEFAULT '[]',
    "learnerSafeReason" TEXT,
    "teacherSafeReason" TEXT,
    "evidenceId" TEXT,
    "masteryResult" JSONB,
    "weakSignalRef" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DailyObjectiveCheckSessionRecord_pkey" PRIMARY KEY ("checkSessionId")
);

CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckSessionRecord_schoolId_studentId_idx" ON "DailyObjectiveCheckSessionRecord"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckSessionRecord_schoolId_idx" ON "DailyObjectiveCheckSessionRecord"("schoolId");
CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckSessionRecord_objectiveId_idx" ON "DailyObjectiveCheckSessionRecord"("objectiveId");
CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckSessionRecord_status_idx" ON "DailyObjectiveCheckSessionRecord"("status");

CREATE TABLE IF NOT EXISTS "DailyObjectiveCheckAttemptRecord" (
    "attemptId" TEXT NOT NULL,
    "checkSessionId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "attemptType" TEXT NOT NULL,
    "signalBucket" TEXT NOT NULL,
    "hintUsageBucket" TEXT,
    "explanationQualityBucket" TEXT,
    "recallQualityBucket" TEXT,
    "teachBackQualityBucket" TEXT,
    "transferCheckBucket" TEXT,
    "delayedRecallBucket" TEXT,
    "antiCheatLabels" JSONB NOT NULL DEFAULT '[]',
    "timeSpentSeconds" INTEGER,
    "safeEvidenceRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyObjectiveCheckAttemptRecord_pkey" PRIMARY KEY ("attemptId")
);

CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckAttemptRecord_checkSessionId_idx" ON "DailyObjectiveCheckAttemptRecord"("checkSessionId");
CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckAttemptRecord_schoolId_studentId_idx" ON "DailyObjectiveCheckAttemptRecord"("schoolId", "studentId");

CREATE TABLE IF NOT EXISTS "DailyObjectiveCheckConfidenceRecord" (
    "checkpointId" TEXT NOT NULL,
    "checkSessionId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "checkpointType" TEXT NOT NULL,
    "confidenceLevel" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyObjectiveCheckConfidenceRecord_pkey" PRIMARY KEY ("checkpointId")
);

CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckConfidenceRecord_checkSessionId_idx" ON "DailyObjectiveCheckConfidenceRecord"("checkSessionId");
CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckConfidenceRecord_schoolId_studentId_idx" ON "DailyObjectiveCheckConfidenceRecord"("schoolId", "studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyObjectiveCheckConfidenceRecord_checkSessionId_checkpointType_key" ON "DailyObjectiveCheckConfidenceRecord"("checkSessionId", "checkpointType");

CREATE TABLE IF NOT EXISTS "DailyObjectiveCheckCompletionIdempotencyRecord" (
    "idempotencyKey" TEXT NOT NULL,
    "checkSessionId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "masteryApplied" BOOLEAN NOT NULL DEFAULT false,
    "weakSignalCreated" BOOLEAN NOT NULL DEFAULT false,
    "completionStatus" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyObjectiveCheckCompletionIdempotencyRecord_pkey" PRIMARY KEY ("idempotencyKey")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailyObjectiveCheckCompletionIdempotencyRecord_checkSessionId_key" ON "DailyObjectiveCheckCompletionIdempotencyRecord"("checkSessionId");
CREATE INDEX IF NOT EXISTS "DailyObjectiveCheckCompletionIdempotencyRecord_schoolId_studentId_idx" ON "DailyObjectiveCheckCompletionIdempotencyRecord"("schoolId", "studentId");
