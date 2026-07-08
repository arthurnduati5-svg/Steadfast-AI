-- Task 028: Controlled Expansion Execution
-- Creates all tables for expansion execution persistence

CREATE TABLE "ExpansionExecutionRun" (
    "id" TEXT NOT NULL,
    "expansionProposalId" TEXT NOT NULL,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "approvedDecisionRef" TEXT,
    "task027ReportRef" TEXT,
    "safeSummary" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "startedByRole" TEXT,
    "startedByActorIdHash" TEXT,
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "stagePlan" JSONB NOT NULL DEFAULT '{}',
    "approvedScopeSnapshot" JSONB NOT NULL DEFAULT '{}',
    "blockingIssues" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpansionExecutionRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionExecutionStage" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT NOT NULL,
    "expansionProposalId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "plannedStudentCount" INTEGER NOT NULL DEFAULT 0,
    "plannedTeacherCount" INTEGER NOT NULL DEFAULT 0,
    "activatedStudentCount" INTEGER NOT NULL DEFAULT 0,
    "activatedTeacherCount" INTEGER NOT NULL DEFAULT 0,
    "allowedClassIds" JSONB NOT NULL DEFAULT '[]',
    "allowedSubjectIds" JSONB NOT NULL DEFAULT '[]',
    "allowedCurriculumScopes" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "safeSummary" TEXT NOT NULL,
    "blockingIssues" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpansionExecutionStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpandedPilotParticipant" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT NOT NULL,
    "stageId" TEXT,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "actorIdHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "classId" TEXT,
    "subjectIds" JSONB NOT NULL DEFAULT '[]',
    "curriculumScopes" JSONB NOT NULL DEFAULT '[]',
    "activationStatus" TEXT NOT NULL DEFAULT 'pending',
    "activationReasonCodes" JSONB NOT NULL DEFAULT '[]',
    "joinedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpandedPilotParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionRuntimeEvent" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT NOT NULL,
    "stageId" TEXT,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorIdHash" TEXT,
    "eventType" TEXT NOT NULL,
    "eventStatus" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "requestId" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpansionRuntimeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionHealthSnapshot" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT NOT NULL,
    "stageId" TEXT,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "activeExpandedSessions" INTEGER NOT NULL DEFAULT 0,
    "allowedExpandedSessionStarts" INTEGER NOT NULL DEFAULT 0,
    "blockedExpandedSessionStarts" INTEGER NOT NULL DEFAULT 0,
    "schoolAuthBlocks" INTEGER NOT NULL DEFAULT 0,
    "cohortScopeBlocks" INTEGER NOT NULL DEFAULT 0,
    "curriculumGateBlocks" INTEGER NOT NULL DEFAULT 0,
    "socraticGateBlocks" INTEGER NOT NULL DEFAULT 0,
    "deenGateBlocks" INTEGER NOT NULL DEFAULT 0,
    "privacyGateBlocks" INTEGER NOT NULL DEFAULT 0,
    "aiCallBlocks" INTEGER NOT NULL DEFAULT 0,
    "memoryAccessBlocks" INTEGER NOT NULL DEFAULT 0,
    "evidenceWriteBlocks" INTEGER NOT NULL DEFAULT 0,
    "feedbackCount" INTEGER NOT NULL DEFAULT 0,
    "oversightItemCount" INTEGER NOT NULL DEFAULT 0,
    "interventionCount" INTEGER NOT NULL DEFAULT 0,
    "incidentBridgeCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "p95LatencyMs" INTEGER,
    "safeSummary" TEXT NOT NULL,
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpansionHealthSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionOversightItem" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT NOT NULL,
    "stageId" TEXT,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "source" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "assignedRole" TEXT,
    "requiresTeacherReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresAdminReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresPrivacyReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresDeenReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresSocraticReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresCurriculumReview" BOOLEAN NOT NULL DEFAULT false,
    "requiresPause" BOOLEAN NOT NULL DEFAULT false,
    "requiresRollback" BOOLEAN NOT NULL DEFAULT false,
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpansionOversightItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionInterventionRecord" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT NOT NULL,
    "stageId" TEXT,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "actorRole" TEXT NOT NULL,
    "actorIdHash" TEXT,
    "safeSummary" TEXT NOT NULL,
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "beforeSnapshot" JSONB NOT NULL DEFAULT '{}',
    "afterSnapshot" JSONB NOT NULL DEFAULT '{}',
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpansionInterventionRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionRollbackRecord" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT NOT NULL,
    "stageId" TEXT,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "rollbackStatus" TEXT NOT NULL DEFAULT 'pending',
    "rollbackReason" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "previousScopeSnapshot" JSONB NOT NULL DEFAULT '{}',
    "restoredScopeSnapshot" JSONB NOT NULL DEFAULT '{}',
    "affectedParticipantCount" INTEGER NOT NULL DEFAULT 0,
    "dataDeleted" BOOLEAN NOT NULL DEFAULT false,
    "auditPreserved" BOOLEAN NOT NULL DEFAULT true,
    "metadataSafeJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpansionRollbackRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionCompletionReview" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT NOT NULL,
    "pilotProgramId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "safeSummary" TEXT NOT NULL,
    "learningQualitySummary" JSONB NOT NULL DEFAULT '{}',
    "safetySummary" JSONB NOT NULL DEFAULT '{}',
    "privacySummary" JSONB NOT NULL DEFAULT '{}',
    "deenSummary" JSONB NOT NULL DEFAULT '{}',
    "socraticSummary" JSONB NOT NULL DEFAULT '{}',
    "curriculumSummary" JSONB NOT NULL DEFAULT '{}',
    "operationsSummary" JSONB NOT NULL DEFAULT '{}',
    "teacherAdminSummary" JSONB NOT NULL DEFAULT '{}',
    "rollbackSummary" JSONB NOT NULL DEFAULT '{}',
    "recommendedDecision" TEXT NOT NULL DEFAULT 'continue_controlled_expansion',
    "safeToStartNextTask" BOOLEAN NOT NULL DEFAULT false,
    "blockingIssues" JSONB NOT NULL DEFAULT '[]',
    "knownLimitations" JSONB NOT NULL DEFAULT '[]',
    "artifactPaths" JSONB NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpansionCompletionReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionExecutionReport" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT,
    "schoolId" TEXT,
    "taskId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "safeToStartNextTask" BOOLEAN NOT NULL DEFAULT false,
    "safeSummary" TEXT NOT NULL,
    "executionSummary" JSONB NOT NULL DEFAULT '{}',
    "stageSummary" JSONB NOT NULL DEFAULT '{}',
    "runtimeGateSummary" JSONB NOT NULL DEFAULT '{}',
    "monitoringSummary" JSONB NOT NULL DEFAULT '{}',
    "oversightSummary" JSONB NOT NULL DEFAULT '{}',
    "rollbackSummary" JSONB NOT NULL DEFAULT '{}',
    "completionReviewSummary" JSONB NOT NULL DEFAULT '{}',
    "blockingIssues" JSONB NOT NULL DEFAULT '[]',
    "knownLimitations" JSONB NOT NULL DEFAULT '[]',
    "verificationSummary" JSONB NOT NULL DEFAULT '{}',
    "artifactPaths" JSONB NOT NULL DEFAULT '[]',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpansionExecutionReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpansionExecutionAuditRecord" (
    "id" TEXT NOT NULL,
    "executionRunId" TEXT,
    "stageId" TEXT,
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

    CONSTRAINT "ExpansionExecutionAuditRecord_pkey" PRIMARY KEY ("id")
);

