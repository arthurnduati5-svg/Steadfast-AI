// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Learner Memory Runtime Validation
// Uses Zod schemas to validate all learner memory request bodies.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

// ── Enums as Zod schemas ──

export const learnerMemoryKindSchema = z.enum([
  'strength',
  'weakness',
  'misconception',
  'recent_mistake',
  'revision_need',
  'practice_pattern',
  'artifact_usage',
  'language_support',
  'metacognitive_support',
  'tutor_preference',
  'early_mastery_signal',
]);

export const learnerMemoryStatusSchema = z.enum([
  'active',
  'merged',
  'superseded',
  'soft_deleted',
  'expired',
  'disputed',
  'school_exited_hold',
  'blocked',
  'archived',
]);

export const learnerMemoryVisibilitySchema = z.enum([
  'system_only',
  'teacher_visible',
  'student_visible_summary',
  'admin_only',
]);

export const learnerMemorySourceSchema = z.enum([
  'tutor_turn',
  'practice_attempt',
  'artifact_query',
  'artifact_parse',
  'teacher_note',
  'student_self_report',
  'revision_session',
  'system_import',
  'manual_admin',
]);

export const learnerMemoryConfidenceSchema = z.enum(['low', 'medium', 'high']);

export const learningEventKindSchema = z.enum([
  'asked_question',
  'answered_question',
  'made_mistake',
  'corrected_mistake',
  'requested_hint',
  'used_artifact',
  'queried_artifact',
  'completed_practice',
  'reviewed_topic',
  'explained_back',
  'teacher_note_added',
  'memory_corrected',
  'memory_deleted',
]);

export const learningEventSourceSchema = z.enum([
  'chat',
  'artifact_query',
  'practice',
  'teacher',
  'system',
  'revision',
]);

export const privacyLevelSchema = z.enum(['low', 'medium', 'high']);

// ── Sensitive claim patterns (blocked at validation layer) ──
const SENSITIVE_CLAIM_PATTERNS = [
  /\b(religion|religious|muslim|christian|hindu|buddhist|jewish|atheist)\b/i,
  /\b(ethnicity|ethnic|race|racial|tribe|tribal)\b/i,
  /\b(political|republican|democrat|party|politics)\b/i,
  /\b(medical\s+diagnosis|diagnosed\s+with|suffers\s+from)\b/i,
  /\b(mental\s+health|depression|anxiety\s+disorder|adhd|autism|bipolar|ptsd|schizophrenia)\b/i,
  /\b(sexuality|sexual|gay|lesbian|bisexual|transgender|queer)\b/i,
  /\b(home\s+address|street\s+address|p\.?\s*o\.?\s*box)\b/i,
  /\b(financial\s+status|bank\s+account|credit\s+card|income|salary|poor\s+|poverty)\b/i,
  /\b(lazy|laziness|lacks\s+motivation|lacks\s+effort|weak\s+student|slow\s+learner)\b/i,
  /\b(criminal\s+record|arrested|convicted|felony)\b/i,
];

export function containsSensitiveClaims(text: string): boolean {
  return SENSITIVE_CLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

// ── Helper schemas ──

const uniqueStringArray = (max: number) =>
  z
    .array(z.string().trim().max(256))
    .max(max)
    .transform((arr) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))]);

const boundedString = (max: number) =>
  z.string().trim().max(max).optional().default('');

const nullableBounded = (max: number) =>
  z.string().trim().max(max).nullable().optional();

// ── Learning Signal Input ──

export const learningSignalInputSchema = z.object({
  kind: learnerMemoryKindSchema,
  label: z.string().trim().max(160),
  summary: z.string().trim().max(1200),
  subject: nullableBounded(256),
  topic: nullableBounded(256),
  skillIds: uniqueStringArray(20).optional().default([]),
  confidence: z.number().min(0).max(1).optional().default(0.5),
  evidenceSummary: z.string().trim().max(800),
  artifactId: nullableBounded(128),
  artifactBlockId: nullableBounded(128),
});

// ── Evidence Input ──

export const learnerMemoryEvidenceInputSchema = z.object({
  source: learnerMemorySourceSchema,
  summary: z.string().trim().max(1200),
  subject: nullableBounded(256),
  topic: nullableBounded(256),
  skillIds: uniqueStringArray(20).optional().default([]),
  artifactId: nullableBounded(128),
  artifactBlockId: nullableBounded(128),
  confidence: z.number().min(0).max(1).optional().default(0.5),
  safeQuote: nullableBounded(280),
});

