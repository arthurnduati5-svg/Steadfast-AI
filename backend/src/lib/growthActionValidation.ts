import { z } from 'zod';
import {
  GROWTH_ACTION_INTENTS,
  GROWTH_ACTION_TYPES,
  GROWTH_ACTION_DESTINATIONS,
  GROWTH_ACTION_EXECUTION_STATUSES,
  GROWTH_ACTION_PRIORITY_BUCKETS,
  GROWTH_ACTION_CONFIDENCE_BUCKETS,
  GROWTH_ACTION_ROUTING_DECISIONS,
  GROWTH_ACTION_WHY_THIS_NEXT_CODES,
  GROWTH_ACTION_EVENT_TYPES,
  GROWTH_ACTION_SOURCE_SURFACES,
  GROWTH_ACTION_REASON_CODES,
  FORBIDDEN_GROWTH_ACTION_FIELDS,
} from '../contracts/growthActionContracts';

const forbiddenFieldNames: string[] = [...FORBIDDEN_GROWTH_ACTION_FIELDS];
const forbiddenFieldSet = new Set<string>(forbiddenFieldNames);

function detectForbiddenFields(obj: unknown, path = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const found: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (forbiddenFieldSet.has(key)) {
      found.push(currentPath);
    }
    if (value && typeof value === 'object') {
      found.push(...detectForbiddenFields(value, currentPath));
    }
  }
  return found;
}

function superRefineForbidden<T>(data: T, ctx: z.RefinementCtx): void {
  const forbidden = detectForbiddenFields(data);
  for (const field of forbidden) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Forbidden field detected: ${field}`,
      path: field.split('.'),
    });
  }
}

export const GrowthActionResolveRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  conversationId: z.string().optional(),
  modeSessionId: z.string().optional(),
  sourceSurface: z.enum(GROWTH_ACTION_SOURCE_SURFACES).optional(),
  requestedIntent: z.enum(GROWTH_ACTION_INTENTS).optional(),
  requestedDestination: z.enum(GROWTH_ACTION_DESTINATIONS).optional(),
  targetType: z.string().optional(),
  targetRef: z.string().optional(),
  approvedContentRef: z.string().optional(),
  contentFingerprint: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
}).passthrough().superRefine(superRefineForbidden);

export const GrowthActionExecuteRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  conversationId: z.string().optional(),
  modeSessionId: z.string().optional(),
  sourceSurface: z.enum(GROWTH_ACTION_SOURCE_SURFACES).optional(),
  requestedIntent: z.enum(GROWTH_ACTION_INTENTS).optional(),
  requestedDestination: z.enum(GROWTH_ACTION_DESTINATIONS).optional(),
  targetType: z.string().optional(),
  targetRef: z.string().optional(),
  approvedContentRef: z.string().optional(),
  contentFingerprint: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  execute: z.literal(true),
  replaceExisting: z.boolean().optional(),
}).passthrough().superRefine(superRefineForbidden);

export const GrowthWhyThisNextRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  growthActionPlanId: z.string().optional(),
  conversationId: z.string().optional(),
  modeSessionId: z.string().optional(),
  targetType: z.string().optional(),
  targetRef: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
}).passthrough().superRefine(superRefineForbidden);

export const GrowthActionStateQuerySchema = z.object({
  studentId: z.string().optional(),
  planId: z.string().optional(),
  intent: z.enum(GROWTH_ACTION_INTENTS).optional(),
  destination: z.enum(GROWTH_ACTION_DESTINATIONS).optional(),
  status: z.enum(GROWTH_ACTION_EXECUTION_STATUSES).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
}).passthrough().superRefine(superRefineForbidden);

export const GrowthActionPlanIdParamSchema = z.object({
  growthActionPlanId: z.string().min(1),
});

export const GrowthActionEventRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  tutorLearnerId: z.string().optional(),
  growthActionPlanId: z.string().optional(),
  eventType: z.enum(GROWTH_ACTION_EVENT_TYPES),
  sourceSurface: z.string().optional(),
  growthIntent: z.enum(GROWTH_ACTION_INTENTS),
  resolvedDestination: z.enum(GROWTH_ACTION_DESTINATIONS),
  executedDestination: z.enum(GROWTH_ACTION_DESTINATIONS).optional(),
  executionStatus: z.enum(GROWTH_ACTION_EXECUTION_STATUSES),
  failureReasonCode: z.string().optional(),
  safeMetadata: z.record(z.unknown()).optional().default({}),
  safeEvidenceRefs: z.array(z.string()).optional().default([]),
}).passthrough().superRefine(superRefineForbidden);

export const GrowthActionStateResponseSchema = z.object({
  ok: z.literal(true).or(z.literal(false)),
  actionPlan: z.any().optional(),
  whyThisNextDecision: z.any().optional(),
  routeEvent: z.any().optional(),
  executionResult: z.any().optional(),
  safeEvidenceRefs: z.array(z.string()),
  safeReasonCodes: z.array(z.string()),
});
