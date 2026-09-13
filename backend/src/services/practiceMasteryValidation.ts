// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice and Mastery Scaffolding Runtime Validation
// Uses Zod schemas to validate all practice/mastery request bodies.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

// ── Practice Attempt Kind Schema ──
export const practiceAttemptKindSchema = z.enum([
  'open_response',
  'multiple_choice',
  'short_answer',
  'worked_solution',
  'teach_back',
  'artifact_question',
  'review_prompt',
  'diagnostic',
]);

// ── Practice Outcome Schema ──
export const practiceOutcomeSchema = z.enum([
  'correct',
  'partially_correct',
  'incorrect',
  'unclear',
  'not_evaluated',
]);

// ── Mastery Level Schema ──
export const masteryLevelSchema = z.enum([
  'not_started',
  'emerging',
  'developing',
  'proficient',
  'strong',
  'needs_review',
]);

// ── Mastery Status Schema ──
export const masteryStatusSchema = z.enum([
  'active',
  'needs_review',
  'stale',
  'superseded',
  'soft_deleted',
]);

// ── Recommendation Action Schema ──
export const practiceRecommendationActionSchema = z.enum([
  'reteach',
  'remediate',
  'review',
  'practice_similar',
  'increase_difficulty',
  'advance',
  'ask_clarifying_question',
]);

// ── Sensitive claim / unsafe label patterns ──
const UNSAFE_LABEL_PATTERNS = [
  /\b(lazy|laziness|bad\s+student|hopeless|slow\s+learner|weak\s+person|stupid|dumb|useless)\b/i,
  /\b(mental\s+health|depression|anxiety\s+disorder|adhd|autism|bipolar|ptsd|schizophrenia)\b/i,
  /\b(religion|religious|muslim|christian|hindu|buddhist|jewish|atheist)\b/i,
  /\b(ethnicity|ethnic|race|racial|tribe|tribal)\b/i,
  /\b(political|republican|democrat|party)\b/i,
  /\b(medical\s+diagnosis|diagnosed\s+with|suffers\s+from)\b/i,
  /\b(sexuality|sexual|gay|lesbian|bisexual|transgender|queer)\b/i,
  /\b(financial\s+status|bank\s+account|credit\s+card|income|salary|poor\s+|poverty)\b/i,
  /\b(criminal\s+record|arrested|convicted|felony)\b/i,
];

export function containsUnsafeClaims(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return UNSAFE_LABEL_PATTERNS.some((p) => p.test(text));
}

// ── Helper: unique bounded string array ──
function uniqueStringArray(max: number) {
  return z
    .array(z.string().trim().max(256))
    .max(max)
    .transform((arr) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))]);
}

// ── Helper: nullable bounded optional string ──
function nullableBounded(max: number) {
  return z.string().trim().max(max).nullable().optional();
}

// ── Misconception Signal Input ──
export const misconceptionSignalInputSchema = z.object({
  label: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(1200),
  confidence: z.number().min(0).max(1).optional().default(0.5),
  skillIds: uniqueStringArray(20).optional().default([]),
});

// ── CreatePracticeAttemptRequest ──
export const createPracticeAttemptRequestSchema = z
  .object({
    sessionId: nullableBounded(256),
    kind: practiceAttemptKindSchema,

    subject: nullableBounded(256),
    topic: nullableBounded(256),
    skillIds: uniqueStringArray(50).optional().default([]),

    promptSummary: z.string().trim().min(1).max(1200),
    learnerAnswerSummary: nullableBounded(1200),
    expectedAnswerSummary: nullableBounded(1200),
    feedbackSummary: nullableBounded(1200),

    artifactId: nullableBounded(128),
    artifactBlockId: nullableBounded(128),
    sourceQuestionId: nullableBounded(128),

    hintsRequested: z.number().int().min(0).max(50).optional().default(0),
    attemptNumber: z.number().int().min(1).max(100).optional().default(1),
    timeSpentSeconds: z.number().int().min(0).max(86400).nullable().optional(),

    outcome: practiceOutcomeSchema.optional(),
    confidence: z.number().min(0).max(1).optional().default(0.3),

    misconceptionSignals: z
      .array(misconceptionSignalInputSchema)
      .max(10)
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    // Check promptSummary for unsafe claims
    if (containsUnsafeClaims(data.promptSummary)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Non-academic personal claim detected in promptSummary. Only evidence-based academic practice is allowed.',
        path: ['promptSummary'],
      });
    }
    if (data.learnerAnswerSummary && containsUnsafeClaims(data.learnerAnswerSummary)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Non-academic personal claim detected in learnerAnswerSummary.',
        path: ['learnerAnswerSummary'],
      });
    }
    if (data.feedbackSummary && containsUnsafeClaims(data.feedbackSummary)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Non-academic personal claim detected in feedbackSummary.',
        path: ['feedbackSummary'],
      });
    }
    // Check misconception signals
    for (let i = 0; i < data.misconceptionSignals.length; i++) {
      const sig = data.misconceptionSignals[i];
      if (containsUnsafeClaims(sig.label) || containsUnsafeClaims(sig.summary)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Non-academic personal claim detected in misconception signal. Use academic wording.',
          path: ['misconceptionSignals', i],
        });
      }
    }
  });

// ── ListPracticeAttemptsQuery ──
export const listPracticeAttemptsQuerySchema = z.object({
  subject: z.string().trim().max(256).optional(),
  topic: z.string().trim().max(256).optional(),
  skillId: z.string().trim().max(256).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ── ResolveMasteryRequest ──
export const resolveMasteryRequestSchema = z.object({
  sessionId: nullableBounded(256),
  subject: nullableBounded(256),
  topic: nullableBounded(256),
  skillIds: uniqueStringArray(50).optional().default([]),
  artifactIds: uniqueStringArray(50).optional().default([]),
  maxSignals: z.number().int().min(1).max(25).optional().default(8),
  includeReviewDue: z.boolean().optional().default(true),
  includeNextPractice: z.boolean().optional().default(true),
});

// ── NextPracticeRequest ──
export const nextPracticeRequestSchema = z.object({
  sessionId: nullableBounded(256),
  subject: nullableBounded(256),
  topic: nullableBounded(256),
  skillIds: uniqueStringArray(50).optional().default([]),
  artifactIds: uniqueStringArray(50).optional().default([]),
  maxRecommendations: z.number().int().min(1).max(10).optional().default(3),
});

// ── PatchMasteryRequest ──
export const patchMasteryRequestSchema = z.object({
  status: masteryStatusSchema.optional(),
  level: masteryLevelSchema.optional(),
  confidenceScore: z.number().min(0).max(0.95).optional(),
  nextReviewAt: z.string().datetime().nullable().optional(),
  reviewIntervalDays: z.number().int().min(0).max(365).nullable().optional(),
});

// ── Mastery Query ──
export const masteryQuerySchema = z.object({
  subject: z.string().trim().max(256).optional(),
  topic: z.string().trim().max(256).optional(),
  skillId: z.string().trim().max(256).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ── Review Due Query ──
export const reviewDueQuerySchema = z.object({
  subject: z.string().trim().max(256).optional(),
  topic: z.string().trim().max(256).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// ── Inferred types ──
export type CreatePracticeAttemptRequestValidated = z.infer<typeof createPracticeAttemptRequestSchema>;
export type ResolveMasteryRequestValidated = z.infer<typeof resolveMasteryRequestSchema>;
export type NextPracticeRequestValidated = z.infer<typeof nextPracticeRequestSchema>;
export type PatchMasteryRequestValidated = z.infer<typeof patchMasteryRequestSchema>;
