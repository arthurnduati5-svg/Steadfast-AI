-- Practice Pad PP-01: durable check + work-version authority (additive only).
-- Mirrors schema.prisma: PracticePadWorkVersion, PracticePadCheck.
-- Reuses the exact already-implemented raw-table field/index semantics:
-- one authoritative work-version row per attemptId (monotonic, never
-- backwards), and one PracticePadCheck row per
-- (attemptId, basedOnVersion, idempotencyKey) idempotency scope.
-- Additive only: no drops, no alters to existing tables. The runtime
-- READS/WRITES these provisioned tables; a missing table in production is
-- a persistence failure (fail closed), never CREATE TABLE, never a
-- process-local memory fallback. NOT applied against owner production
-- data by this task.

CREATE TABLE IF NOT EXISTS "PracticePadWorkVersion" (
    "attemptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticePadWorkVersion_pkey" PRIMARY KEY ("attemptId")
);

CREATE TABLE IF NOT EXISTS "PracticePadCheck" (
    "scopeHash" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "basedOnVersion" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "evaluationMode" TEXT NOT NULL,
    "evidenceEligible" BOOLEAN NOT NULL DEFAULT false,
    "resultJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticePadCheck_pkey" PRIMARY KEY ("scopeHash")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PracticePadCheck_attempt_version_key_uidx" ON "PracticePadCheck"("attemptId", "basedOnVersion", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "PracticePadCheck_attemptId_idx" ON "PracticePadCheck"("attemptId");
CREATE INDEX IF NOT EXISTS "PracticePadCheck_schoolId_studentId_idx" ON "PracticePadCheck"("schoolId", "studentId");
