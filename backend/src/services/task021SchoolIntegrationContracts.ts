export type SchoolActorRole =
  | 'student'
  | 'teacher'
  | 'school_admin'
  | 'safeguarding_officer'
  | 'system_admin'
  | 'internal_operator'
  | 'unknown';

export type SchoolIntegrationErrorCode =
  | 'missing_school_id'
  | 'missing_external_user_id'
  | 'unknown_role'
  | 'expired_context'
  | 'invalid_signature'
  | 'mismatched_issuer'
  | 'mismatched_audience'
  | 'tampered_role'
  | 'tampered_school_id'
  | 'duplicate_external_id'
  | 'conflicting_tutor_mapping'
  | 'cross_school_collision'
  | 'teacher_student_role_mismatch'
  | 'student_teacher_role_mismatch'
  | 'inactive_mapping'
  | 'school_not_found'
  | 'class_not_found'
  | 'subject_not_found'
  | 'teacher_not_assigned'
  | 'student_not_enrolled'
  | 'roster_batch_invalid'
  | 'sync_already_applied'
  | 'quarantine_required'
  | 'internal_error';

export interface SchoolIntegrationContext {
  schoolId: string;
  externalUserId: string;
  role: SchoolActorRole;
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
  context?: Record<string, unknown>;
}

