import type {
  ExternalSchoolIdentityPayload,
  SchoolContextVerificationResult,
  TutorTeacherScopeMapping,
  TeacherScopeDecision,
} from '../contracts/schoolSystemBridgeContracts';
import { SCHOOL_CONNECTOR_SAFE_IDENTIFIERS } from '../contracts/schoolSystemBridgeContracts';
import { normalizeRole, nowISO } from './task021SchoolIntegrationContracts';

export function mapTeacherScope(
  verifiedPayload: ExternalSchoolIdentityPayload,
  verificationResult: SchoolContextVerificationResult,
  allowedClassIds: string[],
  allowedSubjectIds: string[],
  allowedStudentIds: string[],
): TutorTeacherScopeMapping {
  if (!verificationResult.verified) {
    return scopeBlocked('blocked_missing_verified_identity', ['identity_not_verified'], verifiedPayload);
  }

  const normalizedRole = normalizeRole(verifiedPayload.role);
  if (normalizedRole !== 'teacher') {
    return scopeBlocked('blocked_not_teacher', [`role_not_teacher:${normalizedRole}`], verifiedPayload);
  }

  if (!allowedClassIds || allowedClassIds.length === 0) {
    return scopeBlocked('blocked_no_class_scope', ['no_class_scope_defined'], verifiedPayload);
  }

  if (!allowedSubjectIds || allowedSubjectIds.length === 0) {
    return scopeBlocked('blocked_no_subject_scope', ['no_subject_scope_defined'], verifiedPayload);
  }

  return {
    teacherId: verifiedPayload.externalTeacherId || verifiedPayload.externalUserId,
    schoolId: verifiedPayload.schoolId,
    externalUserId: verifiedPayload.externalUserId,
    allowedClassIds,
    allowedSubjectIds,
    allowedStudentIds,
    scopeDecision: 'scope_verified',
    reasonCodes: ['teacher_scope_verified', 'class_scope_assigned', 'subject_scope_assigned'],
    privacyMetadata: {
      verifiedAt: nowISO(),
      classCount: allowedClassIds.length,
      subjectCount: allowedSubjectIds.length,
      studentCount: allowedStudentIds.length,
    },
  };
}

export function verifyStudentInTeacherScope(
  scope: TutorTeacherScopeMapping,
  studentId: string,
): { allowed: boolean; reasonCodes: string[] } {
  if (scope.scopeDecision !== 'scope_verified') {
    return { allowed: false, reasonCodes: ['teacher_scope_not_verified'] };
  }

  if (!scope.allowedStudentIds.includes(studentId)) {
    return {
      allowed: false,
      reasonCodes: ['student_outside_teacher_scope', `student_id:${studentId}`],
    };
  }

  return { allowed: true, reasonCodes: ['student_in_teacher_scope'] };
}

export function verifyClassInTeacherScope(
  scope: TutorTeacherScopeMapping,
  classId: string,
): { allowed: boolean; reasonCodes: string[] } {
  if (scope.scopeDecision !== 'scope_verified') {
    return { allowed: false, reasonCodes: ['teacher_scope_not_verified'] };
  }

  if (!scope.allowedClassIds.includes(classId)) {
    return {
      allowed: false,
      reasonCodes: ['class_outside_teacher_scope', `class_id:${classId}`],
    };
  }

  return { allowed: true, reasonCodes: ['class_in_teacher_scope'] };
}

function scopeBlocked(
  decision: TeacherScopeDecision,
  reasonCodes: string[],
  payload: ExternalSchoolIdentityPayload,
): TutorTeacherScopeMapping {
  return {
    teacherId: payload.externalTeacherId || payload.externalUserId,
    schoolId: payload.schoolId,
    externalUserId: payload.externalUserId,
    allowedClassIds: [],
    allowedSubjectIds: [],
    allowedStudentIds: [],
    scopeDecision: decision,
    reasonCodes,
    privacyMetadata: { verifiedAt: nowISO() },
  };
}
