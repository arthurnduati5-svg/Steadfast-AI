import { z } from 'zod';
import {
  FOCUS_MODE_STATUSES,
  FOCUS_MODE_STAGES,
  FOCUS_MODE_TARGET_TYPES,
  FOCUS_MODE_STEP_TYPES,
  FOCUS_MODE_STEP_STATUSES,
  FOCUS_MODE_GOAL_CATEGORIES,
  FOCUS_MODE_EXIT_REASONS,
  FOCUS_MODE_ANSWER_QUALITIES,
  FOCUS_MODE_MISTAKE_CATEGORIES,
  FORBIDDEN_FOCUS_MODE_FIELDS,
} from '../contracts/focusModeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_FOCUS_MODE_FIELDS);

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

export const FocusModeStartRequestSchema = z.object({
  conversationId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  targetType: z.enum(FOCUS_MODE_TARGET_TYPES),
  approvedContentRef: z.string().optional(),
  problemRef: z.string().optional(),
  problemFingerprint: z.string().optional(),
  focusGoalCategory: z.enum(FOCUS_MODE_GOAL_CATEGORIES),
  approvedContextAvailable: z.boolean().optional().default(false),
  deenSensitive: z.boolean().optional().default(false),
  replaceExisting: z.boolean().optional().default(false),
}).passthrough().superRefine(forbiddenCheck);

export const FocusModeStateQuerySchema = z.object({
  includeSteps: z.boolean().optional().default(false),
  includeAttempts: z.boolean().optional().default(false),
}).superRefine(forbiddenCheck);

export const FocusModeAdvanceRequestSchema = z.object({
  stepKey: z.string().optional(),
  action: z.string().optional(),
}).superRefine(forbiddenCheck);

export const FocusModeAttemptRequestSchema = z.object({
  stepKey: z.string().optional(),
  answerQuality: z.enum(FOCUS_MODE_ANSWER_QUALITIES),
  mistakeCategory: z.enum(FOCUS_MODE_MISTAKE_CATEGORIES).optional(),
  usedHint: z.boolean().optional().default(false),
  timeSpentBucket: z.string().optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenCheck);

export const FocusModeHintRequestSchema = z.object({
  stepKey: z.string().optional(),
  requestedByStudent: z.boolean().optional().default(true),
}).superRefine(forbiddenCheck);

export const FocusModeExitRequestSchema = z.object({
  reason: z.enum(FOCUS_MODE_EXIT_REASONS).optional().default('student_completed'),
}).superRefine(forbiddenCheck);

export const FocusModeSessionIdParamSchema = z.object({
  focusSessionId: z.string().min(1),
});

export const FocusModeStepIdParamSchema = z.object({
  focusSessionId: z.string().min(1),
  stepId: z.string().min(1),
});

export const FocusModeStateResponseSchema = z.object({
  ok: z.boolean(),
  focusMode: z.object({
    sessionId: z.string(),
    modeSessionId: z.string(),
    status: z.string(),
    currentStage: z.string(),
    currentStep: z.object({
      stepKey: z.string(),
      stepType: z.string(),
      status: z.string(),
    }).optional(),
    nextAction: z.object({
      selectedAction: z.string(),
      supportLevel: z.string(),
      learnerNeedCategory: z.string(),
    }).optional(),
    attemptCount: z.number(),
    hintCount: z.number(),
    stuckCount: z.number(),
    recoveryCount: z.number(),
    safeReasonCodes: z.array(z.string()),
  }),
});
