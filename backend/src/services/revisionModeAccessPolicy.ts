export type RevisionModeRole = 'student' | 'teacher' | 'admin' | 'system';

export interface RevisedIdentityContext {
  schoolId: string;
  role: RevisionModeRole;
  studentId?: string;
  teacherId?: string;
  userId?: string;
}

export function checkRevisionModeAccess(
  identity: RevisedIdentityContext,
  targetSchoolId: string,
  targetStudentId?: string,
): { allowed: boolean; reason?: string } {
  if (!identity.schoolId) {
    return { allowed: false, reason: 'Missing school context' };
  }
  if (!identity.studentId && !identity.teacherId && !identity.userId) {
    return { allowed: false, reason: 'Missing learner/student context' };
  }

  if (identity.schoolId !== targetSchoolId) {
    return { allowed: false, reason: 'Cross-school access blocked' };
  }

  switch (identity.role) {
    case 'student': {
      if (!identity.studentId) {
        return { allowed: false, reason: 'Student identity not resolved' };
      }
      if (targetStudentId && identity.studentId !== targetStudentId) {
        return { allowed: false, reason: 'Student can only access own revision session' };
      }
      return { allowed: true };
    }
    case 'teacher': {
      if (targetStudentId) {
        return { allowed: true, reason: 'Teacher access with same-school scope' };
      }
      return { allowed: true, reason: 'Teacher access with same-school scope' };
    }
    case 'admin': {
      return { allowed: true, reason: 'Admin diagnostic access' };
    }
    case 'system': {
      return { allowed: true, reason: 'System internal operation' };
    }
    default:
      return { allowed: false, reason: `Unknown role: ${identity.role}` };
  }
}
