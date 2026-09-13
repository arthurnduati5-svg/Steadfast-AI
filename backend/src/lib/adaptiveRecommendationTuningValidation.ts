import { z } from 'zod';
import {
  ADAPTIVE_TUNING_FEEDBACK_TYPES,
  ADAPTIVE_TUNING_CHOICE_TYPES,
  ADAPTIVE_TUNING_SUPPORT_LEVELS,
  ADAPTIVE_TUNING_CONFIDENCE_BUCKETS,
  ADAPTIVE_TUNING_POLICY_DECISIONS,
  ADAPTIVE_TUNING_DECISIONS,
  ADAPTIVE_TUNING_HINT_PACING_BUCKETS,
  ADAPTIVE_TUNING_AVOIDANCE_RISK_BUCKETS,
  ADAPTIVE_TUNING_MASTERY_INFLATION_RISK_BUCKETS,
  ADAPTIVE_TUNING_SOURCE_TRUTH_STATUSES,
  FORBIDDEN_ADAPTIVE_TUNING_FIELDS,
} from '../contracts/adaptiveRecommendationTuningContracts';
import {
  LEARNER_PREFERENCE_FEEDBACK_TYPES,
} from '../services/learnerPreferenceFeedbackContracts';

function detectForbiddenFields(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return [];
  const found: string[] = [];
  for (const key of Object.keys(data as Record<string, unknown>)) {
    if ((FORBIDDEN_ADAPTIVE_TUNING_FIELDS as readonly string[]).includes(key)) {
      found.push(key);
    }
    const val = (data as Record<string, unknown>)[key];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      found.push(...detectForbiddenFields(val));
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'object' && item !== null) {
          found.push(...detectForbiddenFields(item));
        }
      }
    }
  }
  return found;
}

const forbiddenFieldCheck = (data: unknown, ctx: z.RefinementCtx) => {
  const forbidden = detectForbiddenFields(data);
  if (forbidden.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Forbidden fields detected: ${forbidden.join(', ')}`,
      path: ['_forbidden'],
    });
  }
};

const allFeedbackTypes = [...LEARNER_PREFERENCE_FEEDBACK_TYPES, ...ADAPTIVE_TUNING_FEEDBACK_TYPES] as const;
const feedbackTypeSchema = z.string().refine(
  (val) => (allFeedbackTypes as readonly string[]).includes(val),
  { message: 'Invalid feedback type' },
);

export const LearnerPreferenceFeedbackRequestSchema = z.object({
  feedbackType: feedbackTypeSchema,
  recommendationId: z.string().optional(),
  agencyOptionId: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  skillTag: z.string().optional(),
  sessionId: z.string().optional(),
  sourceTruthStatus: z.string().optional(),
  confidenceBucket: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const LearnerChoiceSignalRequestSchema = z.object({
  choiceType: z.enum(ADAPTIVE_TUNING_CHOICE_TYPES),
  recommendationId: z.string().optional(),
  recommendationType: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  skillTag: z.string().optional(),
  sessionId: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const SupportCalibrationRequestSchema = z.object({
  recentTooHardCount: z.number().min(0).default(0),
  recentTooEasyCount: z.number().min(0).default(0),
  recentConfusionCount: z.number().min(0).default(0),
  recentCorrectCount: z.number().min(0).default(0),
  recentIncorrectCount: z.number().min(0).default(0),
  recentIndependentSuccessCount: z.number().min(0).default(0),
  recentHintDependencyCount: z.number().min(0).default(0),
  hintDependencyBucket: z.string().optional(),
  effortPatternBucket: z.string().optional(),
  recallSignal: z.string().optional(),
  teachBackSignal: z.string().optional(),
  revisionCompletionSignal: z.string().optional(),
  stuckSignal: z.string().optional(),
  recoverySignal: z.string().optional(),
  confidenceBucket: z.string().optional(),
  sourceTruthStatus: z.string().optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const RecommendationTuningRequestSchema = z.object({
  feedbackType: feedbackTypeSchema,
  choiceType: z.enum(ADAPTIVE_TUNING_CHOICE_TYPES).optional(),
  context: z.object({
    schoolId: z.string(),
    studentId: z.string(),
    tutorLearnerId: z.string().optional(),
    subjectId: z.string().optional(),
    topicId: z.string().optional(),
    skillId: z.string().optional(),
    objectiveId: z.string().optional(),
  }),
  recentTooHardCount: z.number().min(0).default(0),
  recentTooEasyCount: z.number().min(0).default(0),
  recentConfusionCount: z.number().min(0).default(0),
  recentChallengeRequestCount: z.number().min(0).default(0),
  recentTeacherHelpRequestCount: z.number().min(0).default(0),
  recentSkipCount: z.number().min(0).default(0),
  recentAvoidanceSignalCount: z.number().min(0).optional(),
  masteryEvidenceLevel: z.string().optional(),
  sourceTruthStatus: z.string().optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const AdaptiveTuningStudentIdParamSchema = z.object({
  studentId: z.string().min(1),
});

export const AdaptiveTuningSnapshotIdParamSchema = z.object({
  snapshotId: z.string().min(1),
});

export const AdaptiveTuningSafeResponseSchema = z.object({
  ok: z.literal(true),
  status: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  policyDecision: z.string().optional(),
  tuningDecision: z.string().optional(),
  sourceTruthStatus: z.string().optional(),
  confidenceBucket: z.string().optional(),
  avoidanceRiskBucket: z.string().optional(),
  masteryInflationRiskBucket: z.string().optional(),
  message: z.string().optional(),
  rawPrivateDataIncluded: z.literal(false),
  hiddenReasoningIncluded: z.literal(false),
  teacherOnlyDataIncluded: z.literal(false),
  answerKeyIncluded: z.literal(false),
  modelAnswerIncluded: z.literal(false),
  markingSchemeIncluded: z.literal(false),
  correctAnswerIncluded: z.literal(false),
  safeguardingRawDetailIncluded: z.literal(false),
  deenSensitivePrivateTextIncluded: z.literal(false),
  generatedAt: z.string(),
});

export const AdaptiveTuningErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  policyDecision: z.string().optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  rawPrivateDataIncluded: z.literal(false),
  hiddenReasoningIncluded: z.literal(false),
  teacherOnlyDataIncluded: z.literal(false),
  answerKeyIncluded: z.literal(false),
  modelAnswerIncluded: z.literal(false),
  markingSchemeIncluded: z.literal(false),
  correctAnswerIncluded: z.literal(false),
  safeguardingRawDetailIncluded: z.literal(false),
  deenSensitivePrivateTextIncluded: z.literal(false),
  generatedAt: z.string(),
});

export { detectForbiddenFields };
