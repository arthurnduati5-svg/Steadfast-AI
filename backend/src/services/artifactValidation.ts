// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Request Validation v1
// Uses zod for runtime validation, matching existing patterns.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

// Enum arrays for zod validation
const ARTIFACT_KIND_VALUES = [
  'pdf', 'image', 'worksheet', 'transcript', 'notes', 'document', 'text', 'unknown',
] as const;

const ACCESS_SCOPE_VALUES = [
  'student_private', 'teacher_to_student', 'class_shared', 'school_shared', 'system_public',
] as const;

const PARSER_MODE_VALUES = [
  'safe_text_v1', 'metadata_only', 'existing_content',
] as const;

const QUERY_MODE_VALUES = [
  'help_with_question', 'explain_section', 'quiz_from_artifact', 'summarize', 'find_examples', 'general',
] as const;

// ── Safe v1 bounds ──
const MAX_TITLE_LENGTH = 180;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_TEXT_CONTENT_LENGTH = 250_000;
const MAX_TRANSCRIPT_LENGTH = 250_000;
const MAX_QUERY_LENGTH = 1000;
const MAX_FILENAME_LENGTH = 255;
const MAX_BLOCKS_DEFAULT = 8;
const MAX_BLOCKS_MIN = 1;
const MAX_BLOCKS_MAX = 20;

// ── Validators ──

export const artifactIdSchema = z.string().trim().min(1, 'artifactId is required');

export const artifactIngestRequestSchema = z.object({
  title: z.string().trim().max(MAX_TITLE_LENGTH, `Title must be <= ${MAX_TITLE_LENGTH} characters`).optional(),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH, `Description must be <= ${MAX_DESCRIPTION_LENGTH} characters`).optional(),
  kind: z.enum(ARTIFACT_KIND_VALUES).optional(),
  accessScope: z.enum(ACCESS_SCOPE_VALUES).optional(),
  classId: z.string().trim().nullable().optional(),
  mediaAssetId: z.string().trim().min(1).optional(),
  curriculumRefs: z.record(z.unknown()).optional(),
  textContent: z.string().max(MAX_TEXT_CONTENT_LENGTH, `Text content must be <= ${MAX_TEXT_CONTENT_LENGTH} characters`).optional(),
  transcriptText: z.string().max(MAX_TRANSCRIPT_LENGTH, `Transcript text must be <= ${MAX_TRANSCRIPT_LENGTH} characters`).optional(),
  originalFileName: z.string().trim().max(MAX_FILENAME_LENGTH).optional(),
  mimeType: z.string().trim().max(100).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
}).refine(
  (data) => data.textContent || data.transcriptText || data.originalFileName || data.title,
  { message: 'At least one of textContent, transcriptText, originalFileName, or title must be provided.' }
);

export const artifactParseRequestSchema = z.object({
  forceReparse: z.boolean().optional(),
  parserMode: z.enum(PARSER_MODE_VALUES).optional(),
  mediaAssetId: z.string().trim().min(1).optional(),
  curriculumRefs: z.record(z.unknown()).optional(),
  textContent: z.string().max(MAX_TEXT_CONTENT_LENGTH, `Text content must be <= ${MAX_TEXT_CONTENT_LENGTH} characters`).optional(),
  transcriptText: z.string().max(MAX_TRANSCRIPT_LENGTH, `Transcript text must be <= ${MAX_TRANSCRIPT_LENGTH} characters`).optional(),
});

export const artifactQueryRequestSchema = z.object({
  query: z.string().trim().min(1, 'Query is required').max(MAX_QUERY_LENGTH, `Query must be <= ${MAX_QUERY_LENGTH} characters`),
  mode: z.enum(QUERY_MODE_VALUES).optional(),
  questionRef: z.string().trim().nullable().optional(),
  maxBlocks: z.number().int().min(MAX_BLOCKS_MIN).max(MAX_BLOCKS_MAX).optional().default(MAX_BLOCKS_DEFAULT),
  includeAnswerKeys: z.boolean().optional(),
});

// ── Inferred types ──
export type ArtifactIngestRequestValidated = z.infer<typeof artifactIngestRequestSchema>;
export type ArtifactParseRequestValidated = z.infer<typeof artifactParseRequestSchema>;
export type ArtifactQueryRequestValidated = z.infer<typeof artifactQueryRequestSchema>;
