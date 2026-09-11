import type {
  ExternalSchoolIdentityPayload,
  SchoolContextVerificationResult,
  TutorAdminScopeMapping,
  AdminScopeDecision,
} from '../contracts/schoolSystemBridgeContracts';
import { normalizeRole, nowISO } from './task021SchoolIntegrationContracts';

export function mapSchoolAdminScope(
  verifiedPayload: ExternalSchoolIdentityPayload,
  verificationResult: SchoolContextVerificationResult,
): TutorAdminScopeMapping {
  if (!verificationResult.verified) {
    return adminBlocked('blocked_missing_verified_identity', ['identity_not_verified'], verifiedPayload);
  }

  const normalizedRole = normalizeRole(verifiedPayload.role);
  if (normalizedRole !== 'school_admin' && normalizedRole !== 'system_admin' && normalizedRole !== 'internal_operator') {
    return adminBlocked('blocked_not_school_admin', [`role_not_admin:${normalizedRole}`], verifiedPayload);
  }

  return {
    adminId: verifiedPayload.externalUserId,
    schoolId: verifiedPayload.schoolId,
    externalUserId: verifiedPayload.externalUserId,
    scopeDecision: 'admin_scope_verified',
    allowedSchoolIds: [verifiedPayload.schoolId],
    reasonCodes: ['admin_scope_verified', 'school_level_access_granted'],
    privacyMetadata: {
      verifiedAt: nowISO(),
      adminRole: normalizedRole,
      schoolId: verifiedPayload.schoolId,
    },
  };
}

export function verifyAdminSchoolScope(
  scope: TutorAdminScopeMapping,
  targetSchoolId: string,
): { allowed: boolean; reasonCodes: string[] } {
  if (scope.scopeDecision !== 'admin_scope_verified') {
    return { allowed: false, reasonCodes: ['admin_scope_not_verified'] };
  }

  if (!scope.allowedSchoolIds.includes(targetSchoolId)) {
    return {
      allowed: false,
      reasonCodes: ['admin_school_mismatch', `target_school:${targetSchoolId}`],
    };
  }

  return { allowed: true, reasonCodes: ['admin_school_scope_matches'] };
}

export function verifyAdminSecretVisibility(
  scope: TutorAdminScopeMapping,
): { allowed: boolean; reasonCodes: string[] } {
  return {
    allowed: false,
    reasonCodes: ['admin_secret_visibility_blocked', 'admins_must_not_access_secrets_or_credentials'],
  };
}

export function verifyAdminRawPrivateDataVisibility(
  scope: TutorAdminScopeMapping,
): { allowed: boolean; reasonCodes: string[] } {
  return {
    allowed: false,
    reasonCodes: ['admin_raw_private_data_visibility_blocked', 'admins_must_not_access_raw_student_chat'],
  };
}

function adminBlocked(
  decision: AdminScopeDecision,
  reasonCodes: string[],
  payload: ExternalSchoolIdentityPayload,
): TutorAdminScopeMapping {
  return {
    adminId: payload.externalUserId,
    schoolId: payload.schoolId,
    externalUserId: payload.externalUserId,
    scopeDecision: decision,
    allowedSchoolIds: [],
    reasonCodes,
    privacyMetadata: { verifiedAt: nowISO() },
  };
}