export interface VerifiedSchoolIdentity {
  verified: true;
  schoolId: string;
  externalUserId: string;
  role: SchoolActorRole;
  externalStudentId?: string;
  externalTeacherId?: string;
  tutorLearnerId?: string;
  classId?: string;
  subjectId?: string;
  schoolYear?: string;
  term?: string;
  scope: SchoolScopeSnapshot;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

export interface SchoolScopeSnapshot {
  schoolId: string;
  classIds: string[];
  subjectIds: string[];
  teacherAssignmentIds: string[];
  enrollmentStatus: 'active' | 'inactive' | 'transferred' | 'archived';
}

export interface ExternalSchoolUserIdentity {
  externalUserId: string;
  schoolId: string;
  role: SchoolActorRole;
  externalStudentId?: string;
  externalTeacherId?: string;
}

export interface ExternalStudentIdentity {
  externalStudentId: string;
  schoolId: string;
  name?: string;
  grade?: string;
  classId?: string;
  subjectIds?: string[];
  enrollmentStatus?: string;
  schoolYear?: string;
  term?: string;
}

export interface ExternalTeacherIdentity {
  externalTeacherId: string;
  schoolId: string;
  name?: string;
  assignedClassIds: string[];
  assignedSubjectIds: string[];
  schoolYear?: string;
  term?: string;
}

export interface TutorLearnerMapping {
  tutorLearnerId: string;
  externalStudentId: string;
  schoolId: string;
  externalUserId?: string;
  classId?: string;
  grade?: string;
  status: 'active' | 'inactive' | 'transferred' | 'archived';
  role: 'student';
  firstSeenAt: string;
  lastSeenAt: string;
  reasonCodes: string[];
}

export interface SchoolRosterRecord {
  recordType: 'student' | 'teacher' | 'class' | 'enrollment' | 'teacher_assignment';
  externalId: string;
  schoolId: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  classId?: string;
  subjectId?: string;
  name?: string;
  grade?: string;
  status?: string;
  schoolYear?: string;
  term?: string;
}

export interface RosterSyncBatch {
  syncBatchId: string;
  schoolId: string;
  schoolYear?: string;
  term?: string;
  students: ExternalStudentIdentity[];
  teachers: ExternalTeacherIdentity[];
  classes: Array<{ classId: string; name?: string; schoolId: string }>;
  enrollments: Array<{ studentId: string; classId: string; subjectId?: string; status?: string }>;
  teacherAssignments: Array<{ teacherId: string; classId: string; subjectId?: string }>;
  idempotencyKey?: string;
}

export interface RosterSyncResult {
  syncBatchId: string;
  status: 'completed' | 'partial' | 'failed' | 'quarantined';
  createdMappings: number;
  updatedMappings: number;
  inactivatedMappings: number;
  reactivatedMappings: number;
  conflicts: number;
  quarantined: number;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
  syncDetails?: RosterSyncDetail[];
}

export interface RosterSyncDetail {
  recordType: string;
  externalId: string;
  action: 'created' | 'updated' | 'inactivated' | 'reactivated' | 'conflict' | 'quarantined' | 'skipped';
  safeSummary: string;
  reasonCodes: string[];
}

export type RosterDiffCategory =
  | 'new_student_mapping_needed'
  | 'existing_student_unchanged'
  | 'student_inactivated'
  | 'student_reactivated'
  | 'student_transferred'
  | 'conflict_duplicate_external_id'
  | 'conflict_duplicate_tutor_mapping'
  | 'teacher_assignment_added'
  | 'teacher_assignment_removed'
  | 'class_enrollment_added'
  | 'class_enrollment_removed'
  | 'subject_enrollment_changed'
  | 'unknown_record_type';

export interface RosterDiffEntry {
  category: RosterDiffCategory;
  externalId: string;
  schoolId: string;
  role?: SchoolActorRole;
  currentStatus?: string;
  incomingStatus?: string;
  details?: string;
}

export interface RosterDiffResult {
  batchId: string;
  entries: RosterDiffEntry[];
  totalChanges: number;
  conflictsFound: number;
}

export type ReconciliationAction =
  | 'create_mapping'
  | 'update_mapping'
  | 'inactivate_mapping'
  | 'reactivate_mapping'
  | 'quarantine'
  | 'skip';

export interface RosterReconciliationDecision {
  action: ReconciliationAction;
  entry: RosterDiffEntry;
  safeSummary: string;
  reasonCodes: string[];
  preserveHistory: boolean;
}

export interface ClassEnrollmentScope {
  classId: string;
  schoolId: string;
  studentIds: string[];
  teacherIds: string[];
  subjectIds: string[];
  status: 'active' | 'inactive' | 'archived';
  schoolYear?: string;
  term?: string;
}

export interface SubjectEnrollmentScope {
  subjectId: string;
  schoolId: string;
  classId?: string;
  studentIds: string[];
  teacherIds: string[];
  status: 'active' | 'inactive';
}

export interface TeacherAssignmentScope {
  teacherId: string;
  schoolId: string;
  classId: string;
  subjectId?: string;
  assignedStudentIds: string[];
  status: 'active' | 'removed' | 'inactive';
}

export interface RoleScopeDecision {
  allowed: boolean;
  role: SchoolActorRole;
  action: string;
  resourceCategory: string;
  scope: string;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

export interface RoleScopeCheckRequest {
  action: string;
  resourceCategory: string;
  targetTutorLearnerId?: string;
  targetClassId?: string;
  targetSubjectId?: string;
  targetSchoolId?: string;
}

export interface SchoolIntegrationTokenValidationResult {
  valid: boolean;
  schoolId?: string;
  externalUserId?: string;
  role?: SchoolActorRole;
  reasonCodes: string[];
  errorCode?: SchoolIntegrationErrorCode;
}

export type SchoolIntegrationAuditEventType =
  | 'school_context_verified'
  | 'school_context_denied'
  | 'identity_mapping_created'
  | 'identity_mapping_conflict'
  | 'roster_sync_started'
  | 'roster_sync_completed'
  | 'roster_sync_failed'
  | 'roster_record_quarantined'
  | 'role_scope_allowed'
  | 'role_scope_denied'
  | 'teacher_assignment_revoked'
  | 'student_mapping_inactivated'
  | 'student_mapping_reactivated'
  | 'idempotency_replayed';

export interface SchoolIntegrationAuditRecord {
  eventType: SchoolIntegrationAuditEventType;
  actorId?: string;
  actorRole: string;
  schoolId?: string;
  externalUserId?: string;
  tutorLearnerId?: string;
  route?: string;
  operation?: string;
  decision: string;
  reasonCodes: string[];
  requestId?: string;
  correlationId?: string;
  privacyMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface SchoolIntegrationAuditEvent {
  schoolId?: string;
  eventType: SchoolIntegrationAuditEventType;
  actorRole: SchoolActorRole;
  actorId?: string;
  externalUserId?: string;
  tutorLearnerId?: string;
  route?: string;
  operation?: string;
  decision: string;
  reasonCodes: string[];
  requestId?: string;
  correlationId?: string;
  privacyMetadata?: Record<string, unknown>;
}

export interface SchoolIntegrationDiagnosticsSnapshot {
  schoolId: string;
  lastSyncStatus: string | null;
  lastSyncAt: string | null;
  totalMappings: number;
  activeMappings: number;
  inactiveMappings: number;
  transferredMappings: number;
  teacherAssignmentsActive: number;
  teacherAssignmentsRemoved: number;
  conflictCount: number;
  quarantineCount: number;
  totalSyncJobs: number;
  failedSyncJobs: number;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

export function normalizeRole(role: string): SchoolActorRole {
  const r = (role || '').trim().toLowerCase();
  if (r === 'student' || r === 'learner') return 'student';
  if (r === 'teacher') return 'teacher';
  if (r === 'admin' || r === 'school_admin') return 'school_admin';
  if (r === 'safeguarding_officer' || r === 'counselor' || r === 'counsellor') return 'safeguarding_officer';
  if (r === 'system_admin') return 'system_admin';
  if (r === 'internal_operator') return 'internal_operator';
  return 'unknown';
}

export function isAdminInternalRole(role: SchoolActorRole): boolean {
  return role === 'school_admin' || role === 'system_admin' || role === 'internal_operator';
}

export function nowISO(): string {
  return new Date().toISOString();
}
