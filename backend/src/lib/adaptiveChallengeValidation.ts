import { z } from 'zod';
import {
  ADAPTIVE_CHALLENGE_TYPES,
  ADAPTIVE_CHALLENGE_READINESS_LEVELS,
  ADAPTIVE_CHALLENGE_DIFFICULTY_BANDS,
  ADAPTIVE_CHALLENGE_DIFFICULTY_DELTAS,
  ADAPTIVE_CHALLENGE_MASTERY_BUCKETS,
  ADAPTIVE_CHALLENGE_PREREQUISITE_STATUSES,
  ADAPTIVE_CHALLENGE_HINT_SCAFFOLD_LEVELS,
  ADAPTIVE_CHALLENGE_REMEDIATION_TYPES,
  ADAPTIVE_CHALLENGE_ATTEMPT_OUTCOME_BUCKETS,
  ADAPTIVE_CHALLENGE_SOURCE_TRUTH_STATUSES,
  ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS,
  FORBIDDEN_ADAPTIVE_CHALLENGE_FIELDS,
} from '../contracts/adaptiveChallengeContracts';

function checkForbiddenFields(data: unknown): string[] {
  const found: string[] = [];
  function walk(value: unknown, path: string): void {
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (FORBIDDEN_ADAPTIVE_CHALLENGE_FIELDS.includes(key as any)) {
        found.push(fullPath);
      }
      const val = (value as Record<string, unknown>)[key];
      if (val && typeof val === 'object') {
        walk(val, fullPath);
      }
    }
  }
  walk(data, '');
  return found;
}

