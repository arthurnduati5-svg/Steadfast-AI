// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Practice Validation v1
// Validates all request inputs with bounded fields and
// strict rejection of spoofed identity, raw transcripts,
// hidden prompts, and oversized inputs.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

// ── Constants ──

const MAX_VIDEO_PRACTICE_SESSION_ID = 120;
const MAX_SESSION_VIDEO_ID = 120;
const MAX_PRACTICE_ITEM_ID = 120;
const MAX_TOPIC = 160;
const MAX_SUBJECT = 120;
const MAX_LEARNER_ANSWER = 1200;
const MAX_PREFERRED_TYPES = 5;
const MAX_SKILL_IDS = 20;

// ── Forbidden field patterns ──

const SPOOFED_IDENTITY_PATTERN = /schoolId|studentId|teacherId/i;
const RAW_TRANSCRIPT_PATTERN = /rawTranscript|rawFullTranscript|fullTranscript/i;
const RAW_METADATA_PATTERN = /rawMetadata/i;
const HIDDEN_PROMPT_PATTERN = /hiddenPrompt|systemPrompt|developerPrompt/i;

// ── Helper schemas ──

const videoAwarePracticeItemTypeSchema = z.enum([
  'recall', 'worked_example', 'concept_check', 'error_spotting',
  'application', 'teach_back', 'reflection',
]);

const difficultySchema = z.enum(['easy', 'medium', 'hard', 'adaptive']);

// ── Generate Request ──

export const generateVideoAwarePracticeRequestSchema = z.object({
  sessionId: z.string().max(120).optional().nullable(),
  sessionVideoId: z.string().max(MAX_SESSION_VIDEO_ID).optional().nullable(),
  requestedItemCount: z.number().int().min(1).max(5).default(3).optional(),
  preferredTypes: z.array(videoAwarePracticeItemTypeSchema)
    .max(MAX_PREFERRED_TYPES)
    .optional(),
  difficulty: difficultySchema.optional().default('adaptive'),
  includeArtifactContext: z.boolean().optional().default(false),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity (schoolId/studentId/teacherId) not allowed in body.',
  })
  .refine((data) => !RAW_TRANSCRIPT_PATTERN.test(JSON.stringify(data)), {
    message: 'Raw transcript fields not allowed.',
  })
  .refine((data) => !RAW_METADATA_PATTERN.test(JSON.stringify(data)), {
    message: 'Raw metadata fields not allowed.',
  })
  .refine((data) => !HIDDEN_PROMPT_PATTERN.test(JSON.stringify(data)), {
    message: 'Hidden prompt/system/developer prompt fields not allowed.',
  });

export type GenerateVideoAwarePracticeRequestValidated = z.infer<typeof generateVideoAwarePracticeRequestSchema>;

// ── Answer Request ──

export const answerVideoAwarePracticeRequestSchema = z.object({
  videoPracticeSessionId: z.string().max(MAX_VIDEO_PRACTICE_SESSION_ID),
  practiceItemId: z.string().max(MAX_PRACTICE_ITEM_ID),
  learnerAnswerSummary: z.string().min(1, 'Answer is required.').max(MAX_LEARNER_ANSWER),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  })
  .refine((data) => !RAW_TRANSCRIPT_PATTERN.test(JSON.stringify(data)), {
    message: 'Raw transcript fields not allowed.',
  })
  .refine((data) => !HIDDEN_PROMPT_PATTERN.test(JSON.stringify(data)), {
    message: 'Hidden prompt fields not allowed.',
  });

export type AnswerVideoAwarePracticeRequestValidated = z.infer<typeof answerVideoAwarePracticeRequestSchema>;

// ── Review Request ──

export const reviewVideoAwarePracticeRequestSchema = z.object({
  videoPracticeSessionId: z.string().max(MAX_VIDEO_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type ReviewVideoAwarePracticeRequestValidated = z.infer<typeof reviewVideoAwarePracticeRequestSchema>;

// ── Next Request ──

export const nextVideoAwarePracticeRequestSchema = z.object({
  videoPracticeSessionId: z.string().max(MAX_VIDEO_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type NextVideoAwarePracticeRequestValidated = z.infer<typeof nextVideoAwarePracticeRequestSchema>;

// ── Schedule Request ──

export const scheduleVideoAwarePracticeRequestSchema = z.object({
  videoPracticeSessionId: z.string().max(MAX_VIDEO_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type ScheduleVideoAwarePracticeRequestValidated = z.infer<typeof scheduleVideoAwarePracticeRequestSchema>;

// ── Complete Request ──

export const completeVideoAwarePracticeRequestSchema = z.object({
  videoPracticeSessionId: z.string().max(MAX_VIDEO_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type CompleteVideoAwarePracticeRequestValidated = z.infer<typeof completeVideoAwarePracticeRequestSchema>;

// ── Abandon Request ──

export const abandonVideoAwarePracticeRequestSchema = z.object({
  videoPracticeSessionId: z.string().max(MAX_VIDEO_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type AbandonVideoAwarePracticeRequestValidated = z.infer<typeof abandonVideoAwarePracticeRequestSchema>;

// ── Session Query ──

export const getVideoAwarePracticeSessionQuerySchema = z.object({
  videoPracticeSessionId: z.string().max(MAX_VIDEO_PRACTICE_SESSION_ID).optional(),
}).strict();

export type GetVideoAwarePracticeSessionQueryValidated = z.infer<typeof getVideoAwarePracticeSessionQuerySchema>;

// ── History Query ──

export const getVideoAwarePracticeHistoryQuerySchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(20).optional().default(5),
}).strict();

export type GetVideoAwarePracticeHistoryQueryValidated = z.infer<typeof getVideoAwarePracticeHistoryQuerySchema>;
