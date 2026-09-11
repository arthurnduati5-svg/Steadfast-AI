import type {
  SchoolActorRole,
  SchoolIntegrationContext,
  VerifiedSchoolIdentity,
  ExternalSchoolUserIdentity,
  ExternalStudentIdentity,
  ExternalTeacherIdentity,
  TutorLearnerMapping,
  SchoolRosterRecord,
  RosterSyncBatch,
  RosterSyncResult,
  RosterDiffEntry,
  RosterDiffResult,
  ClassEnrollmentScope,
  SubjectEnrollmentScope,
  TeacherAssignmentScope,
  SchoolScopeSnapshot,
} from '../services/task021SchoolIntegrationContracts';

export type SchoolSystemProviderMode =
  | 'mock_only'
  | 'disabled_live'
  | 'activation_pending'
  | 'live_ready_not_enabled'
  | 'live_enabled'
  | 'degraded'
  | 'blocked';

export type SchoolSystemProviderName =
  | 'mock_school_system'
  | 'future_school_sis'
  | 'future_school_lms'
  | 'future_google_classroom'
  | 'future_microsoft_education'
  | 'future_custom_school_system'
  | 'future_other';

export type SchoolSystemActivationState =
  | 'mock_only'
  | 'disabled_live'
  | 'activation_pending'
  | 'live_ready_not_enabled'
  | 'blocked';

export type RawExternalSchoolRole = string;

export interface ExternalSchoolIdentityPayload {
  externalUserId: string;
  schoolId: string;
  role: RawExternalSchoolRole;
  externalStudentId?: string;
  externalTeacherId?: string;
  classId?: string;
  subjectId?: string;
  schoolYear?: string;
  term?: string;
  issuedAt?: string;
  expiresAt?: string;
  signature?: string;
  issuer?: string;
  audience?: string;
}

export interface SchoolContextVerificationResult {
  verified: boolean;
  schoolId?: string;
  externalUserId?: string;
  role?: SchoolActorRole;
  reasonCodes: string[];
  verificationStatus: SchoolIdentityVerificationStatus;
  privacyMetadata: Record<string, unknown>;
}

export type SchoolIdentityVerificationStatus =
  | 'verified'
  | 'blocked_missing_school'
  | 'blocked_missing_user'
  | 'blocked_missing_role'
  | 'blocked_invalid_role'
  | 'blocked_missing_scope'
  | 'blocked_expired_identity'
  | 'blocked_revoked_identity'
  | 'blocked_tenant_mismatch'
  | 'blocked_identity_conflict'
  | 'blocked_live_connector_disabled';

export type SchoolRoleClaim =
  | 'student'
  | 'teacher'
  | 'school_admin'
  | 'internal_operator'
  | 'unknown';

export type SchoolUserType =
  | 'student'
  | 'teacher'
  | 'school_admin'
  | 'internal_operator'
  | 'unknown';

export interface SchoolTenantContext {
  schoolId: string;
  schoolName?: string;
  tenantId: string;
  allowedRoleTypes: SchoolRoleClaim[];
  featureFlags: Record<string, boolean>;
  privacyMetadata: Record<string, unknown>;
}

export interface ExternalClassRecord {
  classId: string;
  schoolId: string;
  name?: string;
  grade?: string;
  schoolYear?: string;
  teacherIds?: string[];
  subjectIds?: string[];
}

export interface ExternalSubjectRecord {
  subjectId: string;
  schoolId: string;
  name?: string;
  code?: string;
  grade?: string;
  curriculumTrack?: string;
}

export interface ExternalEnrollmentRecord {
  studentId: string;
  classId: string;
  schoolId: string;
  subjectId?: string;
  status?: string;
  schoolYear?: string;
  term?: string;
}

export interface ExternalTeacherAssignmentRecord {
  teacherId: string;
  classId: string;
  schoolId: string;
  subjectId?: string;
  status?: string;
}

