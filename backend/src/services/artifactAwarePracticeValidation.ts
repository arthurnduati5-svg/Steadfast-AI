// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Validation v1
// Validates all request inputs with bounded fields and strict
// rejection of spoofed identity, raw artifact text, raw answer
// keys, hidden prompts, and oversized inputs.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

// ── Constants ──

const MAX_ARTIFACT_PRACTICE_SESSION_ID = 120;
const MAX_ARTIFACT_IDS = 20;
const MAX_PRIMARY_ARTIFACT_ID = 120;
const MAX_SOURCE_ID = 160;
const MAX_PRACTICE_ITEM_ID = 120;
const MAX_SESSION_ID = 120;
const MAX_TOPIC = 160;
const MAX_SUBJECT = 120;
const MAX_LEARNER_ANSWER = 1200;
const MAX_PREFERRED_TYPES = 7;
const MAX_SKILL_IDS = 20;
const MAX_REQUESTED_ITEMS = 5;
const MIN_REQUESTED_ITEMS = 1;

// ── Forbidden field patterns ──

const SPOOFED_IDENTITY_PATTERN = /schoolId|studentId|teacherId/i;
const RAW_ARTIFACT_PATTERN = /rawArtifactText|rawFullArtifactText|rawOcrText|fullText|rawText/i;
const RAW_ANSWER_KEY_PATTERN = /answerKey|rawAnswerKey|markingSchemeRaw/i;
const RAW_METADATA_PATTERN = /rawMetadata/i;
const HIDDEN_PROMPT_PATTERN = /hiddenPrompt|systemPrompt|developerPrompt/i;

// ── Helper schemas ──

const artifactAwarePracticeItemTypeSchema = z.enum([
  'recall', 'concept_check', 'worked_example_completion', 'error_spotting',
  'application', 'diagram_interpretation', 'formula_use', 'theorem_application',
  'question_from_artifact', 'teach_back', 'reflection',
]);

const artifactSourceKindSchema = z.enum([
  'extracted_question', 'diagram', 'theorem_block', 'formula_block',
  'worked_example', 'section', 'learning_objective', 'answer_key_summary',
  'teacher_note', 'artifact_summary',
]);

const difficultySchema = z.enum(['easy', 'medium', 'hard', 'adaptive']);

// ── Generate Request ──

export const generateArtifactAwarePracticeRequestSchema = z.object({
  sessionId: z.string().max(MAX_SESSION_ID).optional().nullable(),
  artifactIds: z.array(z.string().max(MAX_PRIMARY_ARTIFACT_ID)).max(MAX_ARTIFACT_IDS).optional(),
  primaryArtifactId: z.string().max(MAX_PRIMARY_ARTIFACT_ID).optional().nullable(),
  sourceKind: artifactSourceKindSchema.optional().nullable(),
  sourceId: z.string().max(MAX_SOURCE_ID).optional().nullable(),
  requestedItemCount: z.number().int().min(MIN_REQUESTED_ITEMS).max(MAX_REQUESTED_ITEMS).default(3).optional(),
  preferredTypes: z.array(artifactAwarePracticeItemTypeSchema)
    .max(MAX_PREFERRED_TYPES)
    .optional(),
  difficulty: difficultySchema.optional().default('adaptive'),
  includeLearnerMemory: z.boolean().optional().default(false),
  includeMasteryContext: z.boolean().optional().default(false),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity (schoolId/studentId/teacherId) not allowed in body.',
  })
  .refine((data) => !RAW_ARTIFACT_PATTERN.test(JSON.stringify(data)), {
    message: 'Raw artifact text fields not allowed.',
  })
  .refine((data) => !RAW_ANSWER_KEY_PATTERN.test(JSON.stringify(data)), {
    message: 'Raw answer key fields not allowed.',
  })
  .refine((data) => !RAW_METADATA_PATTERN.test(JSON.stringify(data)), {
    message: 'Raw metadata fields not allowed.',
  })
  .refine((data) => !HIDDEN_PROMPT_PATTERN.test(JSON.stringify(data)), {
    message: 'Hidden prompt/system/developer prompt fields not allowed.',
  });

