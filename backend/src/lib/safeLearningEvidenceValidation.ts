import { z } from 'zod';
import {
  SAFE_LEARNING_EVIDENCE_TYPES,
  SAFE_LEARNING_EVIDENCE_STRENGTHS,
  SAFE_LEARNING_EVIDENCE_SOURCE_MODES,
  SAFE_LEARNING_EVIDENCE_SOURCE_TASKS,
  SAFE_LEARNING_EVIDENCE_SOURCE_TRUTH_STATUSES,
  SAFE_LEARNING_EVIDENCE_DATA_QUALITY_STATUSES,
  SAFE_LEARNING_EVIDENCE_AGGREGATE_WINDOWS,
  SAFE_LEARNING_EVIDENCE_PROOF_STATUSES,
  SAFE_LEARNING_EVIDENCE_POLICY_DECISIONS,
  SAFE_LEARNING_EVIDENCE_VIEW_SCOPES,
  FORBIDDEN_SAFE_LEARNING_EVIDENCE_FIELDS,
} from '../contracts/safeLearningEvidenceContracts';

const forbiddenFieldSet = new Set<string>(FORBIDDEN_SAFE_LEARNING_EVIDENCE_FIELDS);

function detectForbiddenFields(obj: unknown, path = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const found: string[] = [];
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      found.push(...detectForbiddenFields(obj[i], `${path}[${i}]`));
    }
    return found;
  }
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (forbiddenFieldSet.has(key)) {
      found.push(fullPath);
    }
    if (val && typeof val === 'object') {
      found.push(...detectForbiddenFields(val, fullPath));
    }
  }
  return found;
}