// ── CreateLearningEventRequest ──

export const createLearningEventRequestSchema = z.object({
  sessionId: nullableBounded(256),
  kind: learningEventKindSchema,
  subject: nullableBounded(256),
  topic: nullableBounded(256),
  skillIds: uniqueStringArray(50).optional().default([]),
  artifactId: nullableBounded(128),
  artifactBlockId: nullableBounded(128),
  promptSummary: nullableBounded(1000),
  responseSummary: nullableBounded(1000),
  outcomeSummary: nullableBounded(1000),
  signals: z
    .array(learningSignalInputSchema)
    .max(20)
    .optional()
    .default([]),
  source: learningEventSourceSchema.optional().default('chat'),
});

// ── CreateLearnerMemoryRequest ──

export const createLearnerMemoryRequestSchema = z
  .object({
    kind: learnerMemoryKindSchema,
    visibility: learnerMemoryVisibilitySchema.optional().default('system_only'),
    subject: nullableBounded(256),
    topic: nullableBounded(256),
    skillIds: uniqueStringArray(50).optional().default([]),
    label: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(1200),
    tutorUse: z.string().trim().min(1).max(800),
    evidence: z
      .array(learnerMemoryEvidenceInputSchema)
      .min(1, 'At least one evidence entry is required.')
      .max(20),
    confidence: learnerMemoryConfidenceSchema.optional().default('low'),
    artifactIds: uniqueStringArray(50).optional().default([]),
    artifactBlockIds: uniqueStringArray(50).optional().default([]),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // Check label, summary, tutorUse for sensitive claims
    for (const field of ['label', 'summary', 'tutorUse'] as const) {
      const value = data[field];
      if (value && containsSensitiveClaims(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Sensitive or non-academic personal claim detected in ${field}. Only evidence-based academic memory is allowed.`,
          path: [field],
        });
      }
    }
    // Check evidence summaries for sensitive claims
    for (let i = 0; i < data.evidence.length; i++) {
      if (containsSensitiveClaims(data.evidence[i].summary)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Sensitive or non-academic personal claim detected in evidence[${i}].summary.`,
          path: ['evidence', i, 'summary'],
        });
      }
    }
  });

// ── ResolveLearnerMemoryRequest ──

export const resolveLearnerMemoryRequestSchema = z.object({
  sessionId: nullableBounded(256),
  subject: nullableBounded(256),
  topic: nullableBounded(256),
  skillIds: uniqueStringArray(50).optional().default([]),
  artifactIds: uniqueStringArray(50).optional().default([]),
  maxSignals: z.number().int().min(1).max(25).optional().default(8),
  includeDeleted: z.literal(false).optional().default(false),
});

// ── PatchLearnerMemoryRequest ──

export const patchLearnerMemoryRequestSchema = z.object({
  status: learnerMemoryStatusSchema.optional(),
  visibility: learnerMemoryVisibilitySchema.optional(),
  label: z.string().trim().min(1).max(160).optional(),
  summary: z.string().trim().min(1).max(1200).optional(),
  tutorUse: z.string().trim().min(1).max(800).optional(),
  confidence: learnerMemoryConfidenceSchema.optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// ── DeleteLearnerMemoryRequest ──

export const deleteLearnerMemoryRequestSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

// ── Query params for GET memory ──

export const getLearnerMemoryQuerySchema = z.object({
  subject: z.string().trim().max(256).optional(),
  topic: z.string().trim().max(256).optional(),
  kind: learnerMemoryKindSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  includeDeleted: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

// ── Inferred types ──
export type CreateLearningEventRequestValidated = z.infer<typeof createLearningEventRequestSchema>;
export type CreateLearnerMemoryRequestValidated = z.infer<typeof createLearnerMemoryRequestSchema>;
export type ResolveLearnerMemoryRequestValidated = z.infer<typeof resolveLearnerMemoryRequestSchema>;
export type PatchLearnerMemoryRequestValidated = z.infer<typeof patchLearnerMemoryRequestSchema>;
export type DeleteLearnerMemoryRequestValidated = z.infer<typeof deleteLearnerMemoryRequestSchema>;
