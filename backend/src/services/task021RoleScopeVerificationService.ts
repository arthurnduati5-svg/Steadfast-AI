import type {
  RoleScopeDecision,
  RoleScopeCheckRequest,
  SchoolActorRole,
  VerifiedSchoolIdentity,
} from './task021SchoolIntegrationContracts';
import { isAdminInternalRole, nowISO } from './task021SchoolIntegrationContracts';
import { findMappingByTutorLearnerId } from './task021SchoolIdentityMappingService';

const STUDENT_SELF_SCOPED_OPERATIONS = new Set([
  'read',
  'write',
  'update',
  'export',
]);

const TEACHER_SCOPED_CATEGORIES = new Set([
  'teacher_safe_summary',
  'learning_dashboard',
  'class_progress',
  'student_skill_summary',
  'revision_due',
  'next_actions',
]);

const ADMIN_INTERNAL_CATEGORIES = new Set([
  'audit',
  'diagnose',
  'governance_review',
  'rate_limit_admin',
  'operations_diagnostics',
]);

const SAFEGUARDING_CATEGORIES = new Set([
  'safeguarding_metadata',
  'safeguarding_review',
]);

const ROLE_RESOURCE_CATEGORIES: Record<SchoolActorRole, Set<string>> = {
  student: new Set([
    'learner_session',
    'learner_conversation',
    'learner_progress',
    'learner_preference',
    'learner_privacy_summary',
    'learner_evidence',
    'learner_challenge',
    'learner_remediation',
    'self_export',
  ]),
  teacher: new Set([
    'teacher_safe_summary',
    'learning_dashboard',
    'class_progress',
    'student_skill_summary',
    'revision_due',
    'next_actions',
    'teacher_intervention',
    'teacher_report_audit',
  ]),
  school_admin: new Set([
    'teacher_safe_summary',
    'learning_dashboard',
    'governance_review',
    'audit',
    'diagnose',
    'operations_diagnostics',
    'rate_limit_admin',
    'school_roster',
    'school_export',
    'school_deletion',
  ]),
  safeguarding_officer: new Set([
    'safeguarding_metadata',
    'safeguarding_review',
    'safeguarding_report',
    'safeguarding_alert',
  ]),
  system_admin: new Set([
    'audit',
    'diagnose',
    'governance_review',
    'operations_diagnostics',
    'rate_limit_admin',
    'system_config',
    'security_check',
  ]),
  internal_operator: new Set([
    'audit',
    'diagnose',
    'operations_diagnostics',
    'rate_limit_admin',
  ]),
  unknown: new Set([]),
};

export async function verifyRoleScope(
  identity: VerifiedSchoolIdentity,
  request: RoleScopeCheckRequest,
): Promise<RoleScopeDecision> {
  const role = identity.role;

  if (role === 'unknown') {
    return denyDecision(role, request, ['unknown_role_denied']);
  }

  const allowedCategories = ROLE_RESOURCE_CATEGORIES[role];
  if (!allowedCategories.has(request.resourceCategory)) {
    return denyDecision(role, request, [
      'role_not_authorized_for_resource',
      `category:${request.resourceCategory}`,
    ]);
  }

  if (role === 'student') {
    if (!STUDENT_SELF_SCOPED_OPERATIONS.has(request.action)) {
      return denyDecision(role, request, ['student_action_not_allowed', `action:${request.action}`]);
    }

    if (request.targetTutorLearnerId) {
      const valid = await validateStudentSelfScope(identity, request.targetTutorLearnerId);
      if (!valid) {
        return denyDecision(role, request, ['cross_student_access_denied', 'student_can_only_access_own_context']);
      }
    }
  }

  if (role === 'teacher') {
    if (!TEACHER_SCOPED_CATEGORIES.has(request.resourceCategory)) {
      return denyDecision(role, request, ['teacher_resource_not_allowed']);
    }
  }

  if (role === 'safeguarding_officer') {
    if (!SAFEGUARDING_CATEGORIES.has(request.resourceCategory)) {
      return denyDecision(role, request, ['safeguarding_officer_scope_restricted']);
    }
  }

  if (request.targetSchoolId && request.targetSchoolId !== identity.schoolId) {
    return denyDecision(role, request, ['cross_school_access_denied']);
  }

  return {
    allowed: true,
    role,
    action: request.action,
    resourceCategory: request.resourceCategory,
    scope: `${role}_allowed`,
    reasonCodes: ['role_scope_allowed'],
    privacyMetadata: {
      verifiedAt: nowISO(),
      roleScope: role,
    },
  };
}

async function validateStudentSelfScope(
  identity: VerifiedSchoolIdentity,
  targetTutorLearnerId: string,
): Promise<boolean> {
  if (identity.tutorLearnerId === targetTutorLearnerId) return true;

  const mapping = await findMappingByTutorLearnerId(targetTutorLearnerId);
  if (!mapping) return false;
  return mapping.externalUserId === identity.externalUserId && mapping.schoolId === identity.schoolId;
}

function denyDecision(
  role: SchoolActorRole,
  request: RoleScopeCheckRequest,
  reasonCodes: string[],
): RoleScopeDecision {
  return {
    allowed: false,
    role,
    action: request.action,
    resourceCategory: request.resourceCategory,
    scope: 'denied',
    reasonCodes,
    privacyMetadata: { deniedAt: nowISO() },
  };
}
