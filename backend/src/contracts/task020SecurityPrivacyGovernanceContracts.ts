export const TASK020_DATA_CLASSIFICATION_LEVELS = [
  'public_safe', 'school_internal', 'learner_private', 'teacher_private',
  'parent_safe', 'peer_safe', 'safeguarding_restricted', 'deen_sensitive',
  'answer_artifact_restricted', 'provider_payload_restricted', 'credential_secret',
  'operational_sensitive', 'blocked'
] as const;

export const TASK020_DATA_CATEGORIES = [
  'school_identity', 'learner_identity', 'teacher_identity', 'parent_identity', 'peer_identity',
  'objective_mastery', 'daily_check', 'daily_learning_feed', 'study_plan', 'growth_page',
  'mistake_journal', 'living_revision', 'confidence_recovery', 'parent_support', 'peer_learning',
  'safe_learning_evidence', 'teacher_safe_summary', 'safeguarding_signal', 'safeguarding_raw',
  'deen_context', 'deen_private_text', 'answer_key', 'model_answer', 'marking_scheme',
  'provider_prompt', 'provider_response', 'hidden_reasoning', 'credential',
  'audit_metadata', 'operational_metric'
] as const;

export const TASK020_ACTOR_ROLES = [
  'student', 'learner', 'teacher', 'parent', 'guardian', 'admin', 'internal',
  'safeguarding_staff', 'system', 'anonymous', 'unknown'
] as const;

export const TASK020_ACCESS_DECISIONS = [
  'allow', 'deny', 'teacher_mediated', 'safeguarding_only', 'source_required',
  'deen_source_required', 'redact', 'blocked'
] as const;

export const TASK020_VISIBILITY_SCOPES = [
  'self_only', 'teacher_safe', 'parent_safe', 'peer_safe', 'school_admin_safe',
  'safeguarding_only', 'internal_ops_safe', 'ai_provider_allowed_redacted',
  'ai_provider_blocked', 'blocked'
] as const;

export const TASK020_EGRESS_DECISIONS = [
  'allow_redacted', 'allow_metadata_only', 'deny_raw', 'deny_answer_artifact',
  'deny_safeguarding', 'deny_deen_private', 'deny_credential', 'deny_provider_payload',
  'deny_unknown', 'blocked'
] as const;

export const TASK020_RETENTION_ACTIONS = [
  'retain', 'redact', 'archive', 'delete_pending_review', 'delete_allowed',
  'delete_denied_safeguarding_hold', 'delete_denied_audit_hold',
  'export_allowed_redacted', 'export_denied', 'blocked'
] as const;

export const TASK020_EXPORT_STATUSES = [
  'not_requested', 'requested', 'approved_redacted', 'denied',
  'completed_metadata_only', 'completed_redacted', 'blocked'
] as const;

export const TASK020_DELETE_STATUSES = [
  'not_requested', 'requested', 'approved', 'denied', 'pending_review',
  'blocked_by_safeguarding_hold', 'blocked_by_audit_hold', 'completed'
] as const;

export const TASK020_GOVERNANCE_AUDIT_EVENTS = [
  'data_classified', 'role_access_decision_created', 'privacy_boundary_decision_created',
  'ai_egress_decision_created', 'retention_policy_decision_created',
  'export_request_created', 'delete_request_created', 'teacher_visibility_decision_created',
  'safeguarding_access_decision_created', 'deen_sensitive_data_decision_created',
  'security_config_validated', 'governance_route_viewed', 'governance_block_returned'
] as const;

