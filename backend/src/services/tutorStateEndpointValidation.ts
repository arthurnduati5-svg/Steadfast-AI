// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Endpoint Validation v1
// Zod-based runtime validation for all endpoint requests.
// Prevents body identity spoofing, forbidden fields, and
// invalid operation values.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import {
  FORBIDDEN_BODY_FIELDS,
  LEARNER_SAFE_PATCH_OPERATIONS,
  TEACHER_PATCH_OPERATIONS,
} from './tutorStateEndpointContracts';

// ── Helper: reject forbidden body fields ──

function rejectForbiddenFields(body: Record<string, unknown>): string[] {
  const violations: string[] = [];
  for (const field of FORBIDDEN_BODY_FIELDS) {
    if (field in body && body[field] !== undefined) {
      violations.push(`Forbidden field in body: "${field}"`);
    }
  }
  return violations;
}

// ── View Mode ──

const viewModeSchema = z.enum([
  'learner_safe',
  'tutor_internal',
  'teacher_audit',
  'system_debug',
]).default('learner_safe');

// ── Source Domain ──

const sourceDomainSchema = z.enum([
  'identity', 'session', 'topic', 'artifact', 'video',
  'practice', 'mastery', 'learner_memory', 'source_trust',
  'cache_policy', 'intent', 'chat', 'system',
]);

// ── Patch Operation ──

const patchOperationSchema = z.enum([
  'set_active_topic',
  'set_learning_mode',
  'set_active_artifacts',
  'clear_active_artifacts',
  'set_active_video_session',
  'clear_active_video_session',
  'set_next_action',
  'clear_next_action',
  'reset_session_state',
  'append_note',
  'acknowledge_warning',
]);

// ── Reset Scope ──

const resetScopeSchema = z.enum([
  'session_only',
  'active_topic',
  'active_artifacts',
  'active_video',
  'active_practice',
  'next_action',
  'all_ephemeral',
]);

// ── Reason ──

const reasonSchema = z.string().trim().max(500).nullable().optional();

// ── Session ID ──

const sessionIdSchema = z.string().trim().max(120).nullable().optional();

// ── Expected State Version ──

const expectedStateVersionSchema = z.number().int().min(0).nullable().optional();

// ── Patch Value Schemas ──

const topicValueSchema = z.string().trim().max(256);
const learningModeValueSchema = z.enum([
  'learn', 'practice', 'review', 'revision', 'research',
  'artifact_help', 'video_help',
]);
const artifactIdsValueSchema = z.array(z.string().trim().max(128)).max(50);
const videoSessionValueSchema = z.object({
  sessionVideoId: z.string().trim().max(256),
  title: z.string().trim().max(256),
}).passthrough();
const noteValueSchema = z.string().trim().max(500);
const warningValueSchema = z.string().trim().max(500);

function validatePatchValue(operation: string, value: unknown): { ok: boolean; message?: string } {
  if (value === undefined || value === null) {
    return { ok: false, message: 'Value is required for this patch operation.' };
  }

  switch (operation) {
    case 'set_active_topic':
      return topicValueSchema.safeParse(value).success
        ? { ok: true }
        : { ok: false, message: 'Value must be a string (max 256 chars).' };
    case 'set_learning_mode':
      return learningModeValueSchema.safeParse(value).success
        ? { ok: true }
        : { ok: false, message: 'Value must be a valid learning mode.' };
    case 'set_active_artifacts':
      return artifactIdsValueSchema.safeParse(value).success
        ? { ok: true }
        : { ok: false, message: 'Value must be an array of artifact ID strings (max 50).' };
    case 'clear_active_artifacts':
      return value === 'confirmed' || value === true
        ? { ok: true }
        : { ok: false, message: 'Value must be "confirmed" or true to clear artifacts.' };
    case 'set_active_video_session':
      return videoSessionValueSchema.safeParse(value).success
        ? { ok: true }
        : { ok: false, message: 'Value must be a video session object with sessionVideoId and title.' };
    case 'clear_active_video_session':
      return value === 'confirmed' || value === true
        ? { ok: true }
        : { ok: false, message: 'Value must be "confirmed" or true to clear video session.' };
    case 'set_next_action':
      return typeof value === 'object' && value !== null && 'actionType' in value
        ? { ok: true }
        : { ok: false, message: 'Value must be a next-action object with actionType.' };
    case 'clear_next_action':
      return value === 'confirmed' || value === true
        ? { ok: true }
        : { ok: false, message: 'Value must be "confirmed" or true to clear next action.' };
    case 'append_note':
      return noteValueSchema.safeParse(value).success
        ? { ok: true }
        : { ok: false, message: 'Value must be a string (max 500 chars).' };
    case 'acknowledge_warning':
      return warningValueSchema.safeParse(value).success
        ? { ok: true }
        : { ok: false, message: 'Value must be a string (max 500 chars).' };
    case 'reset_session_state':
      return value === 'confirmed' || value === true
        ? { ok: true }
        : { ok: false, message: 'Value must be "confirmed" or true to reset session state.' };
    default:
      return { ok: false, message: `Unknown operation: ${operation}` };
  }
}

