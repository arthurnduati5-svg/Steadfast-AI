import { z } from 'zod';
import {
  QUIZ_MODE_STATUSES,
  QUIZ_MODE_STAGES,
  QUIZ_MODE_SESSION_TYPES,
  QUIZ_MODE_TARGET_TYPES,
  QUIZ_MODE_GOAL_CATEGORIES,
  QUIZ_MODE_QUESTION_STATUSES,
  QUIZ_MODE_ANSWER_QUALITIES,
  QUIZ_MODE_MISTAKE_CATEGORIES,
  QUIZ_MODE_SCORE_BUCKETS,
  QUIZ_MODE_RETRIEVAL_SIGNALS,
  QUIZ_MODE_RECALL_STRENGTH_BUCKETS,
  QUIZ_MODE_PRACTICE_NEEDS,
  QUIZ_MODE_EXIT_REASONS,
  FORBIDDEN_QUIZ_MODE_FIELDS,
  QUIZ_MODE_CONFIDENCE_BUCKETS,
  QUIZ_MODE_TIME_SPENT_BUCKETS,
} from '../contracts/quizModeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_QUIZ_MODE_FIELDS);

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

export const QuizModeStartRequestSchema = z.object({
  conversationId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  targetType: z.enum(QUIZ_MODE_TARGET_TYPES),
  approvedContentRef: z.string().optional(),
  quizSetRef: z.string().optional(),
  quizGoalCategory: z.enum(QUIZ_MODE_GOAL_CATEGORIES),
  quizSessionType: z.enum(QUIZ_MODE_SESSION_TYPES),
  questionCount: z.number().int().min(1).max(200),
  approvedContextAvailable: z.boolean().optional().default(false),
  deenSensitive: z.boolean().optional().default(false),
  replaceExisting: z.boolean().optional().default(false),
}).passthrough().superRefine(forbiddenCheck);

export const QuizModeStateQuerySchema = z.object({
  includeQuestionStates: z.boolean().optional().default(false),
  includeAttempts: z.boolean().optional().default(false),
}).superRefine(forbiddenCheck);

export const QuizModeQuestionAdvanceRequestSchema = z.object({
  questionKey: z.string().min(1),
  questionIndex: z.number().int().min(0),
  questionRef: z.string().optional(),
  questionFingerprint: z.string().optional(),
}).passthrough().superRefine(forbiddenCheck);

export const QuizModeAttemptRequestSchema = z.object({
  questionKey: z.string().min(1),
  questionIndex: z.number().int().min(0),
  questionRef: z.string().optional(),
  questionFingerprint: z.string().optional(),
  answerQuality: z.enum(QUIZ_MODE_ANSWER_QUALITIES),
  mistakeCategory: z.enum(QUIZ_MODE_MISTAKE_CATEGORIES).optional(),
  usedHint: z.boolean().optional().default(false),
  timeSpentBucket: z.enum(QUIZ_MODE_TIME_SPENT_BUCKETS).optional(),
  confidenceBucket: z.enum(QUIZ_MODE_CONFIDENCE_BUCKETS).optional(),
  scoreBucket: z.enum(QUIZ_MODE_SCORE_BUCKETS).optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenCheck);

export const QuizModeHintRequestSchema = z.object({
  requestedByStudent: z.boolean().optional().default(true),
}).superRefine(forbiddenCheck);

export const QuizModeFeedbackRequestSchema = z.object({
  questionKey: z.string().min(1),
  questionIndex: z.number().int().min(0),
}).passthrough().superRefine(forbiddenCheck);

export const QuizModeSubmitRequestSchema = z.object({
  reason: z.enum(QUIZ_MODE_EXIT_REASONS).optional().default('student_submitted'),
}).superRefine(forbiddenCheck);

export const QuizModeExitRequestSchema = z.object({
  reason: z.enum(QUIZ_MODE_EXIT_REASONS).optional().default('student_exited'),
}).superRefine(forbiddenCheck);

export const QuizModeSessionIdParamSchema = z.object({
  quizSessionId: z.string().min(1),
});

export const QuizModeStateResponseSchema = z.object({
  ok: z.boolean(),
  quizMode: z.object({
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
    feedbackPolicy: z.object({
      decision: z.string(),
    }).optional(),
    attemptCount: z.number(),
    correctCount: z.number(),
    partialCount: z.number(),
    incorrectCount: z.number(),
    hintCount: z.number(),
    stuckCount: z.number(),
    recoveryCount: z.number(),
    skippedCount: z.number(),
    flaggedCount: z.number(),
    safeReasonCodes: z.array(z.string()),
  }),
});
