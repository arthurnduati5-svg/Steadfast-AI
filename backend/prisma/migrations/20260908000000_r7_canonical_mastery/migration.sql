-- R7.1 durable canonical mastery repository.
-- Creates only the three canonical mastery records. SkillMasterySnapshot untouched.

CREATE TABLE "CanonicalMasteryStateRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "targetNodeType" TEXT NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "probabilityOfMastery" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "lastEvidenceAt" TIMESTAMP(3),
    "decayRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "misconceptionTags" JSONB NOT NULL DEFAULT '[]',
    "independenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hintDependencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transferScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibleLabel" TEXT NOT NULL DEFAULT 'not_started',
    "policyVersion" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "strategyVersion" TEXT NOT NULL,
    "stateRevision" INTEGER NOT NULL DEFAULT 1,
    "consecutiveMissCountSinceMastered" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalMasteryStateRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CanonicalMasteryStateRecord_identity_key" ON "CanonicalMasteryStateRecord"("schoolId", "learnerId", "targetNodeId", "targetNodeType", "curriculumVersionId");
CREATE INDEX "CanonicalMasteryStateRecord_school_learner_idx" ON "CanonicalMasteryStateRecord"("schoolId", "learnerId");
CREATE INDEX "CanonicalMasteryStateRecord_school_learner_target_idx" ON "CanonicalMasteryStateRecord"("schoolId", "learnerId", "targetNodeId");

CREATE TABLE "CanonicalMasteryEvidenceApplicationRecord" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "targetNodeType" TEXT NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalMasteryEvidenceApplicationRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CanonicalMasteryEvidenceApplicationRecord_evidenceId_key" ON "CanonicalMasteryEvidenceApplicationRecord"("evidenceId");
CREATE INDEX "CanonicalMasteryEvidenceApplicationRecord_school_learner_idx" ON "CanonicalMasteryEvidenceApplicationRecord"("schoolId", "learnerId");

CREATE TABLE "CanonicalMasteryChangeRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "targetNodeType" TEXT NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB NOT NULL,
    "contributingEvidenceIds" JSONB NOT NULL DEFAULT '[]',
    "policyVersion" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "strategyVersion" TEXT NOT NULL DEFAULT '',
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalMasteryChangeRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CanonicalMasteryChangeRecord_school_learner_target_idx" ON "CanonicalMasteryChangeRecord"("schoolId", "learnerId", "targetNodeId");
