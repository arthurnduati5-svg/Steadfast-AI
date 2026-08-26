-- AlterTable: Add session continuity fields to TutorSession

ALTER TABLE "TutorSession" ADD COLUMN IF NOT EXISTS "sessionPurpose" TEXT NOT NULL DEFAULT 'copilot_default';
ALTER TABLE "TutorSession" ADD COLUMN IF NOT EXISTS "lastActiveSchoolPage" TEXT;
ALTER TABLE "TutorSession" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex for active default session lookup
CREATE INDEX IF NOT EXISTS "TutorSession_tutorLearnerId_schoolId_sessionPurpose_status_idx" ON "TutorSession"("tutorLearnerId", "schoolId", "sessionPurpose", "status");
