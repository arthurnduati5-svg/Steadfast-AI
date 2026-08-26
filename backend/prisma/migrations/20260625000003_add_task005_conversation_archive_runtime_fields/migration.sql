-- Extend ConversationArchiveRecord for Task 005 runtime fields
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "rawContent" TEXT;
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "redactedContent" TEXT;
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "redactionApplied" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "storagePolicy" TEXT NOT NULL DEFAULT 'retained_raw';
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "sender" TEXT NOT NULL DEFAULT 'learner';
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "sourceSurface" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "safetyTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "topicId" TEXT;
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
ALTER TABLE "ConversationArchiveRecord" ADD COLUMN IF NOT EXISTS "curriculumTrack" TEXT NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS "ConversationArchiveRecord_storagePolicy_idx" ON "ConversationArchiveRecord"("storagePolicy");
CREATE INDEX IF NOT EXISTS "ConversationArchiveRecord_sender_idx" ON "ConversationArchiveRecord"("sender");

-- Extend SafeMemorySummary for Task 005 runtime fields
ALTER TABLE "SafeMemorySummary" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
ALTER TABLE "SafeMemorySummary" ADD COLUMN IF NOT EXISTS "topicId" TEXT;
ALTER TABLE "SafeMemorySummary" ADD COLUMN IF NOT EXISTS "curriculumTrack" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "SafeMemorySummary" ADD COLUMN IF NOT EXISTS "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SafeMemorySummary" ADD COLUMN IF NOT EXISTS "weakAreas" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SafeMemorySummary" ADD COLUMN IF NOT EXISTS "commonMistakes" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "SafeMemorySummary_subjectId_idx" ON "SafeMemorySummary"("subjectId");
CREATE INDEX IF NOT EXISTS "SafeMemorySummary_topicId_idx" ON "SafeMemorySummary"("topicId");
