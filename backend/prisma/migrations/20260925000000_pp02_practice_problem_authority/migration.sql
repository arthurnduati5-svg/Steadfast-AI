-- Practice Pad PP-02: durable PracticeProblem authority (additive only).
-- Mirrors schema.prisma: PracticeProblem, plus exact attempt binding columns
-- on PracticeAttempt (problemId, problemVersion).
--
-- Ownership: the governed question bank keeps owning source questions
-- (referenced via sourceType/sourceRef, never duplicated here);
-- PracticeProblem owns the exact issued practice problem/version used by
-- Practice Pad; PracticeAttempt binds (problemId, problemVersion).
--
-- Additive only: no drops, no alters to existing tables beyond new nullable
-- columns. The runtime READS/WRITES the provisioned PracticeProblem table
-- through raw SQL; a missing table in production is a persistence failure
-- (fail closed), never CREATE TABLE, never a process-local memory fallback.
-- NOT applied against owner production data by this task. Real-DB roundtrip
-- stays UNVERIFIED until the isolated test-DB proof runs.

CREATE TABLE IF NOT EXISTS "PracticeProblem" (
    "problemId" TEXT NOT NULL,
    "problemVersion" INTEGER NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "sourceVersion" TEXT,
    "subject" TEXT,
    "topic" TEXT,
    "subtopic" TEXT,
    "gradeBand" TEXT,
    "prompt" TEXT NOT NULL,
    "allowedResources" JSONB NOT NULL DEFAULT '[]',
    "curriculumVersionId" TEXT,
    "curriculumObjectiveId" TEXT,
    "curriculumSkillId" TEXT,
    "evaluationType" TEXT NOT NULL,
    "evaluationPlan" TEXT,
    "expectedAnswer" TEXT,
    "acceptableAnswerForms" JSONB NOT NULL DEFAULT '[]',
    "validationStatus" TEXT NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    CONSTRAINT "PracticeProblem_pkey" PRIMARY KEY ("problemId", "problemVersion")
);
CREATE INDEX IF NOT EXISTS "PracticeProblem_schoolId_idx" ON "PracticeProblem"("schoolId");
CREATE INDEX IF NOT EXISTS "PracticeProblem_schoolId_validationStatus_idx" ON "PracticeProblem"("schoolId", "validationStatus");

ALTER TABLE "PracticeAttempt" ADD COLUMN IF NOT EXISTS "problemId" TEXT;
ALTER TABLE "PracticeAttempt" ADD COLUMN IF NOT EXISTS "problemVersion" INTEGER;
