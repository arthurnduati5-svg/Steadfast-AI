-- STDF-REAL-CHAT-BACKEND-INTEGRATION-024
-- Durable conversation contract: tenant clocks, projection, title versioning,
-- turn ledger, transcript paging indexes. Additive only; preserves all data.
-- Uses IF NOT EXISTS / DO blocks so it is safe on DBs that already applied
-- 20260925120000_chat_durability_v1 (ChatTurn table + allocator columns).

-- ── 1. ChatSession durable columns ──
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP(3);
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "lastOpenedAt" TIMESTAMP(3);
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "latestVisibleMessagePreview" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "messageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "titleVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "activeTurnId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "nextMessageNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "learnerTurnCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "parentSessionId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "rootSessionId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "lineageType" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "lineageDepth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "branchedFromMessageId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "lineageRequestId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "lineageRequestFingerprint" TEXT;

-- ── 2. ChatMessage durable columns ──
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "turnId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "originMessageId" TEXT;

-- ── 3. ChatTurn table (if an older migration did not create it) ──
CREATE TABLE IF NOT EXISTS "ChatTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clientTurnId" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "userMessageId" TEXT,
    "assistantMessageId" TEXT,
    "assistantMessageNumber" INTEGER,
    "activeAttemptId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "checkpoint" JSONB,
    "checkpointKind" TEXT,
    "errorCode" TEXT,
    "invalidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatTurn_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChatTurn_sessionId_fkey') THEN
    ALTER TABLE "ChatTurn" ADD CONSTRAINT "ChatTurn_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "ChatTurn_sessionId_clientTurnId_key" ON "ChatTurn"("sessionId", "clientTurnId");
CREATE INDEX IF NOT EXISTS "ChatTurn_sessionId_status_idx" ON "ChatTurn"("sessionId", "status");
CREATE INDEX IF NOT EXISTS "ChatTurn_assistantMessageId_idx" ON "ChatTurn"("assistantMessageId");

-- ── 4. Turn ledger: durable idempotency authority (never a process-local Map) ──
CREATE TABLE IF NOT EXISTS "ChatTurnRequestRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "schoolId" TEXT,
    "studentId" TEXT NOT NULL,
    "clientTurnId" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "userMessageId" TEXT,
    "assistantMessageId" TEXT,
    "responseMetadata" JSONB,
    "leaseExpiresAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "ChatTurnRequestRecord_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChatTurnRequestRecord_sessionId_fkey') THEN
    ALTER TABLE "ChatTurnRequestRecord" ADD CONSTRAINT "ChatTurnRequestRecord_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "ChatTurnRequestRecord_sessionId_clientTurnId_key" ON "ChatTurnRequestRecord"("sessionId", "clientTurnId");
CREATE INDEX IF NOT EXISTS "ChatTurnRequestRecord_sessionId_status_idx" ON "ChatTurnRequestRecord"("sessionId", "status");

-- ── 5. Backfill projections from canonical history (no fake data) ──
UPDATE "ChatSession" AS cs
SET "messageCount" = COALESCE(agg.cnt, 0)
FROM (SELECT "sessionId", COUNT(*) AS cnt FROM "ChatMessage" GROUP BY "sessionId") AS agg
WHERE cs."id" = agg."sessionId" AND cs."messageCount" = 0;

UPDATE "ChatSession" AS cs
SET "lastMessageAt" = agg.mx
FROM (SELECT "sessionId", MAX("timestamp") AS mx FROM "ChatMessage" GROUP BY "sessionId") AS agg
WHERE cs."id" = agg."sessionId" AND cs."lastMessageAt" IS NULL;

UPDATE "ChatSession" AS cs
SET "titleVersion" = 0 WHERE cs."titleVersion" IS NULL;

-- ── 6. Indexes for cursor history + transcript paging + tenant isolation ──
CREATE INDEX IF NOT EXISTS "ChatSession_school_student_lastMessage_idx"
  ON "ChatSession"("schoolId", "studentId", "lastMessageAt" DESC);
CREATE INDEX IF NOT EXISTS "ChatSession_school_student_lastOpened_idx"
  ON "ChatSession"("schoolId", "studentId", "lastOpenedAt" DESC);
CREATE INDEX IF NOT EXISTS "ChatMessage_session_turn_idx" ON "ChatMessage"("sessionId", "turnId");
-- Unique transcript ordering enforced only when no duplicates remain.
DO $$ BEGIN
  CREATE UNIQUE INDEX "ChatMessage_sessionId_messageNumber_key" ON "ChatMessage"("sessionId", "messageNumber");
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN unique_violation THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_messageNumber_idx" ON "ChatMessage"("sessionId", "messageNumber");
