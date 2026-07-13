// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Governance Contracts v1
// Security, Privacy, Data Governance & Compliance Hardening
// ─────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// 1. Data Classification
// ═══════════════════════════════════════════════════════════════

export type DataCategory =
  | 'learner_identity'
  | 'school_identity'
  | 'class_roster_scope'
  | 'tutor_session_state'
  | 'conversation_message'
  | 'conversation_archive'
  | 'safe_memory_summary'
  | 'practice_attempt'
  | 'learning_evidence'
  | 'mastery_snapshot'
  | 'revision_item'
  | 'spaced_review_item'
  | 'teacher_safe_summary'
  | 'learner_preference_feedback'
  | 'adaptive_profile'
  | 'challenge_record'
  | 'remediation_path'
  | 'difficulty_calibration'
  | 'audit_event'
  | 'operational_telemetry'
  | 'rate_limit_record'
  | 'safeguarding_metadata'
  | 'deen_sensitive_metadata'
  | 'ai_prompt_metadata'
  | 'provider_response_metadata'
  | 'idempotency_record'
  | 'unknown';

export type SensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

export type OwnerType = 'learner' | 'school' | 'system' | 'shared';

export type RetentionCategory =
  | 'active_learning'
  | 'long_term_learning_evidence'
  | 'safe_memory_summary'
  | 'conversation_archive'
  | 'operational_audit'
  | 'security_audit'
  | 'safeguarding_restricted'
  | 'diagnostic_telemetry'
  | 'idempotency_short_lived'
  | 'rate_limit_short_lived';

export interface DataClassificationEntry {
  category: DataCategory;
  sensitivityLevel: SensitivityLevel;
  ownerType: OwnerType;
  allowedRoles: string[];
  teacherVisible: boolean;
  adminVisible: boolean;
  learnerVisible: boolean;
  safeguardingRestricted: boolean;
  deenSensitive: boolean;
  containsPII: boolean;
  containsRawContent: boolean;
  exportEligibility: boolean;
  deleteEligibility: boolean;
  retentionCategory: RetentionCategory;
  redactionRequired: boolean;
  reasonCodes: string[];
}

export interface DataClassificationSummary {
  category: DataCategory;
  sensitivityLevel: SensitivityLevel;
  ownerType: OwnerType;
  visibility: {
    teacher: boolean;
    admin: boolean;
    learner: boolean;
    safeguardingOnly: boolean;
  };
  exportEligibility: boolean;
  deleteEligibility: boolean;
  retentionCategory: RetentionCategory;
  redactionRequired: boolean;
  reasonCodes: string[];
}

// ═══════════════════════════════════════════════════════════════
// 2. Role Access Matrix
// ═══════════════════════════════════════════════════════════════

export type TutorRole =
  | 'learner'
  | 'teacher'
  | 'school_admin'
  | 'safeguarding_officer'
  | 'system_admin'
  | 'internal_operator'
  | 'unknown';

export type AccessAction =
  | 'read'
  | 'write'
  | 'update'
  | 'delete'
  | 'export'
  | 'diagnose'
  | 'audit'
  | 'safeguarding_review';

export interface RoleAccessRequest {
  role: TutorRole;
  schoolId: string;
  tutorLearnerId?: string;
  studentId?: string;
  classId?: string;
  subjectId?: string;
  resourceCategory: DataCategory;
  resourceOwner: OwnerType;
  requestedAction: AccessAction;
  safeguardingRestricted: boolean;
  deenSensitive: boolean;
  teacherVisible: boolean;
  adminVisible: boolean;
  learnerVisible: boolean;
}

