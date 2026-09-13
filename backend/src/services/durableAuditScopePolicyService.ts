// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Audit Scope Policy Service v1
// Builds actor scope from identifiers and authorizes audit
// queries. All actor/student/school/class IDs are hashed.
// Missing scope fails closed. Cross-school queries denied.
// ─────────────────────────────────────────────────────────────

import type { DurableAuditActor, DurableAuditQueryFilter } from '../contracts/durableAuditEventContracts';
import { hashDurableAuditIdentifier } from './durableAuditRedactionService';
import { canActorTypeViewVisibility } from '../contracts/auditVisibilityContracts';

/**
 * Build an actor scope object with hashed identifiers.
 */
export function buildAuditActorScope(input: {
  actorType: DurableAuditActor['actorType'];
  actorId?: string | null;
  studentId?: string | null;
  schoolId?: string | null;
  classId?: string | null;
}): DurableAuditActor {
  return {
    actorType: input.actorType || 'unknown',
    actorIdHash: hashDurableAuditIdentifier(input.actorId),
    studentIdHash: hashDurableAuditIdentifier(input.studentId),
    schoolIdHash: hashDurableAuditIdentifier(input.schoolId),
    classIdHash: hashDurableAuditIdentifier(input.classId),
  };
}

/**
 * Authorize an audit query. Returns whether the requester is
 * allowed to execute the query and a sanitized filter if permitted.
 */
export function authorizeAuditQuery(input: {
  requesterActorType: DurableAuditActor['actorType'];
  requesterId?: string | null;
  requesterSchoolId?: string | null;
  filter: DurableAuditQueryFilter;
}): {
  allowed: boolean;
  reason: 'allowed' | 'missing_scope' | 'forbidden_scope' | 'visibility_not_allowed';
  sanitizedFilter?: DurableAuditQueryFilter;
} {
  const { requesterActorType, requesterSchoolId, filter } = input;

  // Must have an actor type
  if (!requesterActorType || requesterActorType === 'unknown') {
    return { allowed: false, reason: 'missing_scope' };
  }

  // Learners must have a student ID
  if (requesterActorType === 'student' && !input.requesterId) {
    return { allowed: false, reason: 'missing_scope' };
  }

  // Teachers/admins must have a school ID
  if ((requesterActorType === 'teacher' || requesterActorType === 'admin') && !requesterSchoolId) {
    return { allowed: false, reason: 'missing_scope' };
  }

  // Build sanitized filter — always enforce school scope for teacher/admin
  const sanitizedFilter: DurableAuditQueryFilter = { ...filter };

  if (requesterSchoolId) {
    sanitizedFilter.schoolId = requesterSchoolId;
  }

  // Learners can only query their own student scope
  if (requesterActorType === 'student') {
    if (filter.studentId && filter.studentId !== input.requesterId) {
      return { allowed: false, reason: 'forbidden_scope' };
    }
    sanitizedFilter.studentId = input.requesterId || undefined;
  }

  // Teachers cannot query safeguarding_only or security_only visibility
  if (requesterActorType === 'teacher') {
    if (filter.visibility === 'safeguarding_only' || filter.visibility === 'security_only') {
      return { allowed: false, reason: 'visibility_not_allowed' };
    }
  }

  // Students can only see learner_safe events
  if (requesterActorType === 'student') {
    if (!canActorTypeViewVisibility('student', filter.visibility || 'learner_safe')) {
      return { allowed: false, reason: 'visibility_not_allowed' };
    }
    if (filter.visibility && filter.visibility !== 'learner_safe') {
      return { allowed: false, reason: 'visibility_not_allowed' };
    }
  }

  // Bound limit
  if (sanitizedFilter.limit === undefined || sanitizedFilter.limit < 1) {
    sanitizedFilter.limit = 50;
  } else if (sanitizedFilter.limit > 200) {
    sanitizedFilter.limit = 200;
  }

  return {
    allowed: true,
    reason: 'allowed',
    sanitizedFilter,
  };
}