export interface TutorTeacherScopeMapping {
  teacherId: string;
  schoolId: string;
  externalUserId: string;
  allowedClassIds: string[];
  allowedSubjectIds: string[];
  allowedStudentIds: string[];
  scopeDecision: TeacherScopeDecision;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

export type TeacherScopeDecision =
  | 'scope_verified'
  | 'blocked_missing_verified_identity'
  | 'blocked_not_teacher'
  | 'blocked_no_class_scope'
  | 'blocked_no_subject_scope'
  | 'blocked_student_outside_scope'
  | 'blocked_class_outside_scope'
  | 'blocked_school_mismatch';

export interface TutorAdminScopeMapping {
  adminId: string;
  schoolId: string;
  externalUserId: string;
  scopeDecision: AdminScopeDecision;
  allowedSchoolIds: string[];
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

export type AdminScopeDecision =
  | 'admin_scope_verified'
  | 'blocked_missing_verified_identity'
  | 'blocked_not_school_admin'
  | 'blocked_school_mismatch'
  | 'blocked_secret_visibility'
  | 'blocked_raw_private_data_visibility';

export interface RosterSyncInput {
  schoolId: string;
  schoolYear?: string;
  term?: string;
  students: ExternalStudentIdentity[];
  teachers: ExternalTeacherIdentity[];
  classes: ExternalClassRecord[];
  subjects: ExternalSubjectRecord[];
  enrollments: ExternalEnrollmentRecord[];
  teacherAssignments: ExternalTeacherAssignmentRecord[];
}

export interface RosterSyncDryRunResult {
  dryRunId: string;
  summary: RosterSyncDryRunSummary;
  conflicts: RosterSyncConflict[];
  blocked: boolean;
  safeToApplyLater: boolean;
  reasonCodes: string[];
}

export interface RosterSyncDryRunSummary {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalEnrollments: number;
  totalTeacherAssignments: number;
  wouldCreate: number;
  wouldUpdate: number;
  wouldDeactivate: number;
  conflicts: number;
  warnings: number;
  blocked: number;
}

export interface RosterSyncConflict {
  conflictType: string;
  externalId: string;
  schoolId: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  safeDetails: string;
}

export type RosterSyncDecision =
  | 'apply'
  | 'dry_run_only'
  | 'blocked_conflicts'
  | 'blocked_school_mismatch'
  | 'blocked_missing_verified_identity';

export interface SchoolIdentityConflict {
  conflictType: SchoolIdentityConflictType;
  externalUserId?: string;
  tutorLearnerId?: string;
  schoolId?: string;
  description: string;
  safeDetails: string;
}

export type SchoolIdentityConflictType =
  | 'duplicate_external_user'
  | 'duplicate_tutor_mapping'
  | 'cross_role_identifier'
  | 'cross_school_student'
  | 'teacher_outside_school_scope'
  | 'class_school_mismatch'
  | 'subject_school_mismatch'
  | 'enrollment_missing_student'
  | 'enrollment_missing_class'
  | 'assignment_missing_teacher'
  | 'assignment_missing_class_subject';

export interface SchoolConnectorReadinessResult {
  ready: boolean;
  allowed: boolean;
  activationState: SchoolSystemActivationState;
  blockedReasons: string[];
  futureRequiredGates: string[];
  safeNextSteps: string[];
}

export interface SchoolConnectorActivationChecklist {
  frontendIntegrationComplete: boolean;
  schoolSystemOwnerApprovalRecorded: boolean;
  schoolConnectorProviderSelected: boolean;
  secureCredentialStorageConfigured: boolean;
  schoolIdentitySignatureValidationConfigured: boolean;
  roleClaimMappingApproved: boolean;
  rosterSyncDryRunPassed: boolean;
  teacherScopeDryRunPassed: boolean;
  studentMappingDryRunPassed: boolean;
  privacyScanPassed: boolean;
  auditPathConfigured: boolean;
  rollbackPlanExists: boolean;
  manualActivationApprovalRecorded: boolean;
  stagingOnlySmokeTestPassed: boolean;
}

export interface SchoolConnectorGatewayDecision {
  allowed: boolean;
  activationState: SchoolSystemActivationState;
  blockedReasons: string[];
  futureRequiredGates: string[];
}

export interface SchoolConnectorNoBypassAuditResult {
  passed: boolean;
  findings: SchoolConnectorAuditFinding[];
  blockedFindings: SchoolConnectorAuditFinding[];
  summary: string;
}

export interface SchoolConnectorAuditFinding {
  category: SchoolConnectorAuditCategory;
  description: string;
  fileOrService?: string;
  severity: 'high' | 'medium' | 'low';
}

export type SchoolConnectorAuditCategory =
  | 'verified_gateway_compliant'
  | 'mock_only'
  | 'disabled_live_shell'
  | 'legacy_outside_task039_scope'
  | 'potential_bypass_blocker';

export type TutorLearnerMappingDecision =
  | 'mapped_existing'
  | 'mapped_created_dry_run'
  | 'blocked_missing_verified_identity'
  | 'blocked_not_student'
  | 'blocked_duplicate_external_identity'
  | 'blocked_duplicate_tutor_mapping'
  | 'blocked_school_mismatch'
  | 'blocked_inactive_enrollment'
  | 'blocked_conflict';

export function getDefaultSchoolProviderMode(): SchoolSystemProviderMode {
  return 'mock_only';
}

export function getDefaultSchoolConnectorChecklist(): SchoolConnectorActivationChecklist {
  return {
    frontendIntegrationComplete: false,
    schoolSystemOwnerApprovalRecorded: false,
    schoolConnectorProviderSelected: false,
    secureCredentialStorageConfigured: false,
    schoolIdentitySignatureValidationConfigured: false,
    roleClaimMappingApproved: false,
    rosterSyncDryRunPassed: false,
    teacherScopeDryRunPassed: false,
    studentMappingDryRunPassed: false,
    privacyScanPassed: false,
    auditPathConfigured: false,
    rollbackPlanExists: false,
    manualActivationApprovalRecorded: false,
    stagingOnlySmokeTestPassed: false,
  };
}

export const SCHOOL_CONNECTOR_SAFE_IDENTIFIERS = {
  mockRequestId: 'task-039-mock-school-request',
  mockSchoolId: 'mock-school-001',
  mockTenantId: 'mock-tenant-001',
  mockExternalUserId: 'mock-ext-user-001',
  mockExternalStudentId: 'mock-stu-001',
  mockExternalTeacherId: 'mock-tch-001',
  mockExternalAdminId: 'mock-adm-001',
  mockClassId: 'mock-class-001',
  mockSubjectId: 'mock-sub-001',
  mockEnrollmentId: 'mock-enrl-001',
  mockAssignmentId: 'mock-assign-001',
} as const;

export const FUTURE_SCHOOL_CONNECTOR_ENV_NAMES = {
  SCHOOL_CONNECTOR_MODE: 'SCHOOL_CONNECTOR_MODE',
  SCHOOL_CONNECTOR_PROVIDER: 'SCHOOL_CONNECTOR_PROVIDER',
  SCHOOL_CONNECTOR_BASE_URL: 'SCHOOL_CONNECTOR_BASE_URL',
  SCHOOL_CONNECTOR_TIMEOUT_MS: 'SCHOOL_CONNECTOR_TIMEOUT_MS',
  SCHOOL_CONNECTOR_RETRY_LIMIT: 'SCHOOL_CONNECTOR_RETRY_LIMIT',
  SCHOOL_CONNECTOR_WEBHOOK_SECRET_NAME: 'SCHOOL_CONNECTOR_WEBHOOK_SECRET_NAME',
  SCHOOL_CONNECTOR_CLIENT_ID_NAME: 'SCHOOL_CONNECTOR_CLIENT_ID_NAME',
  SCHOOL_CONNECTOR_CLIENT_SECRET_NAME: 'SCHOOL_CONNECTOR_CLIENT_SECRET_NAME',
} as const;
