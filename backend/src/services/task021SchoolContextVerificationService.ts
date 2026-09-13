import type {
  SchoolIntegrationContext,
  VerifiedSchoolIdentity,
  SchoolIntegrationErrorCode,
  SchoolScopeSnapshot,
} from './task021SchoolIntegrationContracts';
import { normalizeRole, nowISO } from './task021SchoolIntegrationContracts';
import { validateSchoolIntegrationContext } from './task021SchoolIntegrationTokenValidationService';

export type ContextVerificationResult =
  | { ok: true; identity: VerifiedSchoolIdentity }
  | { ok: false; error: SchoolIntegrationErrorCode; reasonCodes: string[] };

export function verifySchoolContext(
  context: SchoolIntegrationContext,
  correlationId?: string,
  requestId?: string,
): ContextVerificationResult {
  const validation = validateSchoolIntegrationContext(context);
  if (!validation.valid) {
    return {
      ok: false,
      error: validation.errorCode || 'internal_error',
      reasonCodes: validation.reasonCodes,
    };
  }

  const role = validation.role!;
  const schoolId = validation.schoolId!;
  const externalUserId = validation.externalUserId!;

  const scope: SchoolScopeSnapshot = {
    schoolId,
    classIds: context.classId ? [context.classId] : [],
    subjectIds: context.subjectId ? [context.subjectId] : [],
    teacherAssignmentIds: [],
    enrollmentStatus: 'active',
  };

  const identity: VerifiedSchoolIdentity = {
    verified: true,
    schoolId,
    externalUserId,
    role,
    externalStudentId: context.externalStudentId,
    externalTeacherId: context.externalTeacherId,
    classId: context.classId,
    subjectId: context.subjectId,
    schoolYear: context.schoolYear,
    term: context.term,
    scope,
    reasonCodes: ['school_context_verified'],
    privacyMetadata: {
      verifiedAt: nowISO(),
      correlationId,
      requestId,
    },
  };

  return { ok: true, identity };
}
