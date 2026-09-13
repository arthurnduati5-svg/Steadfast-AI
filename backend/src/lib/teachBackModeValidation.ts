import { z } from 'zod';
import {
  TEACH_BACK_MODE_STATUSES,
  TEACH_BACK_MODE_STAGES,
  TEACH_BACK_MODE_SESSION_TYPES,
  TEACH_BACK_MODE_TARGET_TYPES,
  TEACH_BACK_MODE_GOAL_CATEGORIES,
  TEACH_BACK_MODE_PROMPT_STATUSES,
  TEACH_BACK_MODE_EXPLANATION_QUALITIES,
  TEACH_BACK_MODE_CONCEPT_COVERAGE_BUCKETS,
  TEACH_BACK_MODE_CLARITY_BUCKETS,
  TEACH_BACK_MODE_CONFIDENCE_BUCKETS,
  TEACH_BACK_MODE_MISCONCEPTION_SIGNALS,
  TEACH_BACK_MODE_SUPPORT_NEEDS,
  TEACH_BACK_MODE_MASTERY_SIGNALS,
  TEACH_BACK_MODE_READINESS_SIGNALS,
  TEACH_BACK_MODE_EXPLANATION_STRENGTH_BUCKETS,
  TEACH_BACK_MODE_EXIT_REASONS,
  FORBIDDEN_TEACH_BACK_MODE_FIELDS,
} from '../contracts/teachBackModeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_TEACH_BACK_MODE_FIELDS);

function rejectForbiddenFields(obj: unknown): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  const detected: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (forbiddenSet.has(key)) {
      detected.push(key);
    }
    if (typeof value === 'object' && value !== null) {
      detected.push(...rejectForbiddenFields(value).map(n => `${key}.${n}`));
    }
  }
  return detected;
}

const forbiddenCheck = (data: unknown, ctx: z.RefinementCtx) => {
  const detected = rejectForbiddenFields(data);
  if (detected.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Forbidden fields detected: ${detected.join(', ')}`,
    });
  }
};

export const TeachBackModeStartRequestSchema = z.object({
  conversationId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  targetType: z.enum(TEACH_BACK_MODE_TARGET_TYPES),
  approvedContentRef: z.string().optional(),
  targetRef: z.string().optional(),
  promptSetRef: z.string().optional(),
  teachBackGoalCategory: z.enum(TEACH_BACK_MODE_GOAL_CATEGORIES),
  teachBackSessionType: z.enum(TEACH_BACK_MODE_SESSION_TYPES),
  promptCount: z.number().int().min(1).max(200),
  approvedContextAvailable: z.boolean().optional().default(false),
  deenSensitive: z.boolean().optional().default(false),
  replaceExisting: z.boolean().optional().default(false),
}).passthrough().superRefine(forbiddenCheck);

export const TeachBackModeStateQuerySchema = z.object({
  includePromptStates: z.boolean().optional().default(false),
  includeAttempts: z.boolean().optional().default(false),
}).superRefine(forbiddenCheck);

export const TeachBackModePromptAdvanceRequestSchema = z.object({
  promptKey: z.string().min(1),
  promptIndex: z.number().int().min(0),
  promptRef: z.string().optional(),
  questionRef: z.string().optional(),
  contentFingerprint: z.string().optional(),
}).passthrough().superRefine(forbiddenCheck);

export const TeachBackModeExplanationAttemptRequestSchema = z.object({
  promptKey: z.string().min(1),
  promptIndex: z.number().int().min(0),
  promptRef: z.string().optional(),
  questionRef: z.string().optional(),
  contentFingerprint: z.string().optional(),
  explanationQuality: z.enum(TEACH_BACK_MODE_EXPLANATION_QUALITIES),
  conceptCoverageBucket: z.enum(TEACH_BACK_MODE_CONCEPT_COVERAGE_BUCKETS).optional(),
  clarityBucket: z.enum(TEACH_BACK_MODE_CLARITY_BUCKETS).optional(),
  confidenceBucket: z.enum(TEACH_BACK_MODE_CONFIDENCE_BUCKETS).optional(),
  misconceptionSignal: z.enum(TEACH_BACK_MODE_MISCONCEPTION_SIGNALS).optional(),
  usedHint: z.boolean().optional().default(false),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenCheck);

export const TeachBackModeHintRequestSchema = z.object({
  requestedByStudent: z.boolean().optional().default(true),
}).superRefine(forbiddenCheck);

export const TeachBackModeFeedbackRequestSchema = z.object({
  promptKey: z.string().min(1),
  promptIndex: z.number().int().min(0),
}).passthrough().superRefine(forbiddenCheck);

export const TeachBackModeSubmitRequestSchema = z.object({
  reason: z.enum(TEACH_BACK_MODE_EXIT_REASONS).optional().default('student_submitted'),
}).superRefine(forbiddenCheck);

export const TeachBackModeExitRequestSchema = z.object({
  reason: z.enum(TEACH_BACK_MODE_EXIT_REASONS).optional().default('student_exited'),
}).superRefine(forbiddenCheck);

export const TeachBackModeSessionIdParamSchema = z.object({
  teachBackSessionId: z.string().min(1),
});

export const TeachBackModePromptKeyParamSchema = z.object({
  promptKey: z.string().min(1),
});

export const TeachBackModeStateResponseSchema = z.object({
  ok: z.boolean(),
  teachBackMode: z.object({
    sessionId: z.string(),
    modeSessionId: z.string(),
    status: z.string(),
    currentStage: z.string(),
    currentPromptIndex: z.number(),
    promptCount: z.number(),
    currentPromptState: z.object({
      promptKey: z.string(),
      promptIndex: z.number(),
      status: z.string(),
    }).optional(),
    nextAction: z.object({
      selectedAction: z.string(),
      supportLevel: z.string(),
      learnerNeedCategory: z.string(),
    }).optional(),
    answerProtection: z.object({
      decision: z.string(),
    }).optional(),
    feedbackPolicy: z.object({
      decision: z.string(),
    }).optional(),
    attemptCount: z.number(),
    strongExplanationCount: z.number(),
    partialExplanationCount: z.number(),
    weakExplanationCount: z.number(),
    misconceptionCount: z.number(),
    hintCount: z.number(),
    stuckCount: z.number(),
    recoveryCount: z.number(),
    reflectionCount: z.number(),
    safeReasonCodes: z.array(z.string()),
  }),
});
