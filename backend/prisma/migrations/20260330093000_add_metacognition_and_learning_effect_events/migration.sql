-- CreateTable
CREATE TABLE "MetacognitiveEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "revisionItemId" TEXT,
    "sourceMessageId" TEXT,
    "eventType" TEXT NOT NULL,
    "confidence" TEXT,
    "problemFraming" TEXT,
    "errorType" TEXT,
    "strategyPreference" TEXT,
    "transferReadiness" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetacognitiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEffectEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "subject" TEXT,
    "topic" TEXT,
    "revisionItemId" TEXT,
    "messageId" TEXT,
    "eventType" TEXT NOT NULL,
    "outcome" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEffectEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetacognitiveEvent_userId_createdAt_idx" ON "MetacognitiveEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MetacognitiveEvent_sessionId_createdAt_idx" ON "MetacognitiveEvent"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MetacognitiveEvent_revisionItemId_createdAt_idx" ON "MetacognitiveEvent"("revisionItemId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MetacognitiveEvent_sourceMessageId_createdAt_idx" ON "MetacognitiveEvent"("sourceMessageId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LearningEffectEvent_userId_createdAt_idx" ON "LearningEffectEvent"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LearningEffectEvent_userId_eventType_idx" ON "LearningEffectEvent"("userId", "eventType");

-- CreateIndex
CREATE INDEX "LearningEffectEvent_sessionId_createdAt_idx" ON "LearningEffectEvent"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LearningEffectEvent_revisionItemId_createdAt_idx" ON "LearningEffectEvent"("revisionItemId", "createdAt" DESC);