function makeForbiddenRefine() {
  return (data: unknown, ctx: z.RefinementCtx) => {
    const found = checkForbiddenFields(data);
    if (found.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Forbidden fields detected: ${found.join(', ')}`,
        path: [],
      });
    }
  };
}

export const AdaptiveChallengeRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  objectiveId: z.string().optional(),
  challengeType: z.enum(ADAPTIVE_CHALLENGE_TYPES as any).optional(),
  readinessLevel: z.enum(ADAPTIVE_CHALLENGE_READINESS_LEVELS as any).optional(),
  masteryBucket: z.enum(ADAPTIVE_CHALLENGE_MASTERY_BUCKETS as any).optional(),
  prerequisiteStatus: z.enum(ADAPTIVE_CHALLENGE_PREREQUISITE_STATUSES as any).optional(),
  difficultyBand: z.enum(ADAPTIVE_CHALLENGE_DIFFICULTY_BANDS as any).optional(),
  hintScaffoldLevel: z.enum(ADAPTIVE_CHALLENGE_HINT_SCAFFOLD_LEVELS as any).optional(),
  sourceTruthStatus: z.enum(ADAPTIVE_CHALLENGE_SOURCE_TRUTH_STATUSES as any).optional(),
  confidenceBucket: z.enum(ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS as any).optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(makeForbiddenRefine());

export const ChallengeReadinessRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  objectiveId: z.string().optional(),
  masteryBucket: z.enum(ADAPTIVE_CHALLENGE_MASTERY_BUCKETS as any),
  safeEvidenceRefs: z.array(z.string()).optional(),
  recentAttemptOutcomeBuckets: z.array(z.enum(ADAPTIVE_CHALLENGE_ATTEMPT_OUTCOME_BUCKETS as any)).optional(),
  hintDependencyBucket: z.string().optional(),
  mistakePatternBucket: z.string().optional(),
  confidenceBucket: z.enum(ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS as any).optional(),
  revisionStatus: z.string().optional(),
  teachBackStatus: z.string().optional(),
  prerequisiteStatus: z.enum(ADAPTIVE_CHALLENGE_PREREQUISITE_STATUSES as any).optional(),
  supportLevel: z.string().optional(),
  tuningDecision: z.string().optional(),
  sourceTruthStatus: z.enum(ADAPTIVE_CHALLENGE_SOURCE_TRUTH_STATUSES as any).optional(),
}).passthrough().superRefine(makeForbiddenRefine());

export const DifficultyCalibrationRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  difficultySignalInput: z.object({
    masteryBucket: z.enum(ADAPTIVE_CHALLENGE_MASTERY_BUCKETS as any),
    recentAttemptOutcomeBuckets: z.array(z.enum(ADAPTIVE_CHALLENGE_ATTEMPT_OUTCOME_BUCKETS as any)),
    hintDependencyBucket: z.string().optional(),
    mistakePatternBucket: z.string().optional(),
    confidenceBucket: z.enum(ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS as any).optional(),
    revisionDueBucket: z.string().optional(),
    teachBackBucket: z.string().optional(),
    supportLevel: z.string().optional(),
    challengeFeedback: z.string().optional(),
    readinessLevel: z.enum(ADAPTIVE_CHALLENGE_READINESS_LEVELS as any).optional(),
    sourceTruthStatus: z.enum(ADAPTIVE_CHALLENGE_SOURCE_TRUTH_STATUSES as any).optional(),
  }),
}).passthrough().superRefine(makeForbiddenRefine());

export const ChallengeBlueprintRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  challengeType: z.enum(ADAPTIVE_CHALLENGE_TYPES as any),
  readinessLevel: z.enum(ADAPTIVE_CHALLENGE_READINESS_LEVELS as any),
  difficultyBand: z.enum(ADAPTIVE_CHALLENGE_DIFFICULTY_BANDS as any),
  difficultyDelta: z.enum(ADAPTIVE_CHALLENGE_DIFFICULTY_DELTAS as any),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  objectiveId: z.string().optional(),
  prerequisiteStatus: z.enum(ADAPTIVE_CHALLENGE_PREREQUISITE_STATUSES as any).optional(),
  hintScaffoldLevel: z.enum(ADAPTIVE_CHALLENGE_HINT_SCAFFOLD_LEVELS as any).optional(),
  sourceTruthStatus: z.enum(ADAPTIVE_CHALLENGE_SOURCE_TRUTH_STATUSES as any).optional(),
  confidenceBucket: z.enum(ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS as any).optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(makeForbiddenRefine());

export const ChallengeAttemptMetadataSchema = z.object({
  challengeId: z.string().min(1),
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  objectiveId: z.string().optional(),
  challengeType: z.enum(ADAPTIVE_CHALLENGE_TYPES as any),
  difficultyBand: z.enum(ADAPTIVE_CHALLENGE_DIFFICULTY_BANDS as any),
  hintScaffoldLevel: z.enum(ADAPTIVE_CHALLENGE_HINT_SCAFFOLD_LEVELS as any),
  attemptOutcomeBucket: z.enum(ADAPTIVE_CHALLENGE_ATTEMPT_OUTCOME_BUCKETS as any),
  safeMistakePatternBucket: z.string().optional(),
  safeHintDependencyBucket: z.string().optional(),
  confidenceBucket: z.enum(ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS as any).optional(),
  safeReasonCodes: z.array(z.string()),
  safeEvidenceRefs: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
}).passthrough().superRefine(makeForbiddenRefine());

export const RemediationPathRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  objectiveId: z.string().optional(),
  remediationType: z.enum(ADAPTIVE_CHALLENGE_REMEDIATION_TYPES as any).optional(),
  hintScaffoldLevel: z.enum(ADAPTIVE_CHALLENGE_HINT_SCAFFOLD_LEVELS as any).optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
  sourceTruthStatus: z.enum(ADAPTIVE_CHALLENGE_SOURCE_TRUTH_STATUSES as any).optional(),
  confidenceBucket: z.enum(ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS as any).optional(),
}).passthrough().superRefine(makeForbiddenRefine());

export const AdaptiveChallengeStudentIdParamSchema = z.object({
  studentId: z.string().min(1),
});

export const AdaptiveChallengeIdParamSchema = z.object({
  challengeId: z.string().min(1),
});

export const AdaptiveChallengeSafeResponseSchema = z.object({
  ok: z.literal(true),
  status: z.string(),
  data: z.any().optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  policyDecision: z.string().optional(),
  challengeType: z.string().optional(),
  readinessLevel: z.string().optional(),
  difficultyBand: z.string().optional(),
  sourceTruthStatus: z.string().optional(),
  confidenceBucket: z.string().optional(),
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
});

export const AdaptiveChallengeErrorResponseSchema = z.object({
  ok: z.literal(false),
  status: z.string(),
  policyDecision: z.string(),
  safeReasonCodes: z.array(z.string()),
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
});

export function validateAdaptiveChallengeRequest(data: unknown) {
  return AdaptiveChallengeRequestSchema.safeParse(data);
}

export function validateChallengeReadinessRequest(data: unknown) {
  return ChallengeReadinessRequestSchema.safeParse(data);
}

export function validateDifficultyCalibrationRequest(data: unknown) {
  return DifficultyCalibrationRequestSchema.safeParse(data);
}

export function validateChallengeBlueprintRequest(data: unknown) {
  return ChallengeBlueprintRequestSchema.safeParse(data);
}

export function validateChallengeAttemptMetadata(data: unknown) {
  return ChallengeAttemptMetadataSchema.safeParse(data);
}

export function validateRemediationPathRequest(data: unknown) {
  return RemediationPathRequestSchema.safeParse(data);
}
