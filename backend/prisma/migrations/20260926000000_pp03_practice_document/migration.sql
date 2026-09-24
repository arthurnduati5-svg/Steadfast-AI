-- Practice Pad PP-03: versioned PracticeDocument authority (additive only).
-- One PracticePadDocument per PracticeAttempt; immutable
-- PracticePadDocumentRevision rows keyed by (attemptId, version).
-- PracticePadWorkVersion REMAINS the canonical monotonic head; the PP-03
-- runtime reads it and advances it, never replaces it.
-- UNIQUE(attemptId, version) plus the conditional head update give the
-- §9 concurrency law: two writers can never claim the same next version.
-- Additive only: no drops, no alters to existing tables. The runtime
-- READS/WRITES these provisioned tables; a missing table in production is
-- a persistence failure (fail closed), never CREATE TABLE, never a
-- process-local memory fallback. NOT applied against owner production
-- data by this task.

CREATE TABLE IF NOT EXISTS "PracticePadDocument" (
    "documentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticePadDocument_pkey" PRIMARY KEY ("documentId")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PracticePadDocument_attemptId_key" ON "PracticePadDocument"("attemptId");
CREATE INDEX IF NOT EXISTS "PracticePadDocument_schoolId_studentId_idx" ON "PracticePadDocument"("schoolId", "studentId");

CREATE TABLE IF NOT EXISTS "PracticePadDocumentRevision" (
    "revisionId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "clientSubmissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticePadDocumentRevision_pkey" PRIMARY KEY ("revisionId")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PracticePadDocumentRevision_attempt_version_uidx" ON "PracticePadDocumentRevision"("attemptId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "PracticePadDocumentRevision_attempt_submission_uidx" ON "PracticePadDocumentRevision"("attemptId", "clientSubmissionId");
CREATE INDEX IF NOT EXISTS "PracticePadDocumentRevision_attemptId_idx" ON "PracticePadDocumentRevision"("attemptId");
CREATE INDEX IF NOT EXISTS "PracticePadDocumentRevision_documentId_idx" ON "PracticePadDocumentRevision"("documentId");
CREATE INDEX IF NOT EXISTS "PracticePadDocumentRevision_schoolId_studentId_idx" ON "PracticePadDocumentRevision"("schoolId", "studentId");
