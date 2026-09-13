import { z } from 'zod';
import {
  EXAM_MODE_STATUSES,
  EXAM_MODE_STAGES,
  EXAM_MODE_SESSION_TYPES,
  EXAM_MODE_TARGET_TYPES,
  EXAM_MODE_GOAL_CATEGORIES,
  EXAM_MODE_TIMER_MODES,
  EXAM_MODE_QUESTION_STATUSES,
  EXAM_MODE_ANSWER_QUALITIES,
  EXAM_MODE_MISTAKE_CATEGORIES,
  EXAM_MODE_SCORE_BUCKETS,
  EXAM_MODE_EXIT_REASONS,
  FORBIDDEN_EXAM_MODE_FIELDS,
  CONFIDENCE_BUCKETS,
  ESTIMATED_READINESS_BUCKETS,
  MASTERY_SIGNALS,
  EXAM_MODE_DURATION_BUCKETS,
  EXAM_MODE_TIME_PRESSURE_SIGNALS,
} from '../contracts/examModeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_EXAM_MODE_FIELDS);

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

export const ExamModeStartRequestSchema = z.object({
  conversationId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  targetType: z.enum(EXAM_MODE_TARGET_TYPES),
  approvedContentRef: z.string().optional(),
  paperRef: z.string().optional(),
  examSetRef: z.string().optional(),
  examGoalCategory: z.enum(EXAM_MODE_GOAL_CATEGORIES),
  examSessionType: z.enum(EXAM_MODE_SESSION_TYPES),
  timerMode: z.enum(EXAM_MODE_TIMER_MODES).optional().default('untimed'),
  questionCount: z.number().int().min(1).max(200),
  approvedContextAvailable: z.boolean().optional().default(false),
  deenSensitive: z.boolean().optional().default(false),
  replaceExisting: z.boolean().optional().default(false),
}).passthrough().superRefine(forbiddenCheck);

export const ExamModeStateQuerySchema = z.object({
  includeQuestionStates: z.boolean().optional().default(false),
  includeAttempts: z.boolean().optional().default(false),
}).superRefine(forbiddenCheck);

export const ExamModeQuestionAdvanceRequestSchema = z.object({
  questionKey: z.string().min(1),
  questionIndex: z.number().int().min(0),
  questionRef: z.string().optional(),
  questionFingerprint: z.string().optional(),
}).passthrough().superRefine(forbiddenCheck);

export const ExamModeAttemptRequestSchema = z.object({
  questionKey: z.string().min(1),
  questionIndex: z.number().int().min(0),
  questionRef: z.string().optional(),
  questionFingerprint: z.string().optional(),
  answerQuality: z.enum(EXAM_MODE_ANSWER_QUALITIES),
  mistakeCategory: z.enum(EXAM_MODE_MISTAKE_CATEGORIES).optional(),
  usedHint: z.boolean().optional().default(false),
  timeSpentBucket: z.enum(EXAM_MODE_DURATION_BUCKETS).optional(),
  confidenceBucket: z.enum(CONFIDENCE_BUCKETS).optional(),
  scoreBucket: z.enum(EXAM_MODE_SCORE_BUCKETS).optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenCheck);

export const ExamModeHintRequestSchema = z.object({
  requestedByStudent: z.boolean().optional().default(true),
}).superRefine(forbiddenCheck);

export const ExamModeReflectRequestSchema = z.object({
  reflectionCategory: z.string().optional(),
}).superRefine(forbiddenCheck);

export const ExamModeSubmitRequestSchema = z.object({
  reason: z.enum(EXAM_MODE_EXIT_REASONS).optional().default('student_submitted'),
}).superRefine(forbiddenCheck);

export const ExamModeExitRequestSchema = z.object({
  reason: z.enum(EXAM_MODE_EXIT_REASONS).optional().default('student_exited'),
}).superRefine(forbiddenCheck);

export const ExamModeSessionIdParamSchema = z.object({
  examSessionId: z.string().min(1),
});

export const ExamModeStateResponseSchema = z.object({
  ok: z.boolean(),
  examMode: z.object({
    sessionId: z.string(),
    modeSessionId: z.string(),
    status: z.string(),
    currentStage: z.string(),
    currentQuestionIndex: z.number(),
    questionCount: z.number(),
    currentQuestionState: z.object({
      questionKey: z.string(),
      questionIndex: z.number(),
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
    timerState: z.object({
      timerMode: z.string(),
    }).optional(),
    attemptCount: z.number(),
    hintCount: z.number(),
    stuckCount: z.number(),
    recoveryCount: z.number(),
    skippedCount: z.number(),
    flaggedCount: z.number(),
    safeReasonCodes: z.array(z.string()),
  }),
});
