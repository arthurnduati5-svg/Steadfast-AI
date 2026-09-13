import type {
  SchoolIntegrationContext,
  SchoolIntegrationTokenValidationResult,
  SchoolActorRole,
  SchoolIntegrationErrorCode,
} from './task021SchoolIntegrationContracts';
import { normalizeRole, nowISO } from './task021SchoolIntegrationContracts';

const VALID_SCHOOL_ISSUERS = new Set<string>();
const VALID_SCHOOL_AUDIENCES = new Set<string>();

export function configureSchoolIntegrationIssuers(issuers: string[]): void {
  VALID_SCHOOL_ISSUERS.clear();
  for (const iss of issuers) VALID_SCHOOL_ISSUERS.add(iss);
}

export function configureSchoolIntegrationAudiences(audiences: string[]): void {
  VALID_SCHOOL_AUDIENCES.clear();
  for (const aud of audiences) VALID_SCHOOL_AUDIENCES.add(aud);
}

function errorResult(errorCode: SchoolIntegrationErrorCode): SchoolIntegrationTokenValidationResult {
  return { valid: false, reasonCodes: [errorCode], errorCode };
}

export function validateSchoolIntegrationContext(
  context: SchoolIntegrationContext,
): SchoolIntegrationTokenValidationResult {
  if (!context.schoolId || context.schoolId.trim().length === 0) {
    return errorResult('missing_school_id');
  }

  if (!context.externalUserId || context.externalUserId.trim().length === 0) {
    return errorResult('missing_external_user_id');
  }

  const normalizedRole = normalizeRole(context.role);
  if (normalizedRole === 'unknown') {
    return errorResult('unknown_role');
  }

  if (context.expiresAt) {
    const expiry = new Date(context.expiresAt);
    if (isNaN(expiry.getTime()) || expiry < new Date()) {
      return errorResult('expired_context');
    }
  }

  if (context.issuer && VALID_SCHOOL_ISSUERS.size > 0) {
    if (!VALID_SCHOOL_ISSUERS.has(context.issuer)) {
      return errorResult('mismatched_issuer');
    }
  }

  if (context.audience && VALID_SCHOOL_AUDIENCES.size > 0) {
    if (!VALID_SCHOOL_AUDIENCES.has(context.audience)) {
      return errorResult('mismatched_audience');
    }
  }

  if (context.signature !== undefined && context.signature === '') {
    return errorResult('invalid_signature');
  }

  if (normalizedRole === 'student' && !context.externalStudentId) {
    return errorResult('missing_external_user_id');
  }

  return {
    valid: true,
    schoolId: context.schoolId.trim(),
    externalUserId: context.externalUserId.trim(),
    role: normalizedRole,
    reasonCodes: ['context_validated'],
  };
}