export interface RoleAccessDecision {
  allowed: boolean;
  role: TutorRole;
  action: AccessAction;
  resourceCategory: DataCategory;
  scope: string;
  redactionRequired: boolean;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

export interface RoleAccessMatrixEntry {
  role: TutorRole;
  category: DataCategory;
  canRead: boolean;
  canWrite: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canDiagnose: boolean;
  canAudit: boolean;
  canSafeguardingReview: boolean;
  scopeLimit: string;
  notes: string;
}

// ═══════════════════════════════════════════════════════════════
// 3. Privacy Boundary
// ═══════════════════════════════════════════════════════════════

export interface PrivacyBoundaryRequest {
  role: TutorRole;
  schoolId: string;
  resourceCategory: DataCategory;
  action: AccessAction;
  payloadFields: string[];
  context: Record<string, unknown>;
}

export interface PrivacyBoundaryDecision {
  allowed: boolean;
  blocked: boolean;
  redactionApplied: boolean;
  safeFields: string[];
  removedFields: string[];
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// 4. PII Minimization
// ═══════════════════════════════════════════════════════════════

export interface PiiClassificationRequest {
  fields: string[];
  context: string;
}

export interface PiiClassificationResult {
  containsPii: boolean;
  piiFields: string[];
  safeFields: string[];
  redactedFields: string[];
  displaySafeName: string | null;
  hashedIdentifier: string | null;
  reasonCodes: string[];
}

// ═══════════════════════════════════════════════════════════════
// 5. Retention
// ═══════════════════════════════════════════════════════════════

export interface RetentionDecision {
  category: RetentionCategory;
  recommendedRetention: string;
  deleteEligible: boolean;
  exportEligible: boolean;
  requiresRedaction: boolean;
  requiresSafeguardingReview: boolean;
  reasonCodes: string[];
}

export interface RetentionSummaryEntry {
  category: RetentionCategory;
  recommendedRetention: string;
  deleteEligible: boolean;
  exportEligible: boolean;
  requiresRedaction: boolean;
  requiresSafeguardingReview: boolean;
  dataCategories: DataCategory[];
}

// ═══════════════════════════════════════════════════════════════
// 6. Export
// ═══════════════════════════════════════════════════════════════

export interface ExportPlanRequest {
  requesterRole: TutorRole;
  targetLearnerId?: string;
  schoolId: string;
  exportType: 'learner_self' | 'school_admin' | 'safeguarding_review';
}

export interface ExportPlan {
  planId: string;
  dryRunOnly: true;
  schoolId: string;
  targetLearnerId?: string;
  includedCategories: DataCategory[];
  excludedCategories: DataCategory[];
  redactionRequired: boolean;
  safeguardingReviewRequired: boolean;
  deenReviewRequired: boolean;
  estimatedRecordTypes: string[];
  reasonCodes: string[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 7. Deletion
// ═══════════════════════════════════════════════════════════════

export interface DeletionPlanRequest {
  requesterRole: TutorRole;
  targetLearnerId?: string;
  schoolId: string;
  deletionType: 'learner_self' | 'school_admin' | 'data_retention_policy';
}

export interface DeletionPlan {
  planId: string;
  dryRunOnly: true;
  deleteEligibleCategories: DataCategory[];
  retainedCategories: DataCategory[];
  restrictedCategories: DataCategory[];
  redactionInsteadOfDeletionCategories: DataCategory[];
  reasonCodes: string[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 8. AI Egress
// ═══════════════════════════════════════════════════════════════

export interface AiEgressRequest {
  payloadFields: string[];
  tutorMode: 'socratic' | 'practice' | 'challenge' | 'remediation' | 'review' | 'assessment';
  containsTeacherOnlyNotes: boolean;
  containsSafeguardingRaw: boolean;
  containsPrivateMemory: boolean;
  containsAnswerKeys: boolean;
  containsDeenSensitive: boolean;
  containsDiagnostics: boolean;
  containsSecrets: boolean;
}

export interface AiEgressDecision {
  allowed: boolean;
  sanitizedPayload: string[];
  blockedReason?: string;
  redactionApplied: boolean;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// 9. Security Config
// ═══════════════════════════════════════════════════════════════

export interface SecurityCheckItem {
  checkName: string;
  status: 'pass' | 'warn' | 'fail' | 'skip';
  safeMessage: string;
  required: boolean;
}

export interface SecurityConfigCheckResult {
  status: 'pass' | 'warn' | 'fail';
  checks: SecurityCheckItem[];
  safeWarnings: string[];
  safeErrors: string[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 10. Governance Audit
// ═══════════════════════════════════════════════════════════════

export type GovernanceAuditEventType =
  | 'privacy_access_decision'
  | 'role_access_denied'
  | 'role_access_allowed'
  | 'data_export_plan_created'
  | 'data_deletion_plan_created'
  | 'retention_decision_created'
  | 'ai_egress_allowed'
  | 'ai_egress_blocked'
  | 'safeguarding_access_checked'
  | 'deen_boundary_checked'
  | 'security_config_checked'
  | 'diagnostics_access_denied'
  | 'teacher_visibility_filtered';

export interface GovernanceAuditEvent {
  actorId?: string;
  actorRole: TutorRole;
  schoolId?: string;
  tutorLearnerId?: string;
  resourceCategory: DataCategory;
  action: GovernanceAuditEventType;
  decision: string;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt: string;
}

export interface GovernanceAuditRecord {
  id: string;
  schoolId?: string;
  actorId?: string;
  actorRole: string;
  resourceCategory: string;
  action: string;
  decision: string;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// 11. Governance Runtime
// ═══════════════════════════════════════════════════════════════

export interface GovernanceRuntimeRequest {
  role: TutorRole;
  schoolId: string;
  tutorLearnerId?: string;
  resourceCategory: DataCategory;
  action: AccessAction;
  context: Record<string, unknown>;
}

export interface GovernanceRuntimeResult {
  allowed: boolean;
  privacyBoundary: PrivacyBoundaryDecision;
  roleDecision: RoleAccessDecision;
  retentionDecision?: RetentionDecision;
  auditRecorded: boolean;
  reasonCodes: string[];
}

// ═══════════════════════════════════════════════════════════════
// 12. Deviceless Learner Privacy Summary
// ═══════════════════════════════════════════════════════════════

export interface LearnerPrivacySummary {
  tutorRemembers: string[];
  teacherCanSee: string[];
  teacherCannotSee: string[];
  safeguardingBoundary: string;
  deenBoundary: string;
  dataRetainedDays: string;
  exportAvailable: boolean;
  deletionAvailable: boolean;
}

export type GovernanceAction = 'allow' | 'audit' | 'mask' | 'deny' | 'block' | 'escalate';

export const GOVERNANCE_REQUIRED_ACTIONS: GovernanceAction[] = ['allow', 'audit', 'mask'];
export const GOVERNANCE_DENIED_ACTIONS: GovernanceAction[] = ['deny', 'block', 'escalate'];