export const TASK020_FORBIDDEN_FIELDS = [
  'rawChat', 'rawMessage', 'rawAnswer', 'rawStudentAnswer', 'rawExplanation',
  'rawPrompt', 'rawResponse', 'rawStudentWork', 'providerPrompt', 'providerResponse',
  'rawProviderResponse', 'chainOfThought', 'hiddenReasoning', 'scratchpad',
  'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme', 'teacherOnlyNotes',
  'safeguardingRaw', 'safeguardingCaseNote', 'safeguardingDisclosure',
  'deenSensitiveRaw', 'privateDeenText', 'authorization', 'cookie', 'apiKey', 'token',
  'DATABASE_URL', 'REDIS_URL', 'connectionString', 'privateKey', 'riskScore',
  'diagnosis', 'pietyScore', 'leaderboardRank', 'classmateComparison',
  'studentRanking', 'popularityScore', 'followerCount', 'likeCount',
  'privateDm', 'privateMessage', 'parentOnlyContent', 'peerPrivateContent',
  'rawTranscript', 'systemPrompt', 'modelDraft', 'internalScoring', 'stackTrace',
  'rawAiResponse', 'rawLearnerMemory', 'safetyExcerpt', 'rawArtifactContent', 'rawVideoTranscript',
] as const;

export type Task020DataClassificationLevel = typeof TASK020_DATA_CLASSIFICATION_LEVELS[number];
export type Task020DataCategory = typeof TASK020_DATA_CATEGORIES[number];
export type Task020ActorRole = typeof TASK020_ACTOR_ROLES[number];
export type Task020AccessDecision = typeof TASK020_ACCESS_DECISIONS[number];
export type Task020VisibilityScope = typeof TASK020_VISIBILITY_SCOPES[number];
export type Task020EgressDecision = typeof TASK020_EGRESS_DECISIONS[number];
export type Task020RetentionAction = typeof TASK020_RETENTION_ACTIONS[number];
export type Task020ExportStatus = typeof TASK020_EXPORT_STATUSES[number];
export type Task020DeleteStatus = typeof TASK020_DELETE_STATUSES[number];
export type Task020GovernanceAuditEventType = typeof TASK020_GOVERNANCE_AUDIT_EVENTS[number];
export type Task020ForbiddenField = typeof TASK020_FORBIDDEN_FIELDS[number];

export interface Task020GovernanceContext {
  schoolId: string;
  actorId: string;
  actorRole: Task020ActorRole;
  targetLearnerId?: string;
  targetParentId?: string;
  targetTeacherId?: string;
  verifiedSchoolContext: boolean;
  correlationId?: string;
  requestId?: string;
}

export interface Task020DataClassification {
  category: Task020DataCategory;
  classificationLevel: Task020DataClassificationLevel;
  ownerType: 'learner' | 'school' | 'system' | 'shared';
  containsPii: boolean;
  containsRawContent: boolean;
  containsSafeguardingRaw: boolean;
  containsDeenSensitive: boolean;
  containsAnswerArtifact: boolean;
  containsProviderPayload: boolean;
  containsCredential: boolean;
  isExportEligible: boolean;
  isDeleteEligible: boolean;
  retentionCategory: string;
  reasonCodes: string[];
}

export interface Task020RoleAccessRequest {
  actorRole: Task020ActorRole;
  schoolId: string;
  targetLearnerId?: string;
  targetTeacherId?: string;
  targetParentId?: string;
  dataCategory: Task020DataCategory;
  requestedAction: 'read' | 'write' | 'update' | 'delete' | 'export' | 'audit';
}

export interface Task020RoleAccessDecision {
  allowed: boolean;
  actorRole: Task020ActorRole;
  dataCategory: Task020DataCategory;
  requestedAction: string;
  scope: string;
  redactionRequired: boolean;
  reasonCodes: string[];
}

export interface Task020PrivacyBoundaryDecision {
  allowed: boolean;
  redactionApplied: boolean;
  safeFieldPaths: string[];
  removedFieldPaths: string[];
  reasonCodes: string[];
}

export interface Task020AiEgressRequest {
  targetProvider: string;
  payloadFields: string[];
  tutorMode: string;
  containsRawLearnerContent: boolean;
  containsAnswerArtifact: boolean;
  containsSafeguardingRaw: boolean;
  containsDeenPrivateText: boolean;
  containsCredential: boolean;
  containsProviderPayload: boolean;
}

