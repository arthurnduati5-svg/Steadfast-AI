-- Practice Pad PP-08: derived-interpretation authority (additive only).
-- One PracticePadInterpretation row per derived interpretation, bound to
-- (attemptId, documentVersion, sourceBlockId, sourceContentHash).
-- Raw PracticeDocumentRevision rows are NEVER mutated by interpretation.
-- Additive only: no drops, no alters to existing tables. The runtime
-- READS/WRITES this provisioned table; a missing table in production is
-- a persistence failure (fail closed), never CREATE TABLE, never a
-- process-local memory fallback. NOT applied against owner production
-- data by this task. No live model calls. No OCR provider.

CREATE TABLE IF NOT EXISTS "PracticePadInterpretation" (
    "interpretationId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "documentVersion" INTEGER NOT NULL,
    "sourceBlockId" TEXT NOT NULL,
    "sourceContentHash" TEXT NOT NULL,
    "representationClass" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "candidatesJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMATION_REQUIRED',
    "interpreter" TEXT NOT NULL DEFAULT 'backend',
    "interpreterVersion" TEXT NOT NULL DEFAULT 'pp08-1',
    "confirmedCandidateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    CONSTRAINT "PracticePadInterpretation_pkey" PRIMARY KEY ("interpretationId")
);
CREATE INDEX IF NOT EXISTS "PracticePadInterpretation_attempt_version_block_idx" ON "PracticePadInterpretation"("attemptId", "documentVersion", "sourceBlockId");
CREATE INDEX IF NOT EXISTS "PracticePadInterpretation_school_student_idx" ON "PracticePadInterpretation"("schoolId", "studentId");
