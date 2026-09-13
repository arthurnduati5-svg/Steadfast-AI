import { z } from 'zod';
import {
  LEARNER_TRANSPARENCY_SURFACES,
  LEARNER_TRANSPARENCY_NEXT_STEP_TYPES,
  LEARNER_AGENCY_OPTION_TYPES,
  LEARNER_TRANSPARENCY_SOURCE_TRUTH_STATUSES,
  LEARNER_TRANSPARENCY_CONFIDENCE_BUCKETS,
  LEARNER_TRANSPARENCY_STATUSES,
  LEARNER_TRANSPARENCY_POLICY_DECISIONS,
  LEARNER_TRANSPARENCY_REASON_CODES,
  FORBIDDEN_LEARNER_TRANSPARENCY_FIELDS,
  FORBIDDEN_HIDDEN_REASONING_FIELDS,
  FORBIDDEN_PROTECTED_ANSWER_FIELDS,
} from '../contracts/learnerTransparencyContracts';

const forbiddenSet = new Set<string>([
  ...FORBIDDEN_LEARNER_TRANSPARENCY_FIELDS,
  ...FORBIDDEN_HIDDEN_REASONING_FIELDS,
  ...FORBIDDEN_PROTECTED_ANSWER_FIELDS,
]);

export function detectForbiddenFields(value: unknown, path: string = ''): string[] {
  const found: string[] = [];
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      found.push(...detectForbiddenFields(value[i], `${path}[${i}]`));
    }
    return found;
  }
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (forbiddenSet.has(key)) {
      found.push(currentPath);
    }
    if (val && typeof val === 'object') {
      found.push(...detectForbiddenFields(val, currentPath));
    }
  }
  return found;
}

export function assertNoForbiddenFields(data: unknown): void {
  const forbidden = detectForbiddenFields(data);
  if (forbidden.length > 0) {
    throw new Error(`Forbidden fields detected: ${forbidden.join(', ')}`);
  }
}

const forbiddenFieldCheck = <T extends Record<string, unknown>>(data: T, ctx: z.RefinementCtx): void => {
  const forbidden = detectForbiddenFields(data);
  for (const f of forbidden) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Forbidden field detected: ${f}`,
      path: f.split('.').filter(Boolean),
    });
  }
};

export const LearnerTransparencyRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  objectiveId: z.string().optional(),
  surface: z.enum(LEARNER_TRANSPARENCY_SURFACES).optional(),
  nextStepType: z.enum(LEARNER_TRANSPARENCY_NEXT_STEP_TYPES).optional(),
  agencyOptionType: z.enum(LEARNER_AGENCY_OPTION_TYPES).optional(),
  sourceTruthStatus: z.enum(LEARNER_TRANSPARENCY_SOURCE_TRUTH_STATUSES).optional(),
  confidenceBucket: z.enum(LEARNER_TRANSPARENCY_CONFIDENCE_BUCKETS).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  timeWindow: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const LearnerProgressNarrativeRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const LearnerWhyThisNextRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  nextStepType: z.enum(LEARNER_TRANSPARENCY_NEXT_STEP_TYPES).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const LearnerSafeEvidenceCardRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  cardId: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const LearnerAgencyOptionsRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  nextStepType: z.enum(LEARNER_TRANSPARENCY_NEXT_STEP_TYPES).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const LearnerTransparencyStudentIdParamSchema = z.object({
  studentId: z.string().min(1),
});

export const LearnerTransparencyCardIdParamSchema = z.object({
  cardId: z.string().min(1),
});

export const LearnerTransparencySafeResponseSchema = z.object({
  ok: z.boolean(),
  status: z.enum(LEARNER_TRANSPARENCY_STATUSES),
  surface: z.enum(LEARNER_TRANSPARENCY_SURFACES),
  data: z.record(z.string(), z.unknown()).optional(),
  safeReasonCodes: z.array(z.enum(LEARNER_TRANSPARENCY_REASON_CODES)),
  sourceTruthStatus: z.enum(LEARNER_TRANSPARENCY_SOURCE_TRUTH_STATUSES),
  confidenceBucket: z.enum(LEARNER_TRANSPARENCY_CONFIDENCE_BUCKETS),
  generatedAt: z.string(),
  rawPrivateDataIncluded: z.literal(false),
  hiddenReasoningIncluded: z.literal(false),
  teacherOnlyDataIncluded: z.literal(false),
  answerKeyIncluded: z.literal(false),
  modelAnswerIncluded: z.literal(false),
  markingSchemeIncluded: z.literal(false),
  correctAnswerIncluded: z.literal(false),
  safeguardingRawDetailIncluded: z.literal(false),
  deenSensitivePrivateTextIncluded: z.literal(false),
}).passthrough().superRefine(forbiddenFieldCheck);

export const LearnerTransparencyErrorResponseSchema = z.object({
  ok: z.literal(false),
  status: z.enum(LEARNER_TRANSPARENCY_STATUSES),
  policyDecision: z.enum(LEARNER_TRANSPARENCY_POLICY_DECISIONS),
  safeReasonCodes: z.array(z.enum(LEARNER_TRANSPARENCY_REASON_CODES)),
  generatedAt: z.string(),
  rawPrivateDataIncluded: z.literal(false),
  hiddenReasoningIncluded: z.literal(false),
  teacherOnlyDataIncluded: z.literal(false),
  answerKeyIncluded: z.literal(false),
  modelAnswerIncluded: z.literal(false),
  markingSchemeIncluded: z.literal(false),
  correctAnswerIncluded: z.literal(false),
  safeguardingRawDetailIncluded: z.literal(false),
  deenSensitivePrivateTextIncluded: z.literal(false),
}).passthrough().superRefine(forbiddenFieldCheck);

export function validateLearnerTransparencyRequest(data: unknown):
  { valid: true; data: Record<string, unknown> } | { valid: false; errors: z.ZodError } {
  const result = LearnerTransparencyRequestSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data as Record<string, unknown> };
  }
  return { valid: false, errors: result.error };
}
