import type { Request } from 'express';

/**
 * R8-G verified actor identity.
 *
 * Backend-owned single source for authoritative caller identity on routes
 * mounted behind `schoolAuthMiddleware` (which sets `req.user`) and
 * `requireVerifiedSchoolContext` (which sets `req.schoolId` /
 * `req.verifiedSchoolIdentity`).
 *
 * LAW: verified server-side context always wins. Caller-controlled
 * transports (query, body, x-* headers) must never override verified
 * identity for authentication, school scope, or role authorization.
 * Missing verified identity yields '' and downstream fail-closed denial —
 * never a fallback that trusts the client.
 */

export interface VerifiedActorContext {
  schoolId: string;
  actorId: string;
  role: string;
}

export function getVerifiedSchoolId(req: Request): string {
  const r = req as unknown as Record<string, unknown>;
  const schoolId = r['schoolId'];
  if (typeof schoolId === 'string' && schoolId.trim() !== '') return schoolId;
  const identity = r['verifiedSchoolIdentity'] as { schoolId?: unknown } | undefined;
  if (identity && typeof identity.schoolId === 'string' && identity.schoolId.trim() !== '') {
    return identity.schoolId;
  }
  const user = r['user'] as { schoolId?: unknown } | undefined;
  if (user && typeof user.schoolId === 'string' && user.schoolId.trim() !== '') {
    return user.schoolId;
  }
  return '';
}

export function getVerifiedActorId(req: Request): string {
  const user = (req as unknown as Record<string, unknown>)['user'] as
    | { id?: unknown }
    | undefined;
  if (user && typeof user.id === 'string' && user.id.trim() !== '') return user.id;
  return '';
}

export function getVerifiedActorRole(req: Request): string {
  const user = (req as unknown as Record<string, unknown>)['user'] as
    | { role?: unknown }
    | undefined;
  if (user && typeof user.role === 'string' && user.role.trim() !== '') return user.role;
  return '';
}

export function buildVerifiedActorContext(req: Request): VerifiedActorContext {
  return {
    schoolId: getVerifiedSchoolId(req),
    actorId: getVerifiedActorId(req),
    role: getVerifiedActorRole(req),
  };
}

export type LearnerScopeVerdict =
  | { ok: true }
  | { ok: false; status: 401 | 403; code: string; reasonCodes: string[] };

/**
 * Enforce verified learner/school scope for a caller-addressed target.
 *
 * - student role: target student must equal the verified caller and the
 *   target school must equal the verified school (cross-student and
 *   cross-school blocked).
 * - teacher/admin/system roles: target school must equal the verified
 *   school (cross-school blocked); addressing any learner in-school allowed.
 * - missing verified identity or unknown role: denied (fail-closed).
 */
export function enforceVerifiedLearnerScope(
  req: Request,
  targetStudentId: string | undefined,
  targetSchoolId: string | undefined,
): LearnerScopeVerdict {
  const schoolId = getVerifiedSchoolId(req);
  const actorId = getVerifiedActorId(req);
  const role = getVerifiedActorRole(req);

  if (!schoolId || !actorId) {
    return {
      ok: false,
      status: 401,
      code: 'VERIFIED_IDENTITY_REQUIRED',
      reasonCodes: ['missing_verified_identity'],
    };
  }

  if (!targetSchoolId || targetSchoolId !== schoolId) {
    return {
      ok: false,
      status: 403,
      code: 'CROSS_SCHOOL_BLOCKED',
      reasonCodes: ['cross_school_blocked'],
    };
  }

  if (role === 'student' || role === 'learner') {
    if (!targetStudentId || targetStudentId !== actorId) {
      return {
        ok: false,
        status: 403,
        code: 'CROSS_STUDENT_BLOCKED',
        reasonCodes: ['cross_student_blocked'],
      };
    }
    return { ok: true };
  }

  if (role === 'teacher' || role === 'school_admin' || role === 'admin' || role === 'system' || role === 'internal_operator') {
    return { ok: true };
  }

  return {
    ok: false,
    status: 403,
    code: 'ROLE_NOT_ALLOWED',
    reasonCodes: ['blocked_by_policy'],
  };
}
