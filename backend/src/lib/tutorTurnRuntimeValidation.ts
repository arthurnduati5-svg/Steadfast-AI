import { z } from 'zod';
import {
  TUTOR_TURN_KINDS,
  TUTOR_TURN_INTENTS,
  TUTOR_TURN_DISPATCH_TARGETS,
  TUTOR_TURN_STATUSES,
  TUTOR_TURN_SOURCE_SURFACES,
  TUTOR_TURN_EVENT_TYPES,
  FORBIDDEN_TUTOR_TURN_FIELDS,
} from '../contracts/tutorTurnRuntimeContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_TUTOR_TURN_FIELDS);

function detectForbiddenFields(value: unknown, path: string = ''): string[] {
  const found: string[] = [];
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      found.push(...detectForbiddenFields(value[i], `${path}[${i}]`));
    }
    return found;
  }
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (forbiddenSet.has(key)) {
      found.push(currentPath);
    }
    if (val && typeof val === 'object') {
      found.push(...detectForbiddenFields(val, currentPath));
    }
  }
  return found;
}

const forbiddenFieldCheck = <T extends Record<string, unknown>>(data: T, ctx: z.RefinementCtx): void => {
  const forbidden = detectForbiddenFields(data);
  for (const f of forbidden) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Forbidden field detected: ${f}`,
      path: f.split('.').filter(Boolean),
    });
  }
};

export const TutorTurnRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  conversationId: z.string().optional(),
  tutorSessionId: z.string().optional(),
  turnKind: z.enum(TUTOR_TURN_KINDS),
  turnIntent: z.enum(TUTOR_TURN_INTENTS),
  turnSource: z.enum(TUTOR_TURN_SOURCE_SURFACES).optional(),
  requestedMode: z.string().optional(),
  activeMode: z.string().optional(),
  modeSessionId: z.string().optional(),
  growthActionPlanId: z.string().optional(),
  approvedContentRef: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  targetType: z.string().optional(),
  targetRef: z.string().optional(),
  inputFingerprint: z.string().optional(),
  inputSafetyFlags: z.array(z.string()).optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  sourceSurface: z.enum(TUTOR_TURN_SOURCE_SURFACES).optional(),
  execute: z.boolean().optional().default(false),
  dryRun: z.boolean().optional().default(false),
}).passthrough().superRefine(forbiddenFieldCheck);

export const TutorTurnResolveRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  conversationId: z.string().optional(),
  tutorSessionId: z.string().optional(),
  turnKind: z.enum(TUTOR_TURN_KINDS),
  turnIntent: z.enum(TUTOR_TURN_INTENTS),
  turnSource: z.enum(TUTOR_TURN_SOURCE_SURFACES).optional(),
  requestedMode: z.string().optional(),
  activeMode: z.string().optional(),
  modeSessionId: z.string().optional(),
  growthActionPlanId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  targetType: z.string().optional(),
  targetRef: z.string().optional(),
  approvedContentRef: z.string().optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  sourceSurface: z.enum(TUTOR_TURN_SOURCE_SURFACES).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const TutorTurnDispatchRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  conversationId: z.string().optional(),
  tutorSessionId: z.string().optional(),
  turnKind: z.enum(TUTOR_TURN_KINDS),
  turnIntent: z.enum(TUTOR_TURN_INTENTS),
  turnSource: z.enum(TUTOR_TURN_SOURCE_SURFACES).optional(),
  requestedMode: z.string().optional(),
  activeMode: z.string().optional(),
  modeSessionId: z.string().optional(),
  growthActionPlanId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  skillId: z.string().optional(),
  targetType: z.string().optional(),
  targetRef: z.string().optional(),
  approvedContentRef: z.string().optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  sourceSurface: z.enum(TUTOR_TURN_SOURCE_SURFACES).optional(),
  execute: z.boolean(),
  dryRun: z.boolean().optional().default(false),
}).passthrough().superRefine(forbiddenFieldCheck);

export const TutorTurnStateRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  turnId: z.string().optional(),
  conversationId: z.string().optional(),
  tutorSessionId: z.string().optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const TutorTurnEventRequestSchema = z.object({
  schoolId: z.string().min(1),
  studentId: z.string().min(1),
  turnId: z.string().optional(),
  eventType: z.enum(TUTOR_TURN_EVENT_TYPES),
  eventStatus: z.string().min(1),
  safeMetadataJson: z.record(z.string(), z.unknown()).optional(),
  safeReasonCodes: z.array(z.string()).optional(),
  safeEvidenceRefs: z.array(z.string()).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);

export const TutorTurnIdParamSchema = z.object({
  turnId: z.string().min(1),
});

export const TutorTurnSafeResponseSchema = z.object({
  ok: z.boolean(),
  turnId: z.string().optional(),
  status: z.enum(TUTOR_TURN_STATUSES),
  dispatchTarget: z.enum(TUTOR_TURN_DISPATCH_TARGETS).optional(),
  safeReasonCodes: z.array(z.string()),
  safeEvidenceRefs: z.array(z.string()),
  studentSafeMessage: z.string().optional(),
  suggestedNextIntent: z.enum(TUTOR_TURN_INTENTS).optional(),
}).passthrough().superRefine(forbiddenFieldCheck);
