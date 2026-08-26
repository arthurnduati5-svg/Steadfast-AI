-- CreateTable: StudentLearningSessionState (original Task 016 version)
CREATE TABLE "StudentLearningSessionState" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tutorLearnerId" TEXT NOT NULL,
    "studentId" TEXT,
    "externalStudentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentMode" TEXT NOT NULL DEFAULT 'session_start',
    "previousMode" TEXT,
    "subject" TEXT,
    "topic" TEXT,
    "skillTag" TEXT,
    "activeChallengeId" TEXT,
    "activeRemediationPathId" TEXT,
    "activeRevisionItemId" TEXT,
    "supportLevel" TEXT,
    "difficultyLevel" TEXT,
    "safeProgressSummary" TEXT,
    "safeEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "privacyMetadata" JSONB NOT NULL DEFAULT '{}',
    "lastTransitionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentLearningSessionState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentLearningSessionState_schoolId_tutorLearnerId_idx" ON "StudentLearningSessionState"("schoolId", "tutorLearnerId");
CREATE INDEX "StudentLearningSessionState_schoolId_tutorLearnerId_status_idx" ON "StudentLearningSessionState"("schoolId", "tutorLearnerId", "status");
CREATE INDEX "StudentLearningSessionState_tutorLearnerId_status_idx" ON "StudentLearningSessionState"("tutorLearnerId", "status");

-- CreateTable: StudentLearningSessionEvent (original Task 016 version)
CREATE TABLE "StudentLearningSessionEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tutorLearnerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousMode" TEXT,
    "nextMode" TEXT,
    "subject" TEXT,
    "topic" TEXT,
    "skillTag" TEXT,
    "safeEventSummary" TEXT,
    "safeEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "privacyMetadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentLearningSessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentLearningSessionEvent_schoolId_tutorLearnerId_idx" ON "StudentLearningSessionEvent"("schoolId", "tutorLearnerId");
CREATE INDEX "StudentLearningSessionEvent_schoolId_tutorLearnerId_sessionId_idx" ON "StudentLearningSessionEvent"("schoolId", "tutorLearnerId", "sessionId");
CREATE INDEX "StudentLearningSessionEvent_sessionId_createdAt_idx" ON "StudentLearningSessionEvent"("sessionId", "createdAt");