-- Indexes for ExpansionExecutionRun
CREATE INDEX "ExpansionExecutionRun_expansionProposalId_idx" ON "ExpansionExecutionRun"("expansionProposalId");
CREATE INDEX "ExpansionExecutionRun_pilotProgramId_idx" ON "ExpansionExecutionRun"("pilotProgramId");
CREATE INDEX "ExpansionExecutionRun_schoolId_idx" ON "ExpansionExecutionRun"("schoolId");
CREATE INDEX "ExpansionExecutionRun_status_idx" ON "ExpansionExecutionRun"("status");

-- Indexes for ExpansionExecutionStage
CREATE INDEX "ExpansionExecutionStage_executionRunId_idx" ON "ExpansionExecutionStage"("executionRunId");
CREATE INDEX "ExpansionExecutionStage_status_idx" ON "ExpansionExecutionStage"("status");

-- Indexes for ExpandedPilotParticipant
CREATE INDEX "ExpandedPilotParticipant_executionRunId_idx" ON "ExpandedPilotParticipant"("executionRunId");
CREATE INDEX "ExpandedPilotParticipant_actorIdHash_idx" ON "ExpandedPilotParticipant"("actorIdHash");
CREATE INDEX "ExpandedPilotParticipant_activationStatus_idx" ON "ExpandedPilotParticipant"("activationStatus");

