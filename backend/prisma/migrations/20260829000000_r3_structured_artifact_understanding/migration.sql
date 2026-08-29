-- R3 — Structured Artifact Understanding
-- Additive migration: anchor LearningArtifact to MediaAsset and add an
-- explicit block visibility classification plus structured-count columns.
-- No existing columns or tables are removed or renamed.

ALTER TABLE "LearningArtifact" ADD COLUMN "media_asset_id" TEXT;
ALTER TABLE "LearningArtifact" ADD COLUMN "table_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LearningArtifact" ADD COLUMN "transcript_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LearningArtifact" ADD COLUMN "curriculum_refs" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "LearningArtifact_media_asset_id_idx" ON "LearningArtifact"("media_asset_id");

ALTER TABLE "LearningArtifactBlock" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'student';

CREATE INDEX "LearningArtifactBlock_visibility_idx" ON "LearningArtifactBlock"("visibility");
