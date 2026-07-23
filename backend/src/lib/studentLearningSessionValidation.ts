import { z, ZodError } from 'zod';
import {
  STUDENT_LEARNING_SESSION_TRANSITION_TYPES,
  STUDENT_LEARNING_SESSION_MODES,
  STUDENT_LEARNING_SESSION_STATUSES,
  STUDENT_LEARNING_SESSION_STAGES,
  STUDENT_LEARNING_SESSION_POLICY_DECISIONS,
  STUDENT_LEARNING_SESSION_SOURCE_TRUTH_STATUSES,
  STUDENT_LEARNING_SESSION_CONFIDENCE_BUCKETS,
  STUDENT_LEARNING_SESSION_REASON_CODES,
  FORBIDDEN_STUDENT_LEARNING_SESSION_FIELDS,
} from '../contracts/studentLearningSessionContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_STUDENT_LEARNING_SESSION_FIELDS);

export function findForbiddenFields(obj: unknown): string[] {
  const found: string[] = [];
  if (!obj || typeof obj !== 'object') return found;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      found.push(...findForbiddenFields(obj[i]));
    }
    return found;
  }
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (forbiddenSet.has(key)) {
      found.push(key);
    }
    if (val && typeof val === 'object') {
      found.push(...findForbiddenFields(val));
    }
  }
  return found;
}

export function rejectForbiddenFields(obj: unknown): void {
  const found = findForbiddenFields(obj);
  if (found.length === 0) return;
  const issues = found.map((f) => ({
    code: z.ZodIssueCode.custom,
    message: `Forbidden field detected: ${f}`,
    path: [f],
  }));
  throw new ZodError(issues);
}

function forbiddenFieldCheck<T extends Record<string, unknown>>(data: T, ctx: z.RefinementCtx): void {
  const forbidden = findForbiddenFields(data);
  for (const f of forbidden) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Forbidden field detected: ${f}`,
      path: f.split('.').filter(Boolean),
    });
  }
}

export const StudentLearningSessionCreateRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().min(1),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  objectiveId: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const StudentLearningSessionResumeRequestSchema = z.object({
  sessionId: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const StudentLearningSessionTransitionRequestSchema = z.object({
  sessionId: z.string().min(1),
  transitionType: z.enum(STUDENT_LEARNING_SESSION_TRANSITION_TYPES),
  requestedMode: z.enum(STUDENT_LEARNING_SESSION_MODES).optional(),
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldCheck);

export const StudentLearningSessionPauseRequestSchema = z.object({
  sessionId: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldCheck);

export const StudentLearningSessionCompleteRequestSchema = z.object({
  sessionId: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldCheck);

export const StudentLearningSessionSnapshotRequestSchema = z.object({
  sessionId: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldCheck);

export const StudentLearningSessionExitSummaryRequestSchema = z.object({
  sessionId: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldCheck);

export const StudentLearningSessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

export const StudentLearningSessionSafeResponseSchema = z.object({
  ok: z.boolean(),
  status: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
  safeReasonCodes: z.array(z.enum(STUDENT_LEARNING_SESSION_REASON_CODES)),
  policyDecision: z.enum(STUDENT_LEARNING_SESSION_POLICY_DECISIONS).optional(),
  sessionId: z.string().optional(),
  sessionStatus: z.enum(STUDENT_LEARNING_SESSION_STATUSES).optional(),
  sessionStage: z.enum(STUDENT_LEARNING_SESSION_STAGES).optional(),
  currentMode: z.enum(STUDENT_LEARNING_SESSION_MODES).optional(),
  sourceTruthStatus: z.enum(STUDENT_LEARNING_SESSION_SOURCE_TRUTH_STATUSES).optional(),
  confidenceBucket: z.enum(STUDENT_LEARNING_SESSION_CONFIDENCE_BUCKETS).optional(),
  message: z.string().optional(),
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
  rawTranscriptIncluded: z.literal(false),
  liveAiCallIncluded: z.literal(false),
  liveSchoolConnectorIncluded: z.literal(false),
}).passthrough().superRefine(forbiddenFieldCheck);

export const StudentLearningSessionErrorResponseSchema = z.object({
  ok: z.literal(false),
  status: z.string(),
  policyDecision: z.enum(STUDENT_LEARNING_SESSION_POLICY_DECISIONS),
  safeReasonCodes: z.array(z.enum(STUDENT_LEARNING_SESSION_REASON_CODES)),
  message: z.string(),
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
  rawTranscriptIncluded: z.literal(false),
  liveAiCallIncluded: z.literal(false),
  liveSchoolConnectorIncluded: z.literal(false),
}).passthrough().superRefine(forbiddenFieldCheck);