-- Indexes for ExpansionRuntimeEvent
CREATE INDEX "ExpansionRuntimeEvent_executionRunId_idx" ON "ExpansionRuntimeEvent"("executionRunId");
CREATE INDEX "ExpansionRuntimeEvent_eventType_idx" ON "ExpansionRuntimeEvent"("eventType");

-- Indexes for ExpansionHealthSnapshot
CREATE INDEX "ExpansionHealthSnapshot_executionRunId_idx" ON "ExpansionHealthSnapshot"("executionRunId");

-- Indexes for ExpansionOversightItem
CREATE INDEX "ExpansionOversightItem_executionRunId_idx" ON "ExpansionOversightItem"("executionRunId");
CREATE INDEX "ExpansionOversightItem_severity_idx" ON "ExpansionOversightItem"("severity");
CREATE INDEX "ExpansionOversightItem_status_idx" ON "ExpansionOversightItem"("status");

-- Indexes for ExpansionInterventionRecord
CREATE INDEX "ExpansionInterventionRecord_executionRunId_idx" ON "ExpansionInterventionRecord"("executionRunId");

-- Indexes for ExpansionRollbackRecord
CREATE INDEX "ExpansionRollbackRecord_executionRunId_idx" ON "ExpansionRollbackRecord"("executionRunId");

-- Indexes for ExpansionCompletionReview
CREATE INDEX "ExpansionCompletionReview_executionRunId_idx" ON "ExpansionCompletionReview"("executionRunId");

-- Indexes for ExpansionExecutionReport
CREATE INDEX "ExpansionExecutionReport_taskId_idx" ON "ExpansionExecutionReport"("taskId");

-- Indexes for ExpansionExecutionAuditRecord
CREATE INDEX "ExpansionExecutionAuditRecord_executionRunId_idx" ON "ExpansionExecutionAuditRecord"("executionRunId");
CREATE INDEX "ExpansionExecutionAuditRecord_createdAt_idx" ON "ExpansionExecutionAuditRecord"("createdAt");

-- Foreign keys for ExpansionExecutionStage
ALTER TABLE "ExpansionExecutionStage" ADD CONSTRAINT "ExpansionExecutionStage_executionRunId_fkey" FOREIGN KEY ("executionRunId") REFERENCES "ExpansionExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for ExpandedPilotParticipant
ALTER TABLE "ExpandedPilotParticipant" ADD CONSTRAINT "ExpandedPilotParticipant_executionRunId_fkey" FOREIGN KEY ("executionRunId") REFERENCES "ExpansionExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for ExpansionRuntimeEvent
ALTER TABLE "ExpansionRuntimeEvent" ADD CONSTRAINT "ExpansionRuntimeEvent_executionRunId_fkey" FOREIGN KEY ("executionRunId") REFERENCES "ExpansionExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for ExpansionHealthSnapshot
ALTER TABLE "ExpansionHealthSnapshot" ADD CONSTRAINT "ExpansionHealthSnapshot_executionRunId_fkey" FOREIGN KEY ("executionRunId") REFERENCES "ExpansionExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for ExpansionOversightItem
ALTER TABLE "ExpansionOversightItem" ADD CONSTRAINT "ExpansionOversightItem_executionRunId_fkey" FOREIGN KEY ("executionRunId") REFERENCES "ExpansionExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for ExpansionInterventionRecord
ALTER TABLE "ExpansionInterventionRecord" ADD CONSTRAINT "ExpansionInterventionRecord_executionRunId_fkey" FOREIGN KEY ("executionRunId") REFERENCES "ExpansionExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for ExpansionRollbackRecord
ALTER TABLE "ExpansionRollbackRecord" ADD CONSTRAINT "ExpansionRollbackRecord_executionRunId_fkey" FOREIGN KEY ("executionRunId") REFERENCES "ExpansionExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
