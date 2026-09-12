// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Session Runtime Validation
// Uses Zod schemas to validate all video learning session
// request bodies.  Bounded fields.  Spoofed identity blocked.
// Raw transcript fields forbidden.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

const videoProviderSchema = z.string().trim().max(60).optional().nullable();
const videoIdSchema = z.string().trim().max(120);
const titleSchema = z.string().trim().min(1, 'Title cannot be empty').max(200);
const boundedString = (max: number) => z.string().trim().min(1, 'Cannot be empty').max(max);
const boundedStringNullable = (max: number) => z.string().trim().max(max).nullable().optional();
const urlSchema = z.string().url().max(2048).nullable().optional();
const boundedArray = (itemSchema: z.ZodType<string>, maxItems: number) =>
  z.array(itemSchema).max(maxItems).optional().default([]);

// ── Forbidden field names ──
// These fields must never appear in request bodies.
// We check them with a refinement instead of z.never(),
// because z.never() makes the field required in Zod.
const FORBIDDEN_FIELD_NAMES = [
  'schoolId',
  'studentId',
  'teacherId',
  'rawTranscript',
  'rawFullTranscript',
  'fullDescription',
  'rawMetadata',
] as const;

/**
 * Add a refinement to a schema that rejects forbidden fields.
 */
function rejectForbiddenFields<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  // Use passthrough so Zod doesn't strip unknown keys before the refinement
  return schema.passthrough().superRefine((data, ctx) => {
    for (const key of FORBIDDEN_FIELD_NAMES) {
      if ((data as any)[key] !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must not be provided in request body. Resolved from auth only.`,
          path: [key],
        });
      }
    }
  });
}

// ── Safety sub-schema ──
const safetySchema = z.object({
  sourceTrustStatus: boundedStringNullable(60),
  ageSuitabilityStatus: boundedStringNullable(60),
  islamicAppropriatenessStatus: boundedStringNullable(60),
  languageSuitabilityStatus: boundedStringNullable(60),
  needsTeacherReview: z.boolean().optional().default(false),
  warnings: z.array(boundedString(240)).max(10).optional().default([]),
}).optional();

// ── Select Video Learning Session ──
export const selectVideoLearningSessionRequestSchema = rejectForbiddenFields(z.object({
  sessionId: boundedStringNullable(256),
  recommendationId: boundedStringNullable(120),
  provider: z.string().trim().max(60).nullable().optional(),
  providerVideoId: boundedStringNullable(120),
  canonicalUrl: urlSchema,
  title: titleSchema,
  channelTitle: boundedStringNullable(120),
  thumbnailUrl: boundedStringNullable(2048),
  durationSeconds: z.number().int().positive().nullable().optional(),
  subject: boundedStringNullable(120),
  topic: boundedStringNullable(160),
  skillIds: boundedArray(boundedString(80), 20),
  activeArtifactIds: boundedArray(boundedString(80), 20),
  recommendationReasons: z.array(boundedString(240)).max(10).optional().default([]),
  recommendationWarnings: z.array(boundedString(240)).max(10).optional().default([]),
  safety: safetySchema,
}));

// ── Update Progress ──
export const updateVideoLearningProgressRequestSchema = rejectForbiddenFields(z.object({
  sessionVideoId: videoIdSchema,
  watchedSeconds: z.number().int().nonnegative().nullable().optional(),
  watchedPercent: z.number().min(0).max(100).nullable().optional(),
  lastKnownPositionSeconds: z.number().int().nonnegative().nullable().optional(),
  source: z.enum([
    'learner_selected', 'chat_recommendation', 'watch_progress',
    'learner_reported', 'checkpoint_answer', 'system_inferred', 'teacher_marked',
  ]).optional().default('watch_progress'),
}));

// ── Create Checkpoint ──
export const createVideoLearningCheckpointRequestSchema = rejectForbiddenFields(z.object({
  sessionVideoId: videoIdSchema,
  videoTimestampSeconds: z.number().int().nonnegative().nullable().optional(),
  topic: boundedStringNullable(160),
  prompt: boundedString(500),
  expectedAnswerSummary: boundedStringNullable(800),
}));

// ── Answer Checkpoint ──
export const answerVideoLearningCheckpointRequestSchema = rejectForbiddenFields(z.object({
  sessionVideoId: videoIdSchema,
  checkpointId: boundedString(120),
  learnerAnswerSummary: boundedString(1200).min(1, 'learnerAnswerSummary cannot be empty'),
}));

// ── Complete Session ──
export const completeVideoLearningSessionRequestSchema = rejectForbiddenFields(z.object({
  sessionVideoId: videoIdSchema,
  watchedSeconds: z.number().int().nonnegative().nullable().optional(),
  watchedPercent: z.number().min(0).max(100).nullable().optional(),
  completionReason: boundedStringNullable(500),
}));

// ── Pause Session ──
export const pauseVideoLearningSessionRequestSchema = rejectForbiddenFields(z.object({
  sessionVideoId: videoIdSchema,
}));

// ── Abandon Session ──
export const abandonVideoLearningSessionRequestSchema = rejectForbiddenFields(z.object({
  sessionVideoId: videoIdSchema,
}));

// ── Clear Session ──
export const clearVideoLearningSessionRequestSchema = rejectForbiddenFields(z.object({
  sessionVideoId: boundedStringNullable(120),
}));

// ── Active / History query ──
export const getActiveVideoLearningSessionQuerySchema = z.object({
  sessionId: boundedStringNullable(256),
});

export const getVideoLearningSessionHistoryQuerySchema = z.object({
  sessionId: boundedStringNullable(256),
  maxResults: z.coerce.number().int().min(1).max(20).optional().default(5),
});

// ── Inferred types for internal use ──
export type SelectVideoLearningSessionRequestValidated = z.infer<typeof selectVideoLearningSessionRequestSchema>;
export type UpdateVideoLearningProgressRequestValidated = z.infer<typeof updateVideoLearningProgressRequestSchema>;
export type CreateVideoLearningCheckpointRequestValidated = z.infer<typeof createVideoLearningCheckpointRequestSchema>;
export type AnswerVideoLearningCheckpointRequestValidated = z.infer<typeof answerVideoLearningCheckpointRequestSchema>;
export type CompleteVideoLearningSessionRequestValidated = z.infer<typeof completeVideoLearningSessionRequestSchema>;
export type PauseVideoLearningSessionRequestValidated = z.infer<typeof pauseVideoLearningSessionRequestSchema>;
export type AbandonVideoLearningSessionRequestValidated = z.infer<typeof abandonVideoLearningSessionRequestSchema>;
export type ClearVideoLearningSessionRequestValidated = z.infer<typeof clearVideoLearningSessionRequestSchema>;
