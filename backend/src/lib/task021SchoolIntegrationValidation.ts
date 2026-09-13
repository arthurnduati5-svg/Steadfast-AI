import type {
  Task021SchoolIntegrationContext,
  Task021ExternalSchoolIdentity,
  Task021InternalTutorIdentity,
  Task021IdentityMapping,
  Task021RosterRecord,
  Task021RosterSyncBatch,
  Task021TeacherAssignment,
  Task021ParentLearnerLink,
  Task021RoleScopeDecision,
  Task021SchoolIntegrationQuery,
  Task021SchoolEntityType,
  Task021RosterRecordStatus,
  Task021IdentityMappingStatus,
  Task021ExternalIdentityProvider,
} from '../contracts/task021SchoolIntegrationContracts';
import {
  TASK021_FORBIDDEN_FIELDS,
} from '../contracts/task021SchoolIntegrationContracts';

const VALID_PROVIDERS: readonly string[] = [
  'school_sso', 'school_portal', 'manual_admin_seed', 'sis_export',
  'google_classroom_export', 'microsoft_education_export', 'csv_import',
  'mock_school_adapter', 'unknown',
];

const VALID_ENTITY_TYPES: readonly string[] = [
  'school', 'campus', 'academic_year', 'term', 'class', 'stream',
  'subject', 'teacher', 'student', 'parent', 'guardian', 'staff',
  'enrollment', 'teacher_assignment', 'parent_learner_link',
];

const VALID_ROSTER_STATUSES: readonly string[] = [
  'active', 'pending', 'inactive', 'disabled', 'graduated',
  'transferred', 'deleted', 'stale', 'conflict', 'unknown',
];

const VALID_MAPPING_STATUSES: readonly string[] = [
  'mapped', 'pending_mapping', 'mapping_conflict', 'unmapped',
  'disabled', 'stale', 'cross_school_rejected', 'blocked',
];

export interface Task021ValidationResult {
  valid: boolean;
  reasonCodes: string[];
}

function ok(): Task021ValidationResult {
  return { valid: true, reasonCodes: ['valid'] };
}

function fail(reasonCodes: string[]): Task021ValidationResult {
  return { valid: false, reasonCodes };
}

function failSingle(code: string): Task021ValidationResult {
  return { valid: false, reasonCodes: [code] };
}

export function validateTask021SchoolIntegrationContext(
  ctx: Partial<Task021SchoolIntegrationContext>,
): Task021ValidationResult {
  if (!ctx.schoolId || typeof ctx.schoolId !== 'string' || ctx.schoolId.trim().length === 0) {
    return failSingle('missing_school_id');
  }
  if (!ctx.externalUserId && !ctx.externalSubjectId) {
    return failSingle('missing_external_identity');
  }
  if (!ctx.provider) {
    return failSingle('missing_provider');
  }
  if (!VALID_PROVIDERS.includes(ctx.provider) && ctx.provider !== 'mock_school_adapter') {
    return failSingle('unsupported_provider');
  }
  if (!ctx.actorRole || typeof ctx.actorRole !== 'string') {
    return failSingle('missing_actor_role');
  }
  const normalizedRole = ctx.actorRole.toLowerCase().trim();
  const supportedRoles = ['student', 'teacher', 'parent', 'guardian', 'school_admin', 'safeguarding_officer', 'system_admin', 'internal_operator'];
  if (!supportedRoles.includes(normalizedRole)) {
    return failSingle('unsupported_role');
  }
  return ok();
}

export function validateTask021ExternalSchoolIdentity(
  identity: Partial<Task021ExternalSchoolIdentity>,
): Task021ValidationResult {
  if (!identity.schoolId) return failSingle('missing_school_id');
  if (!identity.externalUserId && !identity.externalSubjectId) return failSingle('missing_external_identity');
  if (!identity.provider) return failSingle('missing_provider');
  if (!VALID_PROVIDERS.includes(identity.provider)) return failSingle('unsupported_provider');
  if (!identity.actorRole) return failSingle('missing_actor_role');
  return ok();
}

export function validateTask021InternalTutorIdentity(
  identity: Partial<Task021InternalTutorIdentity>,
): Task021ValidationResult {
  if (!identity.schoolId) return failSingle('missing_school_id');
  if (!identity.role) return failSingle('missing_role');
  if (!identity.status) return failSingle('missing_status');
  return ok();
}