export type GenerateArtifactAwarePracticeRequestValidated = z.infer<typeof generateArtifactAwarePracticeRequestSchema>;

// ── Answer Request ──

export const answerArtifactAwarePracticeRequestSchema = z.object({
  artifactPracticeSessionId: z.string().max(MAX_ARTIFACT_PRACTICE_SESSION_ID),
  practiceItemId: z.string().max(MAX_PRACTICE_ITEM_ID),
  learnerAnswerSummary: z.string().min(1, 'Answer is required.').max(MAX_LEARNER_ANSWER),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  })
  .refine((data) => !RAW_ARTIFACT_PATTERN.test(JSON.stringify(data)), {
    message: 'Raw artifact text fields not allowed.',
  })
  .refine((data) => !RAW_ANSWER_KEY_PATTERN.test(JSON.stringify(data)), {
    message: 'Raw answer key fields not allowed.',
  })
  .refine((data) => !HIDDEN_PROMPT_PATTERN.test(JSON.stringify(data)), {
    message: 'Hidden prompt fields not allowed.',
  });

export type AnswerArtifactAwarePracticeRequestValidated = z.infer<typeof answerArtifactAwarePracticeRequestSchema>;

// ── Review Request ──

export const reviewArtifactAwarePracticeRequestSchema = z.object({
  artifactPracticeSessionId: z.string().max(MAX_ARTIFACT_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type ReviewArtifactAwarePracticeRequestValidated = z.infer<typeof reviewArtifactAwarePracticeRequestSchema>;

// ── Next Request ──

export const nextArtifactAwarePracticeRequestSchema = z.object({
  artifactPracticeSessionId: z.string().max(MAX_ARTIFACT_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type NextArtifactAwarePracticeRequestValidated = z.infer<typeof nextArtifactAwarePracticeRequestSchema>;

// ── Schedule Request ──

export const scheduleArtifactAwarePracticeRequestSchema = z.object({
  artifactPracticeSessionId: z.string().max(MAX_ARTIFACT_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type ScheduleArtifactAwarePracticeRequestValidated = z.infer<typeof scheduleArtifactAwarePracticeRequestSchema>;

// ── Complete Request ──

export const completeArtifactAwarePracticeRequestSchema = z.object({
  artifactPracticeSessionId: z.string().max(MAX_ARTIFACT_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type CompleteArtifactAwarePracticeRequestValidated = z.infer<typeof completeArtifactAwarePracticeRequestSchema>;

// ── Abandon Request ──

export const abandonArtifactAwarePracticeRequestSchema = z.object({
  artifactPracticeSessionId: z.string().max(MAX_ARTIFACT_PRACTICE_SESSION_ID),
}).strict()
  .refine((data) => !SPOOFED_IDENTITY_PATTERN.test(JSON.stringify(data)), {
    message: 'Spoofed identity not allowed in body.',
  });

export type AbandonArtifactAwarePracticeRequestValidated = z.infer<typeof abandonArtifactAwarePracticeRequestSchema>;

// ── Session Query ──

export const getArtifactAwarePracticeSessionQuerySchema = z.object({
  artifactPracticeSessionId: z.string().max(MAX_ARTIFACT_PRACTICE_SESSION_ID).optional(),
}).strict();

export type GetArtifactAwarePracticeSessionQueryValidated = z.infer<typeof getArtifactAwarePracticeSessionQuerySchema>;

// ── History Query ──

export const getArtifactAwarePracticeHistoryQuerySchema = z.object({
  maxResults: z.coerce.number().int().min(1).max(20).optional().default(5),
}).strict();

export type GetArtifactAwarePracticeHistoryQueryValidated = z.infer<typeof getArtifactAwarePracticeHistoryQuerySchema>;
