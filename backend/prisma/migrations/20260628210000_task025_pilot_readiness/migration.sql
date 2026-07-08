-- Create PilotProgram table for Task 025 controlled school pilot readiness
CREATE TABLE "PilotProgram" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pilotMode" TEXT NOT NULL DEFAULT 'controlled',
    "scopeSummarySafe" TEXT NOT NULL,
    "allowedSubjects" JSONB NOT NULL DEFAULT '[]',
    "allowedYearGroups" JSONB NOT NULL DEFAULT '[]',
    "allowedCurriculumTracks" JSONB NOT NULL DEFAULT '[]',
    "allowedRoles" JSONB NOT NULL DEFAULT '[]',
    "maxStudents" INTEGER NOT NULL DEFAULT 50,
    "maxTeachers" INTEGER NOT NULL DEFAULT 10,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdByRole" TEXT NOT NULL DEFAULT 'admin',
    "createdByActorIdHash" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
    "approvedByRole" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rollbackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "killSwitchEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotProgram_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PilotProgram_schoolId_idx" ON "PilotProgram"("schoolId");
CREATE INDEX "PilotProgram_schoolId_status_idx" ON "PilotProgram"("schoolId", "status");
CREATE INDEX "PilotProgram_status_idx" ON "PilotProgram"("status");

-- Create PilotCohort table
CREATE TABLE "PilotCohort" (
    "id" TEXT NOT NULL,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "teacherCount" INTEGER NOT NULL DEFAULT 0,
    "allowedClassIds" JSONB NOT NULL DEFAULT '[]',
    "allowedSubjectIds" JSONB NOT NULL DEFAULT '[]',
    "allowedCurriculumScopes" JSONB NOT NULL DEFAULT '[]',
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotCohort_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PilotCohort_pilotProgramId_fkey" FOREIGN KEY ("pilotProgramId") REFERENCES "PilotProgram"("id") ON DELETE CASCADE
);

CREATE INDEX "PilotCohort_pilotProgramId_idx" ON "PilotCohort"("pilotProgramId");
CREATE INDEX "PilotCohort_schoolId_idx" ON "PilotCohort"("schoolId");
CREATE INDEX "PilotCohort_status_idx" ON "PilotCohort"("status");

-- Create PilotParticipant table
CREATE TABLE "PilotParticipant" (
    "id" TEXT NOT NULL,
    "pilotProgramId" TEXT NOT NULL,
    "cohortId" TEXT,
    "schoolId" TEXT NOT NULL,
    "actorIdHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "eligibilityStatus" TEXT NOT NULL DEFAULT 'pending_review',
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "joinedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotParticipant_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PilotParticipant_pilotProgramId_fkey" FOREIGN KEY ("pilotProgramId") REFERENCES "PilotProgram"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "PilotParticipant_pilotProgramId_actorIdHash_key" ON "PilotParticipant"("pilotProgramId", "actorIdHash");
CREATE INDEX "PilotParticipant_pilotProgramId_idx" ON "PilotParticipant"("pilotProgramId");
CREATE INDEX "PilotParticipant_cohortId_idx" ON "PilotParticipant"("cohortId");
CREATE INDEX "PilotParticipant_schoolId_idx" ON "PilotParticipant"("schoolId");
CREATE INDEX "PilotParticipant_eligibilityStatus_idx" ON "PilotParticipant"("eligibilityStatus");

-- Create PilotReadinessCheck table
CREATE TABLE "PilotReadinessCheck" (
    "id" TEXT NOT NULL,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_run',
    "safeSummary" TEXT NOT NULL,
    "blockingIssues" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotReadinessCheck_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PilotReadinessCheck_pilotProgramId_fkey" FOREIGN KEY ("pilotProgramId") REFERENCES "PilotProgram"("id") ON DELETE CASCADE
);

CREATE INDEX "PilotReadinessCheck_pilotProgramId_idx" ON "PilotReadinessCheck"("pilotProgramId");
CREATE INDEX "PilotReadinessCheck_schoolId_idx" ON "PilotReadinessCheck"("schoolId");
CREATE INDEX "PilotReadinessCheck_checkType_idx" ON "PilotReadinessCheck"("checkType");
CREATE INDEX "PilotReadinessCheck_status_idx" ON "PilotReadinessCheck"("status");

-- Create PilotDryRun table
CREATE TABLE "PilotDryRun" (
    "id" TEXT NOT NULL,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scenarioName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "checksPassed" JSONB NOT NULL DEFAULT '[]',
    "checksFailed" JSONB NOT NULL DEFAULT '[]',
    "safeSummary" TEXT NOT NULL,
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotDryRun_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PilotDryRun_pilotProgramId_fkey" FOREIGN KEY ("pilotProgramId") REFERENCES "PilotProgram"("id") ON DELETE CASCADE
);

CREATE INDEX "PilotDryRun_pilotProgramId_idx" ON "PilotDryRun"("pilotProgramId");
CREATE INDEX "PilotDryRun_schoolId_idx" ON "PilotDryRun"("schoolId");
CREATE INDEX "PilotDryRun_status_idx" ON "PilotDryRun"("status");

-- Create PilotAuditRecord table
CREATE TABLE "PilotAuditRecord" (
    "id" TEXT NOT NULL,
    "pilotProgramId" TEXT,
    "schoolId" TEXT,
    "actorRole" TEXT NOT NULL DEFAULT 'unknown',
    "actorIdHash" TEXT,
    "action" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "requestId" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PilotAuditRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PilotAuditRecord_pilotProgramId_fkey" FOREIGN KEY ("pilotProgramId") REFERENCES "PilotProgram"("id") ON DELETE SET NULL
);

CREATE INDEX "PilotAuditRecord_pilotProgramId_idx" ON "PilotAuditRecord"("pilotProgramId");
CREATE INDEX "PilotAuditRecord_schoolId_idx" ON "PilotAuditRecord"("schoolId");
CREATE INDEX "PilotAuditRecord_action_idx" ON "PilotAuditRecord"("action");
CREATE INDEX "PilotAuditRecord_createdAt_idx" ON "PilotAuditRecord"("createdAt");
