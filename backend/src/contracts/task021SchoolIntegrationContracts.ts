export type Task021ExternalIdentityProvider =
  | 'school_sso'
  | 'school_portal'
  | 'manual_admin_seed'
  | 'sis_export'
  | 'google_classroom_export'
  | 'microsoft_education_export'
  | 'csv_import'
  | 'mock_school_adapter'
  | 'unknown';

export type Task021SchoolEntityType =
  | 'school'
  | 'campus'
  | 'academic_year'
  | 'term'
  | 'class'
  | 'stream'
  | 'subject'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'guardian'
  | 'staff'
  | 'enrollment'
  | 'teacher_assignment'
  | 'parent_learner_link';

export type Task021RosterRecordStatus =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'disabled'
  | 'graduated'
  | 'transferred'
  | 'deleted'
  | 'stale'
  | 'conflict'
  | 'unknown';

export type Task021IdentityMappingStatus =
  | 'mapped'
  | 'pending_mapping'
  | 'mapping_conflict'
  | 'unmapped'
  | 'disabled'
  | 'stale'
  | 'cross_school_rejected'
  | 'blocked';

export type Task021RosterSyncStatus =
  | 'not_started'
  | 'received'
  | 'validated'
  | 'partially_validated'
  | 'reconciled'
  | 'reconciled_with_warnings'
  | 'failed'
  | 'blocked';

export type Task021ReconciliationStatus =
  | 'matched'
  | 'created'
  | 'updated'
  | 'unchanged'
  | 'stale_detected'
  | 'disabled_detected'
  | 'conflict_detected'
  | 'missing_required_field'
  | 'blocked';

export type Task021RoleScopeDecisionValue =
  | 'allow'
  | 'deny'
  | 'teacher_mediated'
  | 'parent_link_required'
  | 'class_assignment_required'
  | 'school_scope_required'
  | 'mapping_required'
  | 'roster_active_required'
  | 'blocked';

export type Task021ContextVerificationStatus =
  | 'verified'
  | 'missing_school_context'
  | 'missing_identity_mapping'
  | 'missing_active_roster'
  | 'missing_class_scope'
  | 'missing_teacher_assignment'
  | 'missing_parent_link'
  | 'cross_school_denied'
  | 'cross_learner_denied'
  | 'disabled_roster_denied'
  | 'stale_roster_denied'
  | 'blocked';

export type Task021ClassScopeDecisionValue =
  | 'allow'
  | 'deny'
  | 'class_not_found'
  | 'teacher_not_assigned'
  | 'student_not_enrolled'
  | 'subject_not_available'
  | 'cross_school_denied';

export type Task021ParentLinkStatus =
  | 'active'
  | 'inactive'
  | 'pending_approval'
  | 'revoked'
  | 'expired'
  | 'cross_school_rejected';

export type Task021IntegrationFailureType =
  | 'missing_school_context'
  | 'missing_external_identity'
  | 'missing_identity_mapping'
  | 'mapping_conflict'
  | 'inactive_roster'
  | 'disabled_roster'
  | 'stale_roster'
  | 'cross_school_mismatch'
  | 'teacher_assignment_missing'
  | 'parent_link_missing'
  | 'unsafe_raw_payload'
  | 'connector_unavailable'
  | 'validation_failed'
  | 'unknown';

export type Task021DiagnosticSeverity =
  | 'info'
  | 'warning'
  | 'error'
  | 'critical';

export type Task021AuditEventType =
  | 'external_identity_normalized'
  | 'identity_mapping_created'
  | 'identity_mapping_resolved'
  | 'identity_mapping_conflict_detected'
  | 'roster_sync_batch_created'
  | 'roster_record_ingested'
  | 'roster_reconciliation_completed'
  | 'school_context_verified'
  | 'school_context_denied'
  | 'teacher_assignment_verified'
  | 'teacher_assignment_denied'
  | 'parent_learner_link_verified'
  | 'parent_learner_link_denied'
  | 'role_scope_verified'
  | 'role_scope_denied'
  | 'integration_failure_recorded'
  | 'school_integration_diagnostic_viewed';