export function validateTask021IdentityMapping(
  mapping: Partial<Task021IdentityMapping>,
): Task021ValidationResult {
  if (!mapping.schoolId) return failSingle('missing_school_id');
  if (!mapping.externalUserId) return failSingle('missing_external_user_id');
  if (!mapping.internalTutorId) return failSingle('missing_internal_tutor_id');
  if (!mapping.role) return failSingle('missing_role');
  if (!mapping.status) return failSingle('missing_mapping_status');
  if (!VALID_MAPPING_STATUSES.includes(mapping.status)) return failSingle('unsupported_mapping_status');
  return ok();
}

export function validateTask021RosterRecord(
  record: Partial<Task021RosterRecord>,
): Task021ValidationResult {
  if (!record.schoolId) return failSingle('missing_school_id');
  if (!record.externalId) return failSingle('missing_external_id');
  if (!record.entityType) return failSingle('missing_entity_type');
  if (!VALID_ENTITY_TYPES.includes(record.entityType)) return failSingle('unsupported_entity_type');
  if (!record.status) return failSingle('missing_roster_status');
  if (!VALID_ROSTER_STATUSES.includes(record.status)) return failSingle('unsupported_roster_status');
  return ok();
}

export function validateTask021RosterSyncBatch(
  batch: Partial<Task021RosterSyncBatch>,
): Task021ValidationResult {
  if (!batch.schoolId) return failSingle('missing_school_id');
  if (!batch.provider) return failSingle('missing_provider');
  if (!VALID_PROVIDERS.includes(batch.provider)) return failSingle('unsupported_provider');
  if (!batch.receivedAt) return failSingle('missing_received_at');
  return ok();
}

export function validateTask021TeacherAssignment(
  assignment: Partial<Task021TeacherAssignment>,
): Task021ValidationResult {
  if (!assignment.schoolId) return failSingle('missing_school_id');
  if (!assignment.teacherId) return failSingle('missing_teacher_id');
  if (!assignment.classId) return failSingle('missing_class_id');
  return ok();
}

export function validateTask021ParentLearnerLink(
  link: Partial<Task021ParentLearnerLink>,
): Task021ValidationResult {
  if (!link.schoolId) return failSingle('missing_school_id');
  if (!link.parentId) return failSingle('missing_parent_id');
  if (!link.learnerId) return failSingle('missing_learner_id');
  return ok();
}

export function validateTask021RoleScopeRequest(
  scope: Partial<Task021RoleScopeDecision>,
): Task021ValidationResult {
  if (!scope.actorRole) return failSingle('missing_actor_role');
  if (!scope.action) return failSingle('missing_action');
  const supportedRoles = ['student', 'teacher', 'parent', 'guardian', 'school_admin', 'safeguarding_officer', 'system_admin', 'internal_operator'];
  if (!supportedRoles.includes(scope.actorRole)) return failSingle('unsupported_role');
  return ok();
}

export function validateTask021SchoolIntegrationQuery(
  query: Partial<Task021SchoolIntegrationQuery>,
): Task021ValidationResult {
  if (!query.schoolId && !query.teacherId && !query.studentId && !query.parentId && !query.classId) {
    return failSingle('missing_query_scope');
  }
  return ok();
}

export function validateTask021EntityType(
  entityType: string,
): Task021ValidationResult {
  if (!entityType) return failSingle('missing_entity_type');
  if (!VALID_ENTITY_TYPES.includes(entityType)) return failSingle('unsupported_entity_type');
  return ok();
}

export function validateTask021RosterStatus(
  status: string,
): Task021ValidationResult {
  if (!status) return failSingle('missing_roster_status');
  if (!VALID_ROSTER_STATUSES.includes(status)) return failSingle('unsupported_roster_status');
  return ok();
}

export function validateTask021MappingStatus(
  status: string,
): Task021ValidationResult {
  if (!status) return failSingle('missing_mapping_status');
  if (!VALID_MAPPING_STATUSES.includes(status)) return failSingle('unsupported_mapping_status');
  return ok();
}

export function validateTask021Provider(
  provider: string,
): Task021ValidationResult {
  if (!provider) return failSingle('missing_provider');
  if (!VALID_PROVIDERS.includes(provider)) return failSingle('unsupported_provider');
  return ok();
}

export function rejectForbiddenTask021PayloadFields(
  payload: Record<string, unknown>,
): Task021ValidationResult {
  const forbidden = TASK021_FORBIDDEN_FIELDS as readonly string[];
  const found: string[] = [];
  for (const key of Object.keys(payload)) {
    if (forbidden.includes(key)) {
      found.push(key);
    }
  }
  if (found.length > 0) {
    return fail(found.map(k => `forbidden_field:${k}`));
  }
  return ok();
}

export function createSafeTask021ValidationError(
  result: Task021ValidationResult,
): string {
  return `Validation failed: ${result.reasonCodes.join(', ')}`;
}
