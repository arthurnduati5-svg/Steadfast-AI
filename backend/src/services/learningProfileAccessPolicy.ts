export interface AccessRequest {
  actorId: string;
  actorSchoolId: string;
  actorRole: string;
  targetStudentId?: string;
  targetSchoolId?: string;
  targetClassId?: string;
  actorClassIds?: string[];
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  scope?: 'self' | 'teacher_assigned' | 'teacher_same_school' | 'admin_same_school' | 'system';
}

export function canStudentReadOwnProfile(
  actorId: string,
  targetStudentId: string,
): AccessDecision {
  if (actorId === targetStudentId) {
    return { allowed: true, scope: 'self' };
  }
  return { allowed: false, reason: 'cross_student_forbidden' };
}

export function canTeacherReadStudentProfile(
  actor: AccessRequest,
): AccessDecision {
  // Must have same school
  if (!actor.targetSchoolId || actor.actorSchoolId !== actor.targetSchoolId) {
    return { allowed: false, reason: 'cross_school_forbidden' };
  }

  // Check class scope if teacher has assigned classes
  if (actor.targetClassId && actor.actorClassIds && actor.actorClassIds.length > 0) {
    if (!actor.actorClassIds.includes(actor.targetClassId)) {
      return { allowed: false, reason: 'teacher_out_of_scope' };
    }
    return { allowed: true, scope: 'teacher_assigned' };
  }

  // Teacher within same school can see safe summaries
  return { allowed: true, scope: 'teacher_same_school' };
}

export function canAdminReadProfileDiagnostics(
  actor: AccessRequest,
): AccessDecision {
  if (!actor.targetSchoolId || actor.actorSchoolId !== actor.targetSchoolId) {
    return { allowed: false, reason: 'cross_school_forbidden' };
  }
  return { allowed: true, scope: 'admin_same_school' };
}

export function enforceSameSchoolScope(
  actorSchoolId: string,
  targetSchoolId: string,
): AccessDecision {
  if (actorSchoolId !== targetSchoolId) {
    return { allowed: false, reason: 'cross_school_forbidden' };
  }
  return { allowed: true };
}

export function enforceClassOrTeacherScopeIfAvailable(
  actor: AccessRequest,
): AccessDecision {
  if (actor.actorRole === 'teacher' && actor.actorClassIds && actor.actorClassIds.length > 0) {
    if (actor.targetClassId && !actor.actorClassIds.includes(actor.targetClassId)) {
      return { allowed: false, reason: 'teacher_out_of_class_scope' };
    }
  }
  return { allowed: true };
}

export function resolveProfileAccess(
  actor: AccessRequest,
): AccessDecision {
  const { actorRole, actorId, targetStudentId } = actor;

  if (!actorRole) {
    return { allowed: false, reason: 'missing_auth' };
  }

  if (actorRole === 'student') {
    return canStudentReadOwnProfile(actorId, targetStudentId || '');
  }

  if (actorRole === 'teacher') {
    return canTeacherReadStudentProfile(actor);
  }

  if (actorRole === 'admin') {
    return canAdminReadProfileDiagnostics(actor);
  }

  return { allowed: false, reason: 'unknown_role' };
}
