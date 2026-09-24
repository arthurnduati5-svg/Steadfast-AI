-- Practice Pad PP-09: integrity-evidence durability (additive only).
-- Mirrors schema.prisma: PracticePadIntegrityObservation,
-- PracticePadIntegrityEvidence. One observation row per eventId; one
-- evidence row per (attemptId, idempotencyKey) scope. Observations are
-- bounded privacy-safe session facts only (no URLs, no tab content, no
-- surveillance payloads); evidence is non-accusatory concern plus a
-- learning-safe next evidence action. Additive only: no drops, no alters
-- to existing tables. The runtime READS/WRITES these provisioned tables;
-- a missing table in production is a persistence failure (fail closed),
-- never CREATE TABLE, never a process-local memory fallback. NOT applied
-- against owner production data by this task. Real database execution
-- remains UNVERIFIED in this task (no PostgreSQL provisioned).

CREATE TABLE IF NOT EXISTS "PracticePadIntegrityObservation" (
    "eventId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "clientObservedAt" TEXT,
    "serverReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serverSeq" INTEGER NOT NULL,
    "outOfOrder" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticePadIntegrityObservation_pkey" PRIMARY KEY ("eventId")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PracticePadIntegrityObservation_attempt_event_uidx" ON "PracticePadIntegrityObservation"("attemptId", "eventId");
CREATE INDEX IF NOT EXISTS "PracticePadIntegrityObservation_attemptId_idx" ON "PracticePadIntegrityObservation"("attemptId");
CREATE INDEX IF NOT EXISTS "PracticePadIntegrityObservation_schoolId_studentId_idx" ON "PracticePadIntegrityObservation"("schoolId", "studentId");

CREATE TABLE IF NOT EXISTS "PracticePadIntegrityEvidence" (
    "scopeHash" TEXT NOT NULL,
    "integrityEvidenceId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "basedOnAttemptVersion" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "observationWindow" TEXT NOT NULL DEFAULT '{}',
    "concernLevel" TEXT NOT NULL,
    "signalsJson" TEXT NOT NULL DEFAULT '[]',
    "counterSignalsJson" TEXT NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL,
    "recommendedNextEvidenceAction" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "resultJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticePadIntegrityEvidence_pkey" PRIMARY KEY ("scopeHash")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PracticePadIntegrityEvidence_attempt_key_uidx" ON "PracticePadIntegrityEvidence"("attemptId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "PracticePadIntegrityEvidence_attemptId_idx" ON "PracticePadIntegrityEvidence"("attemptId");
CREATE INDEX IF NOT EXISTS "PracticePadIntegrityEvidence_schoolId_studentId_idx" ON "PracticePadIntegrityEvidence"("schoolId", "studentId");
