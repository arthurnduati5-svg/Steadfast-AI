import type {
  ExternalSchoolIdentityPayload,
  SchoolContextVerificationResult,
  SchoolIdentityVerificationStatus,
} from '../contracts/schoolSystemBridgeContracts';
import { SCHOOL_CONNECTOR_SAFE_IDENTIFIERS } from '../contracts/schoolSystemBridgeContracts';
import { normalizeRole, nowISO } from './task021SchoolIntegrationContracts';

export function verifyExternalSchoolIdentity(
  payload: ExternalSchoolIdentityPayload,
): SchoolContextVerificationResult {
  if (!payload.schoolId || payload.schoolId.trim() === '') {
    return blockedResult('blocked_missing_school', ['school_id_missing']);
  }

  if (!payload.externalUserId || payload.externalUserId.trim() === '') {
    return blockedResult('blocked_missing_user', ['external_user_id_missing']);
  }

  if (!payload.role || payload.role.trim() === '') {
    return blockedResult('blocked_missing_role', ['role_missing']);
  }

  const normalizedRole = normalizeRole(payload.role);
  if (normalizedRole === 'unknown') {
    return blockedResult('blocked_invalid_role', ['role_not_recognized', `raw_role:${payload.role}`]);
  }

  if (payload.expiresAt) {
    const expires = new Date(payload.expiresAt);
    if (isNaN(expires.getTime()) || expires <= new Date()) {
      return blockedResult('blocked_expired_identity', ['identity_expired', `expires_at:${payload.expiresAt}`]);
    }
  }

  return {
    verified: true,
    schoolId: payload.schoolId,
    externalUserId: payload.externalUserId,
    role: normalizedRole,
    reasonCodes: ['school_context_verified'],
    verificationStatus: 'verified',
    privacyMetadata: {
      verifiedAt: nowISO(),
      roleSource: payload.role,
      classId: payload.classId || undefined,
      subjectId: payload.subjectId || undefined,
      schoolYear: payload.schoolYear || undefined,
      term: payload.term || undefined,
    },
  };
}

function blockedResult(
  status: SchoolIdentityVerificationStatus,
  reasonCodes: string[],
): SchoolContextVerificationResult {
  return {
    verified: false,
    verificationStatus: status,
    reasonCodes,
    privacyMetadata: { verifiedAt: nowISO(), blockedReason: status },
  };
}

export function isSchoolIdentityVerified(result: SchoolContextVerificationResult): result is SchoolContextVerificationResult & { verified: true; schoolId: string; externalUserId: string; role: import('../contracts/schoolSystemBridgeContracts').SchoolRoleClaim } {
  return result.verified === true && !!result.schoolId && !!result.externalUserId && !!result.role;
}

export function getMockVerifiedSchoolPayload(): ExternalSchoolIdentityPayload {
  return {
    externalUserId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalUserId,
    schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
    role: 'student',
    externalStudentId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalStudentId,
    classId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockClassId,
    subjectId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSubjectId,
    schoolYear: '2025-2026',
    term: 'term_1',
    issuedAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    issuer: 'mock-school-system',
    audience: 'steadfast-tutor',
  };
}
