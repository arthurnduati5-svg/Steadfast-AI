-- CreateTable
CREATE TABLE "GrowthWeakTopicState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "weaknessScore" DOUBLE PRECISION NOT NULL,
    "microMasteryLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "weaknessReasonSummary" TEXT NOT NULL,
    "triggers" JSONB,
    "lastStruggledAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "linkedRevisionIds" JSONB,
    "linkedMediaIds" JSONB,
    "linkedMistakePatternIds" JSONB,
    "recommendedAction" TEXT NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthWeakTopicState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthMistakePatternState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "patternKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "examples" JSONB,
    "recurrenceScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "commonContext" TEXT NOT NULL,
    "fixReminder" TEXT NOT NULL,
    "linkedTopics" JSONB,
    "linkedRevisionIds" JSONB,
    "lastSeenAt" TIMESTAMP(3),
    "lastImprovedAt" TIMESTAMP(3),
    "snapshotDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthMistakePatternState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthMasteryTrendState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "trendStatus" TEXT NOT NULL,
    "microMasteryLabel" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceScore" DOUBLE PRECISION NOT NULL,
    "trendSummary" TEXT NOT NULL,
    "delta" DOUBLE PRECISION,
    "lastSeenAt" TIMESTAMP(3),
    "snapshotDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthMasteryTrendState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthRecommendationState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "sourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "primaryAction" JSONB NOT NULL,
    "secondaryAction" JSONB,
    "linkedTopic" TEXT,
    "linkedRevisionId" TEXT,
    "linkedMediaId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "snapshotDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrowthRecommendationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrowthWeakTopicState_userId_subject_topic_snapshotDate_key" ON "GrowthWeakTopicState"("userId", "subject", "topic", "snapshotDate");

-- CreateIndex
CREATE INDEX "GrowthWeakTopicState_userId_snapshotDate_idx" ON "GrowthWeakTopicState"("userId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "GrowthWeakTopicState_userId_status_snapshotDate_idx" ON "GrowthWeakTopicState"("userId", "status", "snapshotDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GrowthMistakePatternState_userId_patternKey_snapshotDate_key" ON "GrowthMistakePatternState"("userId", "patternKey", "snapshotDate");

-- CreateIndex
CREATE INDEX "GrowthMistakePatternState_userId_snapshotDate_idx" ON "GrowthMistakePatternState"("userId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "GrowthMistakePatternState_userId_status_snapshotDate_idx" ON "GrowthMistakePatternState"("userId", "status", "snapshotDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GrowthMasteryTrendState_userId_subject_topic_snapshotDate_key" ON "GrowthMasteryTrendState"("userId", "subject", "topic", "snapshotDate");

-- CreateIndex
CREATE INDEX "GrowthMasteryTrendState_userId_snapshotDate_idx" ON "GrowthMasteryTrendState"("userId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "GrowthMasteryTrendState_userId_trendStatus_snapshotDate_idx" ON "GrowthMasteryTrendState"("userId", "trendStatus", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "GrowthRecommendationState_userId_snapshotDate_idx" ON "GrowthRecommendationState"("userId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "GrowthRecommendationState_userId_recommendationType_snapshotDate_idx" ON "GrowthRecommendationState"("userId", "recommendationType", "snapshotDate" DESC);