export const TASK021_FORBIDDEN_FIELDS: readonly string[] = [
  'rawRosterPayload', 'rawSsoToken', 'rawJwt', 'rawAccessToken',
  'rawRefreshToken', 'rawIdToken', 'rawConnectorPayload', 'rawSisPayload',
  'rawCsvRow', 'password', 'passwordHash', 'authorization', 'cookie',
  'apiKey', 'token', 'privateKey', 'connectionString', 'DATABASE_URL',
  'REDIS_URL', 'rawStudentProfile', 'rawParentProfile', 'rawTeacherProfile',
  'rawAddress', 'rawPhone', 'rawEmail', 'rawNationalId', 'rawMedicalInfo',
  'rawSafeguardingInfo', 'rawDeenPrivateText', 'providerPrompt',
  'providerResponse', 'chainOfThought', 'hiddenReasoning', 'answerKey',
  'correctAnswer', 'modelAnswer', 'markingScheme',
] as const;

export interface Task021SchoolIntegrationContext {
  schoolId: string;
  externalUserId?: string;
  externalSubjectId?: string;
  provider: Task021ExternalIdentityProvider;
  actorRole: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  externalParentId?: string;
  classId?: string;
  subjectId?: string;
  schoolYear?: string;
  term?: string;
}

export interface Task021ExternalSchoolIdentity {
  externalUserId: string;
  externalSubjectId?: string;
  schoolId: string;
  provider: Task021ExternalIdentityProvider;
  actorRole: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  externalParentId?: string;
  safeDisplayName?: string;
  safeEmailHash?: string;
}

export interface Task021InternalTutorIdentity {
  tutorLearnerId?: string;
  tutorTeacherId?: string;
  tutorParentId?: string;
  tutorStaffId?: string;
  schoolId: string;
  role: string;
  status: string;
  reasonCodes: string[];
}

export interface Task021IdentityMapping {
  mappingId: string;
  schoolId: string;
  externalUserId: string;
  internalTutorId: string;
  role: string;
  status: Task021IdentityMappingStatus;
  provider: Task021ExternalIdentityProvider;
  reasonCodes: string[];
}

export interface Task021RosterRecord {
  recordId: string;
  schoolId: string;
  externalId: string;
  entityType: Task021SchoolEntityType;
  status: Task021RosterRecordStatus;
  classId?: string;
  subjectId?: string;
  safeMetadata: Record<string, unknown>;
}

export interface Task021RosterSyncBatch {
  batchId: string;
  schoolId: string;
  provider: Task021ExternalIdentityProvider;
  receivedAt: string;
  status: Task021RosterSyncStatus;
  recordCount: number;
  safeMetadata: Record<string, unknown>;
}

export interface Task021RosterReconciliationResult {
  batchId: string;
  status: Task021ReconciliationStatus;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  staleDetected: number;
  disabledDetected: number;
  conflictsDetected: number;
  reasonCodes: string[];
}

export interface Task021SchoolContextVerification {
  verificationId: string;
  schoolId: string;
  actorExternalId: string;
  actorRole: string;
  status: Task021ContextVerificationStatus;
  reasonCodes: string[];
  verifiedAt: string;
}

export interface Task021TeacherAssignment {
  assignmentId: string;
  schoolId: string;
  teacherId: string;
  classId: string;
  subjectId?: string;
  status: string;
  reasonCodes: string[];
}

export interface Task021ClassScopeDecision {
  allowed: boolean;
  teacherId: string;
  classId: string;
  schoolId: string;
  decision: Task021ClassScopeDecisionValue;
  reasonCodes: string[];
}

export interface Task021ParentLearnerLink {
  linkId: string;
  parentId: string;
  learnerId: string;
  schoolId: string;
  status: Task021ParentLinkStatus;
  reasonCodes: string[];
}

export interface Task021RoleScopeDecision {
  allowed: boolean;
  actorRole: string;
  action: string;
  resourceCategory: string;
  decision: Task021RoleScopeDecisionValue;
  reasonCodes: string[];
}

export interface Task021IntegrationFailure {
  failureId: string;
  schoolId: string;
  failureType: Task021IntegrationFailureType;
  safeSummary: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task021SchoolIntegrationDiagnostic {
  diagnosticId: string;
  schoolId: string;
  severity: Task021DiagnosticSeverity;
  component: string;
  safeMessage: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task021SchoolIntegrationAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  targetStudentId?: string;
  targetTeacherId?: string;
  targetParentId?: string;
  classId?: string;
  subjectId?: string;
  provider?: Task021ExternalIdentityProvider;
  eventType: Task021AuditEventType;
  safeReasonCodes: string[];
  safeMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface Task021SchoolIntegrationQuery {
  schoolId?: string;
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  studentId?: string;
  parentId?: string;
  status?: string;
  provider?: Task021ExternalIdentityProvider;
  entityType?: Task021SchoolEntityType;
}