function rejectForbiddenRefine(val: unknown, ctx: z.RefinementCtx) {
  const forbidden = detectForbiddenFields(val);
  if (forbidden.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Forbidden fields detected: ${forbidden.join(', ')}`,
      path: ['_forbidden'],
    });
  }
}

export const safeEvidenceTypeSchema = z.enum(SAFE_LEARNING_EVIDENCE_TYPES as unknown as [string, ...string[]]);
export const safeEvidenceStrengthSchema = z.enum(SAFE_LEARNING_EVIDENCE_STRENGTHS as unknown as [string, ...string[]]);
export const safeSourceModeSchema = z.enum(SAFE_LEARNING_EVIDENCE_SOURCE_MODES as unknown as [string, ...string[]]);
export const safeSourceTaskSchema = z.enum(SAFE_LEARNING_EVIDENCE_SOURCE_TASKS as unknown as [string, ...string[]]);
export const safeSourceTruthStatusSchema = z.enum(SAFE_LEARNING_EVIDENCE_SOURCE_TRUTH_STATUSES as unknown as [string, ...string[]]);
export const safeDataQualityStatusSchema = z.enum(SAFE_LEARNING_EVIDENCE_DATA_QUALITY_STATUSES as unknown as [string, ...string[]]);
export const safeAggregateWindowSchema = z.enum(SAFE_LEARNING_EVIDENCE_AGGREGATE_WINDOWS as unknown as [string, ...string[]]);
export const safeProofStatusSchema = z.enum(SAFE_LEARNING_EVIDENCE_PROOF_STATUSES as unknown as [string, ...string[]]);
export const safePolicyDecisionSchema = z.enum(SAFE_LEARNING_EVIDENCE_POLICY_DECISIONS as unknown as [string, ...string[]]);
export const safeViewScopeSchema = z.enum(SAFE_LEARNING_EVIDENCE_VIEW_SCOPES as unknown as [string, ...string[]]);

export const SafeLearningEvidenceIngestRequestSchema = z.object({
  schoolId: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
  tutorLearnerId: z.string().max(128).optional(),
  conversationId: z.string().max(128).optional(),
  tutorSessionId: z.string().max(128).optional(),
  turnId: z.string().max(128).optional(),
  modeSessionId: z.string().max(128).optional(),
  sourceTask: safeSourceTaskSchema,
  sourceMode: safeSourceModeSchema,
  evidenceType: safeEvidenceTypeSchema,
  evidenceStrength: safeEvidenceStrengthSchema,
  sourceTruthStatus: safeSourceTruthStatusSchema.optional().default('real'),
  dataQualityStatus: safeDataQualityStatusSchema.optional().default('valid'),
  approvedContentRef: z.string().max(256).optional(),
  contentFingerprint: z.string().max(256).optional(),
  subjectId: z.string().max(128).optional(),
  topicId: z.string().max(128).optional(),
  skillId: z.string().max(128).optional(),
  objectiveId: z.string().max(128).optional(),
  targetType: z.string().max(64).optional(),
  targetRef: z.string().max(256).optional(),
  attemptNumber: z.number().int().min(0).optional(),
  timeSpentBucket: z.string().max(32).optional(),
  difficultyBucket: z.string().max(32).optional(),
  supportNeed: z.string().max(64).optional(),
  hintLevel: z.string().max(16).optional(),
  hintDependencyBucket: z.string().max(32).optional(),
  mistakeCategory: z.string().max(64).optional(),
  misconceptionCategory: z.string().max(64).optional(),
  recallQuality: z.string().max(32).optional(),
  explanationQualityBucket: z.string().max(32).optional(),
  reflectionQualityBucket: z.string().max(32).optional(),
  readinessBucket: z.string().max(32).optional(),
  masterySignal: z.string().max(32).optional(),
  weakTopicSignal: z.string().max(32).optional(),
  revisionSignal: z.string().max(32).optional(),
  growthProofSignal: z.string().max(32).optional(),
  safeReasonCodes: z.array(z.string()).optional().default([]),
  safeEvidenceRefs: z.array(z.string()).optional().default([]),
  idempotencyKey: z.string().max(256).optional(),
}).passthrough().superRefine(rejectForbiddenRefine);

export const SafeLearningEvidenceBatchIngestRequestSchema = z.object({
  events: z.array(SafeLearningEvidenceIngestRequestSchema).min(1).max(100),
}).superRefine(rejectForbiddenRefine);

export const SafeLearningEvidenceQuerySchema = z.object({
  schoolId: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128).optional(),
  subjectId: z.string().max(128).optional(),
  topicId: z.string().max(128).optional(),
  skillId: z.string().max(128).optional(),
  sourceTask: safeSourceTaskSchema.optional(),
  sourceMode: safeSourceModeSchema.optional(),
  evidenceType: safeEvidenceTypeSchema.optional(),
  limit: z.number().int().min(1).max(200).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export const SafeLearningEvidenceAggregateRequestSchema = z.object({
  schoolId: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
  tutorLearnerId: z.string().max(128).optional(),
  aggregateWindow: safeAggregateWindowSchema,
  subjectId: z.string().max(128).optional(),
  topicId: z.string().max(128).optional(),
  skillId: z.string().max(128).optional(),
});

export const SafeLearningEvidenceIdParamSchema = z.object({
  evidenceId: z.string().min(1).max(256),
});

export const SafeLearningEvidenceSafeResponseSchema = z.object({
  ok: z.boolean(),
  status: z.string(),
  message: z.string().optional(),
  policyDecision: z.string().optional(),
  dataQualityStatus: z.string().optional(),
  safeReasonCodes: z.array(z.string()),
  safeEvidenceRefs: z.array(z.string()),
  studentSafeMessage: z.string().optional(),
  evidence: z.any().optional(),
  aggregate: z.any().optional(),
  growthProof: z.any().optional(),
  whyThisNextPacket: z.any().optional(),
  teacherView: z.any().optional(),
  learnerView: z.any().optional(),
  telemetryEvent: z.any().optional(),
});

export const GrowthProofSummaryRequestSchema = SafeLearningEvidenceAggregateRequestSchema;

export const TeacherSafeEvidenceViewRequestSchema = z.object({
  schoolId: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
  subjectId: z.string().max(128).optional(),
  topicId: z.string().max(128).optional(),
});

export const LearnerSafeEvidenceViewRequestSchema = z.object({
  schoolId: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
});

export { detectForbiddenFields };
