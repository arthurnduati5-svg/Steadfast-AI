-- CreateTable: TutorLearnerIdentityMap
CREATE TABLE "TutorLearnerIdentityMap" (
    "id" TEXT NOT NULL,
    "tutorLearnerId" TEXT NOT NULL,
    "externalUserId" TEXT,
    "externalStudentId" TEXT NOT NULL,
    "externalTeacherId" TEXT,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT,
    "grade" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "status" TEXT NOT NULL DEFAULT 'active',
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TutorLearnerIdentityMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorLearnerIdentityMap_tutorLearnerId_key" ON "TutorLearnerIdentityMap"("tutorLearnerId");
CREATE UNIQUE INDEX "TutorLearnerIdentityMap_externalStudentId_schoolId_key" ON "TutorLearnerIdentityMap"("externalStudentId", "schoolId");
CREATE INDEX "TutorLearnerIdentityMap_schoolId_idx" ON "TutorLearnerIdentityMap"("schoolId");
CREATE INDEX "TutorLearnerIdentityMap_externalUserId_idx" ON "TutorLearnerIdentityMap"("externalUserId");
CREATE INDEX "TutorLearnerIdentityMap_classId_idx" ON "TutorLearnerIdentityMap"("classId");

-- CreateTable: TutorSession
CREATE TABLE "TutorSession" (
    "id" TEXT NOT NULL,
    "tutorLearnerId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "externalStudentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sessionPurpose" TEXT NOT NULL DEFAULT 'copilot_default',
    "displayMode" TEXT,
    "lastActiveSchoolPage" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TutorSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TutorSession_tutorLearnerId_status_idx" ON "TutorSession"("tutorLearnerId", "status");
CREATE INDEX "TutorSession_tutorLearnerId_schoolId_sessionPurpose_status_idx" ON "TutorSession"("tutorLearnerId", "schoolId", "sessionPurpose", "status");
CREATE INDEX "TutorSession_schoolId_idx" ON "TutorSession"("schoolId");

-- CreateTable: DurableAuditEvent
CREATE TABLE "DurableAuditEvent" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorIdHash" TEXT,
    "studentIdHash" TEXT,
    "schoolIdHash" TEXT,
    "classIdHash" TEXT,
    "requestId" TEXT,
    "traceId" TEXT,
    "route" TEXT,
    "method" TEXT,
    "serviceName" TEXT,
    "operation" TEXT,
    "safeSummary" TEXT NOT NULL,
    "safeMetadataJson" JSONB,
    "redactionJson" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "persistedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DurableAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DurableAuditEvent_category_occurredAt_idx" ON "DurableAuditEvent"("category", "occurredAt");
CREATE INDEX "DurableAuditEvent_visibility_occurredAt_idx" ON "DurableAuditEvent"("visibility", "occurredAt");
CREATE INDEX "DurableAuditEvent_requestId_idx" ON "DurableAuditEvent"("requestId");
CREATE INDEX "DurableAuditEvent_traceId_idx" ON "DurableAuditEvent"("traceId");
CREATE INDEX "DurableAuditEvent_schoolIdHash_occurredAt_idx" ON "DurableAuditEvent"("schoolIdHash", "occurredAt");
CREATE INDEX "DurableAuditEvent_studentIdHash_occurredAt_idx" ON "DurableAuditEvent"("studentIdHash", "occurredAt");

-- CreateTable: ConversationArchiveRecord
CREATE TABLE "ConversationArchiveRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tutorLearnerId" TEXT NOT NULL,
    "externalStudentId" TEXT,
    "sessionId" TEXT,
    "archiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "visibilityTier" TEXT NOT NULL DEFAULT 'system_only',
    "redactionStatus" TEXT NOT NULL DEFAULT 'not_redacted',
    "summary" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "subjectTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "firstMessageAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "tokenCount" INTEGER,
    "metadata" JSONB,
    "rawContent" TEXT,
    "redactedContent" TEXT,
    "redactionApplied" BOOLEAN NOT NULL DEFAULT false,
    "storagePolicy" TEXT NOT NULL DEFAULT 'retained_raw',
    "sender" TEXT NOT NULL DEFAULT 'learner',
    "sourceSurface" TEXT NOT NULL DEFAULT 'unknown',
    "safetyTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topicId" TEXT,
    "subjectId" TEXT,
    "curriculumTrack" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConversationArchiveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationArchiveRecord_schoolId_tutorLearnerId_idx" ON "ConversationArchiveRecord"("schoolId", "tutorLearnerId");
CREATE INDEX "ConversationArchiveRecord_retentionUntil_idx" ON "ConversationArchiveRecord"("retentionUntil");
CREATE INDEX "ConversationArchiveRecord_visibilityTier_idx" ON "ConversationArchiveRecord"("visibilityTier");
CREATE INDEX "ConversationArchiveRecord_schoolId_archiveDate_idx" ON "ConversationArchiveRecord"("schoolId", "archiveDate");
CREATE INDEX "ConversationArchiveRecord_tutorLearnerId_archiveDate_idx" ON "ConversationArchiveRecord"("tutorLearnerId", "archiveDate");
CREATE INDEX "ConversationArchiveRecord_storagePolicy_idx" ON "ConversationArchiveRecord"("storagePolicy");
CREATE INDEX "ConversationArchiveRecord_sender_idx" ON "ConversationArchiveRecord"("sender");

-- CreateTable: SafeMemorySummary
CREATE TABLE "SafeMemorySummary" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tutorLearnerId" TEXT NOT NULL,
    "externalStudentId" TEXT,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL DEFAULT 0.3,
    "observationCount" INTEGER NOT NULL DEFAULT 1,
    "sourceArchiveIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "firstObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "subjectId" TEXT,
    "topicId" TEXT,
    "curriculumTrack" TEXT NOT NULL DEFAULT 'unknown',
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weakAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commonMistakes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SafeMemorySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SafeMemorySummary_schoolId_tutorLearnerId_idx" ON "SafeMemorySummary"("schoolId", "tutorLearnerId");
CREATE INDEX "SafeMemorySummary_expiresAt_idx" ON "SafeMemorySummary"("expiresAt");
CREATE INDEX "SafeMemorySummary_kind_idx" ON "SafeMemorySummary"("kind");
CREATE INDEX "SafeMemorySummary_schoolId_kind_idx" ON "SafeMemorySummary"("schoolId", "kind");
CREATE INDEX "SafeMemorySummary_subjectId_idx" ON "SafeMemorySummary"("subjectId");
CREATE INDEX "SafeMemorySummary_topicId_idx" ON "SafeMemorySummary"("topicId");