export interface Task020AiEgressDecision {
  allowed: boolean;
  egressDecision: Task020EgressDecision;
  sanitizedFields: string[];
  blockedReasons: string[];
  redactionApplied: boolean;
  reasonCodes: string[];
}

export interface Task020RetentionPolicyDecision {
  retentionAction: Task020RetentionAction;
  dataCategory: Task020DataCategory;
  retentionPeriodDays: number;
  requiresRedactionBeforeDelete: boolean;
  reasonCodes: string[];
}

export interface Task020ExportRequest {
  requestId: string;
  requesterRole: Task020ActorRole;
  schoolId: string;
  targetLearnerId?: string;
  exportType: 'learner_self' | 'school_admin' | 'safeguarding_review';
  status: Task020ExportStatus;
  createdAt: string;
  updatedAt: string;
  redactionRequired: boolean;
  reasonCodes: string[];
}

export interface Task020DeleteRequest {
  requestId: string;
  requesterRole: Task020ActorRole;
  schoolId: string;
  targetLearnerId?: string;
  deleteType: 'learner_self' | 'school_admin' | 'data_retention_policy';
  status: Task020DeleteStatus;
  createdAt: string;
  updatedAt: string;
  redactionRequired: boolean;
  safeguardingHold: boolean;
  auditHold: boolean;
  reasonCodes: string[];
}

export interface Task020TeacherVisibilityDecision {
  canSeeLearnerSummary: boolean;
  canSeeClassAggregate: boolean;
  canSeeRawLearnerWork: boolean;
  canSeeSafeguardingSignal: boolean;
  canSeeSafeguardingRaw: boolean;
  canSeeDeenSensitiveMetadata: boolean;
  visibilityScope: Task020VisibilityScope;
  reasonCodes: string[];
}

export interface Task020SafeguardingAccessDecision {
  canSeeSafeguardingSignal: boolean;
  canSeeSafeguardingRaw: boolean;
  accessGranted: boolean;
  visibilityScope: Task020VisibilityScope;
  auditRequired: boolean;
  reasonCodes: string[];
}

export interface Task020DeenSensitiveDataDecision {
  canAccess: boolean;
  requiresApprovedSource: boolean;
  canShareWithLearner: boolean;
  canShareWithTeacher: boolean;
  canShareWithParent: boolean;
  canShareWithPeer: boolean;
  canSendToAiProvider: boolean;
  redactionRequired: boolean;
  reasonCodes: string[];
}

export interface Task020SecurityConfigValidationResult {
  status: 'pass' | 'warn' | 'fail';
  checks: Array<{ checkName: string; status: 'pass' | 'warn' | 'fail' | 'skip'; safeMessage: string; required: boolean }>;
  safeWarnings: string[];
  safeErrors: string[];
  createdAt: string;
}

export interface Task020GovernanceAuditEvent {
  eventId: string;
  schoolId?: string;
  actorId?: string;
  actorRole: Task020ActorRole;
  targetStudentId?: string;
  targetParentId?: string;
  targetTeacherId?: string;
  dataCategory?: Task020DataCategory;
  classificationLevel?: Task020DataClassificationLevel;
  accessDecision?: Task020AccessDecision;
  egressDecision?: Task020EgressDecision;
  retentionAction?: Task020RetentionAction;
  exportRequestId?: string;
  deleteRequestId?: string;
  eventType: Task020GovernanceAuditEventType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface Task020GovernanceQuery {
  schoolId: string;
  actorId: string;
  actorRole: Task020ActorRole;
  filters?: Record<string, unknown>;
}

export interface Task020GovernanceRuntimeResult {
  allowed: boolean;
  accessDecision: Task020RoleAccessDecision;
  privacyDecision: Task020PrivacyBoundaryDecision;
  egressDecision?: Task020AiEgressDecision;
  retentionDecision?: Task020RetentionPolicyDecision;
  auditRecorded: boolean;
  reasonCodes: string[];
}
