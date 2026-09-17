/**
 * Verified assessment actor-context adapter (production).
 *
 * P0-1: replaces the dev-only `extractMockAssessmentActorContext`, which derived
 * authoritative actor/school identity from request-controlled input
 * (`x-school-id` / `x-actor-id` / `x-actor-role` headers and body fields).
 *
 * Source of truth:
 *   schoolAuthMiddleware
 *   → requireVerifiedSchoolContext
 *   → req.verifiedSchoolIdentity
 *   → AssessmentCommandContext
 *   → existing assessment policy / enforcement services
 *
 * Security invariants:
 * - schoolId comes ONLY from req.verifiedSchoolIdentity.schoolId.
 * - actorId comes ONLY from req.verifiedSchoolIdentity.externalUserId.
 * - actorRole comes ONLY from an explicit, fail-closed mapping of the verified role.
 * - Caller-supplied school/actor/role fields (headers/body/query) are NEVER
 *   authoritative. A caller schoolId that disagrees with verified identity is
 *   rejected (fail closed) instead of merged or trusted.
 * - Optional classId/subjectId are derived ONLY from verified context.
 *
 * Compatibility:
 * - Legacy wire fields (`body.schoolId`, `x-school-id`, `body.createdByActorId`,
 *   `body.createdByRole`, `x-actor-id`, `x-actor-role`) may still be present on
 *   the wire. They are ignored as authority (or rejected on school mismatch).
 *   Business/resource payloads are otherwise untouched.
 */

import type { Request } from 'express';
import { randomUUID } from 'crypto';
import type {
  AssessmentActorRole,
  AssessmentCommandContext,
} from '../../../assessment/contracts/assessmentCommandContext';
import type { VerifiedSchoolIdentity } from '../../../../services/task021SchoolIntegrationContracts';

/**
 * Explicit, evidence-backed mapping from verified school roles to assessment
 * command roles. Only equivalences established by existing assessment policy
 * are accepted:
 * - student → student (identity; authorization still enforced per command)
 * - teacher → teacher (blueprint create + question flows allow teacher)
 * - school_admin → admin (blueprint create/approve + approval flows use admin)
 *
 * Every other verified role (safeguarding_officer, system_admin,
 * internal_operator, unknown, and anything unrecognized) FAILS CLOSED with a
 * stable POLICY_BLOCKED error. In particular:
 * - unknown is never mapped to an allowed assessment role;
 * - there is no permissive default (no silent fallback to teacher);
 * - no silent elevation (e.g. teacher → admin, school_admin → support_owner).
 */
const VERIFIED_TO_ASSESSMENT_ROLE: Readonly<Record<string, AssessmentActorRole>> = {
  student: 'student',
  teacher: 'teacher',
  school_admin: 'admin',
};

function mapVerifiedRoleToAssessmentRole(verifiedRole: string): AssessmentActorRole {
  const mapped = VERIFIED_TO_ASSESSMENT_ROLE[verifiedRole];
  if (!mapped) {
    throw new Error(
      `POLICY_BLOCKED: verified role '${verifiedRole}' has no assessment mapping`,
    );
  }
  return mapped;
}

function readCallerSchoolIdCandidates(req: Request): string[] {
  const candidates: string[] = [];
  const headerSchool = req.headers['x-school-id'];
  if (typeof headerSchool === 'string' && headerSchool.trim().length > 0) {
    candidates.push(headerSchool.trim());
  }
  const bodySchool = (req.body as Record<string, unknown> | undefined)?.['schoolId'];
  if (typeof bodySchool === 'string' && bodySchool.trim().length > 0) {
    candidates.push(bodySchool.trim());
  }
  const querySchool = (req.query as Record<string, unknown> | undefined)?.['schoolId'];
  if (typeof querySchool === 'string' && querySchool.trim().length > 0) {
    candidates.push(querySchool.trim());
  }
  return candidates;
}

function getRequestId(req: Request): string {
  const owned = (req as unknown as Record<string, unknown>)['requestId'];
  if (typeof owned === 'string' && owned.trim().length > 0) return owned;
  const header = req.headers['x-request-id'];
  if (typeof header === 'string' && header.trim().length > 0) return header.trim();
  return randomUUID();
}

