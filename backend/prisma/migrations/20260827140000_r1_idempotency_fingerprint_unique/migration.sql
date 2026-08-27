-- R1: Add requestFingerprint field and unique constraint for idempotency key

-- Add requestFingerprint column to StudentLearningSessionEvent
ALTER TABLE "StudentLearningSessionEvent" ADD COLUMN IF NOT EXISTS "requestFingerprint" TEXT;

-- Add unique constraint for idempotency key within school/learner scope
CREATE UNIQUE INDEX IF NOT EXISTS "StudentLearningSessionEvent_schoolId_tutorLearnerId_idempotencyKey_key" 
ON "StudentLearningSessionEvent"("schoolId", "tutorLearnerId", "idempotencyKey") 
WHERE "idempotencyKey" IS NOT NULL;