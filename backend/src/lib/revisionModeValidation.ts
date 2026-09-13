import { z } from 'zod';
import {
  REVISION_MODE_STATUSES,
  REVISION_MODE_STAGES,
  REVISION_MODE_SESSION_TYPES,
  REVISION_MODE_QUEUE_TYPES,
  REVISION_MODE_QUEUE_STATUSES,
  REVISION_MODE_SOURCE_TYPES,
  REVISION_MODE_TARGET_TYPES,
  REVISION_MODE_GOAL_CATEGORIES,
  REVISION_MODE_ITEM_STATUSES,
  REVISION_MODE_RECALL_QUALITIES,
  REVISION_MODE_RETRIEVAL_SIGNALS,
  REVISION_MODE_MISTAKE_CATEGORIES,
  REVISION_MODE_SUPPORT_NEEDS,
  REVISION_MODE_MASTERY_SIGNALS,
  REVISION_MODE_READINESS_SIGNALS,
  REVISION_MODE_RECALL_STRENGTH_BUCKETS,
  REVISION_MODE_REVIEW_INTERVAL_BUCKETS,
  REVISION_MODE_BRIDGE_RECOMMENDATIONS,
  REVISION_MODE_EXIT_REASONS,
  FORBIDDEN_REVISION_MODE_FIELDS,
} from '../contracts/revisionModeContracts';

function containsForbiddenField(value: unknown, path: string[] = []): string[] {
  const results: string[] = [];
  if (!value || typeof value !== 'object') return results;
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = [...path, key].join('.');
    if (FORBIDDEN_REVISION_MODE_FIELDS.includes(key as any)) {
      results.push(currentPath);
    }
    if (val && typeof val === 'object') {
      results.push(...containsForbiddenField(val, [...path, key]));
    }
  }
  return results;
}

function forbiddenFieldSuperRefine<T extends Record<string, unknown>>(data: T, ctx: z.RefinementCtx) {
  const forbidden = containsForbiddenField(data);
  for (const path of forbidden) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Forbidden field detected: ${path}`,
      path: path.split('.'),
    });
  }
}

const stringEnum = <T extends readonly string[]>(values: T) =>
  z.string().refine((v) => values.includes(v), { message: `Must be one of: ${values.join(', ')}` });

export const RevisionModeStartRequestSchema = z.object({
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  approvedContentRef: z.string().optional(),
  targetRef: z.string().optional(),
  revisionGoalCategory: stringEnum(REVISION_MODE_GOAL_CATEGORIES).optional(),
  revisionSessionType: stringEnum(REVISION_MODE_SESSION_TYPES).optional(),
  replaceExisting: z.boolean().optional().default(false),
  conversationId: z.string().optional(),
  queueType: stringEnum(REVISION_MODE_QUEUE_TYPES).optional(),
  sourceType: stringEnum(REVISION_MODE_SOURCE_TYPES).optional(),
  targetRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeStateQuerySchema = z.object({
  includeQueue: z.string().optional(),
  includeItems: z.string().optional(),
  includeAttempts: z.string().optional(),
  includeSummary: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeQueueCreateRequestSchema = z.object({
  queueType: stringEnum(REVISION_MODE_QUEUE_TYPES),
  sourceType: stringEnum(REVISION_MODE_SOURCE_TYPES),
  targetRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeItemAddRequestSchema = z.object({
  targetType: stringEnum(REVISION_MODE_TARGET_TYPES),
  targetRef: z.string().optional(),
  approvedContentRef: z.string().optional(),
  sourceMode: z.string().optional(),
  sourceSessionRef: z.string().optional(),
  sourceSummaryRef: z.string().optional(),
  contentFingerprint: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  difficultyBucket: z.string().optional(),
  priorityBucket: z.string().optional(),
  itemKey: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeItemAdvanceRequestSchema = z.object({
  itemKey: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeAttemptRequestSchema = z.object({
  itemKey: z.string().min(1),
  recallQuality: stringEnum(REVISION_MODE_RECALL_QUALITIES),
  retrievalSignal: stringEnum(REVISION_MODE_RETRIEVAL_SIGNALS).optional(),
  mistakeCategory: stringEnum(REVISION_MODE_MISTAKE_CATEGORIES).optional(),
  explanationQuality: z.string().optional(),
  usedHint: z.boolean().optional().default(false),
  hintLevel: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeHintRequestSchema = z.object({
  itemKey: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeReflectRequestSchema = z.object({
  itemKey: z.string().min(1),
  readinessSignal: stringEnum(REVISION_MODE_READINESS_SIGNALS).optional(),
  masterySignal: stringEnum(REVISION_MODE_MASTERY_SIGNALS).optional(),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeScheduleRequestSchema = z.object({
  itemKey: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeBridgeRequestSchema = z.object({
  itemKey: z.string().optional(),
  targetMode: z.string().optional(),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeSubmitRequestSchema = z.object({
  exitReason: stringEnum(REVISION_MODE_EXIT_REASONS).optional(),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeExitRequestSchema = z.object({
  exitReason: stringEnum(REVISION_MODE_EXIT_REASONS),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeSessionIdParamSchema = z.object({
  revisionSessionId: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeQueueIdParamSchema = z.object({
  revisionSessionId: z.string().min(1),
  queueId: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldSuperRefine);

export const RevisionModeItemKeyParamSchema = z.object({
  revisionSessionId: z.string().min(1),
  itemKey: z.string().min(1),
}).passthrough().superRefine(forbiddenFieldSuperRefine);