// ── Request Schemas ──

export const resolveTutorStateV2Schema = z.object({
  sessionId: sessionIdSchema,
  includeDomains: z.array(sourceDomainSchema).max(20).optional(),
  viewMode: viewModeSchema,
}).passthrough().refine(
  (data) => {
    const violations = rejectForbiddenFields(data as unknown as Record<string, unknown>);
    return violations.length === 0;
  },
  { message: 'Forbidden fields present in request body.' },
);

export const patchTutorStateV2Schema = z.object({
  sessionId: sessionIdSchema,
  operation: patchOperationSchema,
  value: z.unknown(),
  reason: reasonSchema,
  expectedStateVersion: expectedStateVersionSchema,
}).passthrough().refine(
  (data) => {
    const violations = rejectForbiddenFields(data as unknown as Record<string, unknown>);
    return violations.length === 0;
  },
  { message: 'Forbidden fields present in request body.' },
);

export const resetTutorStateSchema = z.object({
  sessionId: sessionIdSchema,
  scope: resetScopeSchema,
  reason: reasonSchema,
}).passthrough().refine(
  (data) => {
    const violations = rejectForbiddenFields(data as unknown as Record<string, unknown>);
    return violations.length === 0;
  },
  { message: 'Forbidden fields present in request body.' },
);

export const snapshotTutorStateSchema = z.object({
  sessionId: sessionIdSchema,
  reason: reasonSchema,
  includeSafePromptContext: z.boolean().optional().default(false),
}).passthrough().refine(
  (data) => {
    const violations = rejectForbiddenFields(data as unknown as Record<string, unknown>);
    return violations.length === 0;
  },
  { message: 'Forbidden fields present in request body.' },
);

export const validateTutorStateSchema = z.object({
  sessionId: sessionIdSchema,
  state: z.record(z.unknown()),
}).refine(
  (data) => {
    const violations = rejectForbiddenFields(data as unknown as Record<string, unknown>);
    return violations.length === 0;
  },
  { message: 'Forbidden fields present in request body.' },
);

export const getTutorStateV2QuerySchema = z.object({
  sessionId: sessionIdSchema,
  viewMode: viewModeSchema,
});

export const getTutorStateSummaryQuerySchema = z.object({
  sessionId: sessionIdSchema,
});

export const getTutorStateHistoryQuerySchema = z.object({
  sessionId: sessionIdSchema,
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

// ── Validation Helper ──

/**
 * Validate a patch operation's value against its schema.
 */
export function validatePatchOperationValue(
  operation: string,
  value: unknown,
): { ok: boolean; message?: string } {
  return validatePatchValue(operation, value);
}

/**
 * Check if a patch operation is safe for learner role.
 */
export function isLearnerSafePatchOperation(operation: string): boolean {
  return (LEARNER_SAFE_PATCH_OPERATIONS as readonly string[]).includes(operation);
}

/**
 * Check if a patch operation is accessible to teacher role.
 */
export function isTeacherPatchOperation(operation: string): boolean {
  return (TEACHER_PATCH_OPERATIONS as readonly string[]).includes(operation);
}

/**
 * Strip any forbidden fields from a request body (defense in depth).
 */
export function stripForbiddenFields(body: Record<string, unknown>): void {
  for (const field of FORBIDDEN_BODY_FIELDS) {
    delete body[field];
  }
}
