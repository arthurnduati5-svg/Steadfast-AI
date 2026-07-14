/**
 * MOCK/DEV-ONLY context extractor for question bank routes.
 *
 * This is NOT a production school integration auth middleware.
 * It extracts actor context from request headers for development/testing purposes.
 *
 * Production deployments MUST replace this with real school-context auth middleware.
 */

import type { Request } from 'express';
import type { AssessmentCommandContext, AssessmentActorRole } from '../../../assessment/contracts/assessmentCommandContext';

export function extractMockAssessmentActorContext(req: Request): AssessmentCommandContext {
  const schoolId = String(req.headers['x-school-id'] || req.body?.schoolId || '');
  const actorId = String(req.headers['x-actor-id'] || req.body?.createdByActorId || 'mock-actor');
  const rawRole = String(req.headers['x-actor-role'] || req.body?.createdByRole || 'teacher');
  const correlationId = String(req.headers['x-correlation-id'] || req.body?.correlationId || req.body?.requestId || '');
  const idempotencyKey = String(req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '');

  if (!schoolId) {
    throw new Error('SCHOOL_CONTEXT_REQUIRED');
  }

  const safeRoles: AssessmentActorRole[] = ['student', 'teacher', 'lead_teacher', 'department_head', 'admin', 'parent', 'system_marking', 'system_job', 'support_owner'];
  const safeRole: AssessmentActorRole = (safeRoles as readonly string[]).includes(rawRole)
    ? (rawRole as AssessmentActorRole)
    : 'teacher';

  return {
    schoolId,
    actorId,
    actorRole: safeRole,
    correlationId: correlationId || `mock-${Date.now()}`,
    idempotencyKey: idempotencyKey || `mock-${Date.now()}`,
    source: 'api',
    now: new Date().toISOString(),
  };
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
