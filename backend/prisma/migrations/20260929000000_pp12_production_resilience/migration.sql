-- Practice Pad PP-12: production resilience seal (additive only).
--
-- 1. PracticeCanonicalIdempotency: provisioned durable idempotency receipt
--    for practiceCanonicalLearningService. Request-path runtime
--    CREATE TABLE / CREATE INDEX is REMOVED in PP-12; migration owns
--    schema, runtime assumes provisioned schema, missing schema fails
--    closed. Mirrors the previously runtime-provisioned shape exactly.
-- 2. PracticePadIntegrityObservation attempt/seq uniqueness: PostgreSQL
--    authority backing the PP-09 cross-replica serverSeq allocator. Two
--    concurrent writers can never hold the same (attemptId, serverSeq);
--    the loser retries under the same DB authority.
-- 3. PracticePadProjectionReceipt: durable PP-10 downstream projection
--    recovery state (memory / revision / Growth PENDING|SUCCEEDED|FAILED).
--    Canonical evidence commit precedes projection effects; committed
--    evidence is never rolled back for a projection failure; retry never
--    repeats a SUCCEEDED projection; concurrent reconcilers claim via
--    PostgreSQL (claimedBy/claimedAt lease), never a process mutex.
-- Additive only: no drops, no alters to existing tables. NOT applied
-- against owner production data by this task; isolated test DBs only.

CREATE TABLE IF NOT EXISTS "PracticeCanonicalIdempotency" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "committedEvidenceId" TEXT,
    "masteryApplied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeCanonicalIdempotency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PracticeCanonicalIdempotency_school_learner_hash_uidx" ON "PracticeCanonicalIdempotency"("schoolId", "learnerId", "requestHash");
CREATE INDEX IF NOT EXISTS "PracticeCanonicalIdempotency_attemptId_idx" ON "PracticeCanonicalIdempotency"("attemptId");

-- Backfill-compatible uniqueness for cross-replica sequence safety.
-- If legacy duplicate (attemptId, serverSeq) rows existed, this index
-- fails loudly at deploy time instead of silently permitting duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS "PracticePadIntegrityObservation_attempt_seq_uidx" ON "PracticePadIntegrityObservation"("attemptId", "serverSeq");

CREATE TABLE IF NOT EXISTS "PracticePadProjectionReceipt" (
    "receiptKey" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "committedEvidenceId" TEXT,
    "candidateJson" TEXT NOT NULL DEFAULT '{}',
    "memoryState" TEXT NOT NULL DEFAULT 'PENDING',
    "revisionState" TEXT NOT NULL DEFAULT 'PENDING',
    "growthState" TEXT NOT NULL DEFAULT 'PENDING',
    "lastErrorJson" TEXT,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticePadProjectionReceipt_pkey" PRIMARY KEY ("receiptKey")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PracticePadProjectionReceipt_committedEvidenceId_uidx" ON "PracticePadProjectionReceipt"("committedEvidenceId");
CREATE INDEX IF NOT EXISTS "PracticePadProjectionReceipt_attemptId_idx" ON "PracticePadProjectionReceipt"("attemptId");
CREATE INDEX IF NOT EXISTS "PracticePadProjectionReceipt_schoolId_studentId_idx" ON "PracticePadProjectionReceipt"("schoolId", "studentId");
