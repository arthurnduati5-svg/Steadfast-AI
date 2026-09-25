-- STEADFAST-CHAT-BACKEND-DURABILITY-V1
-- One production-safe additive migration:
--   1. extend ChatSession (allocator, lifecycle, lineage) and ChatMessage (origin traceability)
--   2. create the durable logical-turn owner ChatTurn
--   3. repair legacy duplicate/unreliable messageNumber values deterministically
--   4. initialize the allocator + learner turn count
--   5. only then enforce the (sessionId, messageNumber) uniqueness invariant
-- It deletes no messages and no sessions.

-- ── 1. ChatSession extensions ──
ALTER TABLE "ChatSession" ADD COLUMN "nextMessageNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ChatSession" ADD COLUMN "learnerTurnCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ChatSession" ADD COLUMN "parentSessionId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN "rootSessionId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN "lineageType" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN "lineageDepth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ChatSession" ADD COLUMN "branchedFromMessageId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN "lineageRequestId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN "lineageRequestFingerprint" TEXT;

-- ── 2. ChatMessage traceability extension ──
ALTER TABLE "ChatMessage" ADD COLUMN "originMessageId" TEXT;

-- ── 3. ChatTurn: durable logical-turn owner ──
CREATE TABLE "ChatTurn" (
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

CREATE UNIQUE INDEX "ChatTurn_sessionId_clientTurnId_key" ON "ChatTurn"("sessionId", "clientTurnId");
CREATE INDEX "ChatTurn_sessionId_status_idx" ON "ChatTurn"("sessionId", "status");
CREATE INDEX "ChatTurn_assistantMessageId_idx" ON "ChatTurn"("assistantMessageId");

-- ── 4. Deterministic legacy repair: reassign messageNumber 1..N per session ──
-- Ordering is timestamp ASC, id ASC (never the old, possibly duplicated messageNumber).
WITH ordered AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "sessionId"
            ORDER BY "timestamp" ASC, "id" ASC
        ) AS repaired_number
    FROM "ChatMessage"
)
UPDATE "ChatMessage" AS cm
SET "messageNumber" = ordered.repaired_number
FROM ordered
WHERE cm."id" = ordered."id"
  AND cm."messageNumber" <> ordered.repaired_number;

-- ── 5. Initialize the monotonic allocator ──
UPDATE "ChatSession" AS cs
SET "nextMessageNumber" = COALESCE(agg.max_number, 0) + 1
FROM (
    SELECT "sessionId", MAX("messageNumber") AS max_number
    FROM "ChatMessage"
    GROUP BY "sessionId"
) AS agg
WHERE cs."id" = agg."sessionId";

-- Sessions with no messages keep the default of 1.

-- ── 6. Initialize the authoritative learner turn count (user rows only) ──
UPDATE "ChatSession" AS cs
SET "learnerTurnCount" = COALESCE(agg.user_turns, 0)
FROM (
    SELECT "sessionId", COUNT(*) AS user_turns
    FROM "ChatMessage"
    WHERE "role" = 'user'
    GROUP BY "sessionId"
) AS agg
WHERE cs."id" = agg."sessionId";

-- ── 7. Uniqueness enforced only after the repair above ──
CREATE UNIQUE INDEX "ChatMessage_sessionId_messageNumber_key" ON "ChatMessage"("sessionId", "messageNumber");
CREATE INDEX "ChatMessage_sessionId_messageNumber_idx" ON "ChatMessage"("sessionId", "messageNumber");

-- ── 8. Lineage lookups + branch/continue request idempotency ──
-- NULL lineageRequestId rows remain allowed (Postgres UNIQUE treats NULLs as distinct).
CREATE UNIQUE INDEX "ChatSession_parentSessionId_lineageType_lineageRequestId_key"
    ON "ChatSession"("parentSessionId", "lineageType", "lineageRequestId");
CREATE INDEX "ChatSession_parentSessionId_idx" ON "ChatSession"("parentSessionId");
CREATE INDEX "ChatSession_rootSessionId_idx" ON "ChatSession"("rootSessionId");

-- ── 9. ChatTurn → ChatSession cascade relation ──
ALTER TABLE "ChatTurn"
  ADD CONSTRAINT "ChatTurn_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