function getCorrelationId(req: Request, fallbackRequestId: string): string {
  const header = req.headers['x-correlation-id'];
  if (typeof header === 'string' && header.trim().length > 0) return header.trim();
  const body = req.body as Record<string, unknown> | undefined;
  const bodyCorrelation = body?.['correlationId'];
  if (typeof bodyCorrelation === 'string' && bodyCorrelation.trim().length > 0) {
    return bodyCorrelation.trim();
  }
  const bodyRequest = body?.['requestId'];
  if (typeof bodyRequest === 'string' && bodyRequest.trim().length > 0) {
    return bodyRequest.trim();
  }
  return fallbackRequestId;
}

function getIdempotencyKey(req: Request): string {
  const header = req.headers['x-idempotency-key'];
  if (typeof header === 'string') return header;
  const body = req.body as Record<string, unknown> | undefined;
  const bodyKey = body?.['idempotencyKey'];
  return typeof bodyKey === 'string' ? bodyKey : '';
}

/**
 * Build an AssessmentCommandContext exclusively from verified school identity.
 *
 * @throws SCHOOL_CONTEXT_REQUIRED when req.verifiedSchoolIdentity is absent or
 *         lacks required verified fields (fail closed).
 * @throws SCHOOL_SCOPE_MISMATCH when a caller-supplied schoolId disagrees with
 *         verified identity (fail closed; never merge or trust the caller value).
 * @throws POLICY_BLOCKED when the verified role has no established assessment
 *         mapping (fail closed; no permissive default).
 */
export function extractVerifiedAssessmentActorContext(req: Request): AssessmentCommandContext {
  const identity = req.verifiedSchoolIdentity as VerifiedSchoolIdentity | undefined;

  if (!identity || identity.verified !== true) {
    throw new Error('SCHOOL_CONTEXT_REQUIRED: verified school identity is required');
  }

  const schoolId = typeof identity.schoolId === 'string' ? identity.schoolId.trim() : '';
  const actorId = typeof identity.externalUserId === 'string' ? identity.externalUserId.trim() : '';

  if (!schoolId) {
    throw new Error('SCHOOL_CONTEXT_REQUIRED: verified school identity has no school');
  }
  if (!actorId) {
    throw new Error('SCHOOL_CONTEXT_REQUIRED: verified school identity has no actor');
  }

  // Caller schoolId must never override verified identity. Reject mismatches.
  for (const candidate of readCallerSchoolIdCandidates(req)) {
    if (candidate !== schoolId) {
      throw new Error('SCHOOL_SCOPE_MISMATCH: caller school does not match verified school context');
    }
  }

  const actorRole = mapVerifiedRoleToAssessmentRole(identity.role);

  const requestId = getRequestId(req);
  const correlationId = getCorrelationId(req, requestId);
  const idempotencyKey = getIdempotencyKey(req);

  const context: AssessmentCommandContext = {
    schoolId,
    actorId,
    actorRole,
    correlationId: correlationId || requestId,
    idempotencyKey: idempotencyKey || '',
    source: 'api',
    now: new Date().toISOString(),
  };

  if (typeof requestId === 'string' && requestId.length > 0) {
    context.requestId = requestId;
  }
  // Optional scope ONLY from trusted verified context — never from the request.
  if (typeof identity.classId === 'string' && identity.classId.trim().length > 0) {
    context.classId = identity.classId;
  }
  if (typeof identity.subjectId === 'string' && identity.subjectId.trim().length > 0) {
    context.subjectId = identity.subjectId;
  }

  return context;
}

export function createSafeResponseEnvelope(params: {
  ok: boolean;
  requestId: string;
  correlationId: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: string;
  nextAllowedActions?: string[];
  data?: unknown;
  errorCode?: string;
}): Record<string, unknown> {
  return {
    ok: params.ok,
    requestId: params.requestId,
    correlationId: params.correlationId,
    resourceId: params.resourceId ?? null,
    resourceVersion: params.resourceVersion ?? null,
    status: params.status ?? 'ok',
    safeMessage: params.safeMessage ?? '',
    reasonCode: params.reasonCode ?? '',
    policyDecision: params.policyDecision ?? null,
    nextAllowedActions: params.nextAllowedActions ?? [],
    data: params.data ?? null,
    errorCode: params.errorCode ?? null,
  };
}
