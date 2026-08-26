-- R1: Durable Student Learning Session State & Event
-- Add missing fields for authoritative lifecycle state and durable event history

-- StudentLearningSessionState: add stage, objectiveId, sourceTruthStatus, confidenceBucket, stateVersion, endedAt
-- Also change default status from 'active' to 'created', currentMode from 'session_start' to 'none'

ALTER TABLE "StudentLearningSessionState" ADD COLUMN IF NOT EXISTS "stage" TEXT NOT NULL DEFAULT 'orienting';
ALTER TABLE "StudentLearningSessionState" ADD COLUMN IF NOT EXISTS "objectiveId" TEXT;
ALTER TABLE "StudentLearningSessionState" ADD COLUMN IF NOT EXISTS "sourceTruthStatus" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "StudentLearningSessionState" ADD COLUMN IF NOT EXISTS "confidenceBucket" TEXT NOT NULL DEFAULT 'not_enough_evidence';
ALTER TABLE "StudentLearningSessionState" ADD COLUMN IF NOT EXISTS "stateVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "StudentLearningSessionState" ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3);

-- Update defaults for status and currentMode
ALTER TABLE "StudentLearningSessionState" ALTER COLUMN "status" SET DEFAULT 'created';
ALTER TABLE "StudentLearningSessionState" ALTER COLUMN "currentMode" SET DEFAULT 'none';

-- StudentLearningSessionEvent: add studentId, transitionType, previousStatus, resultingStatus, operationVersion, idempotencyKey, requestId, correlationId
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "transitionType" TEXT;
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "previousStatus" TEXT;
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "resultingStatus" TEXT;
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "operationVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "correlationId" TEXT;

-- Add index for idempotencyKey
CREATE INDEX IF NOT EXISTS "StudentLearningSessionEvent_idempotencyKey_idx" ON "StudentLearningSessionEvent"("idempotencyKey");