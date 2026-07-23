import type {
  CurriculumFamily, SourceApprovalStatus, SourceTrustLevel, SourceType,
  CurriculumVersionStatus, ContentItemStatus, ContentItemType,
  ContentSensitivity, ContentReviewState, ContentUsePolicy,
  ContentGroundingDecision, DeenReferralDecision, GapType,
  GovernanceAuditEventType, ContentUseDecision,
} from '../services/task022ContentGovernanceContracts';

export type {
  CurriculumFamily, SourceApprovalStatus, SourceTrustLevel, SourceType,
  CurriculumVersionStatus, ContentItemStatus, ContentItemType,
  ContentSensitivity, ContentReviewState, ContentUsePolicy,
  ContentGroundingDecision, DeenReferralDecision, GapType,
  GovernanceAuditEventType, ContentUseDecision,
};

// ── Actor Types ──────────────────────────────────────────────────

export type GovernanceActorRole = 'learner' | 'teacher' | 'school_admin' | 'system_admin' | 'internal_operator' | 'safeguarding_officer' | 'deen_reviewer';

export interface GovernanceActor {
  id: string;
  role: GovernanceActorRole;
  schoolId?: string;
}

// ── Constants ────────────────────────────────────────────────────

export const TASK022_SOURCE_TYPES: readonly string[] = [
  'curriculum_specification', 'teacher_note', 'school_approved_material',
  'madrasa_text', 'approved_islamic_reference', 'exercise_bank',
  'rubric', 'lesson_plan', 'external_link_reference',
];

export const TASK022_SOURCE_APPROVAL_STATUSES: readonly string[] = [
  'approved', 'pending_review', 'teacher_proposed', 'school_proposed',
  'deprecated', 'rejected', 'blocked',
];

export const TASK022_SOURCE_VISIBILITY_SCOPES: readonly string[] = [
  'school', 'district', 'system', 'teacher_only', 'admin_only', 'learner_safe',
];

export const TASK022_CURRICULUM_TYPES: readonly string[] = [
  'cambridge_academic', 'madrasa_deen', 'school_custom', 'system_seed',
];

export const TASK022_CURRICULUM_VERSION_STATUSES: readonly string[] = [
  'draft', 'active', 'deprecated', 'archived', 'blocked',
];

export const TASK022_CONTENT_ITEM_TYPES: readonly string[] = [
  'concept_note', 'socratic_prompt', 'hint', 'worked_example_teacher_only',
  'practice_question', 'challenge_prompt', 'remediation_step',
  'revision_prompt', 'deen_explanation', 'deen_referral_message',
  'assessment_rubric_teacher_only',
];

export const TASK022_CONTENT_GOVERNANCE_STATUSES: readonly string[] = [
  'active', 'draft', 'pending_review', 'approved', 'deprecated', 'rejected', 'blocked',
];

export const TASK022_CONTENT_GROUNDING_DECISIONS: readonly string[] = [
  'grounded', 'gap', 'referral_required', 'denied',
];

export const TASK022_CONTENT_GAP_TYPES: readonly string[] = [
  'missing_curriculum_mapping', 'missing_approved_source', 'missing_content_item',
  'source_pending_review', 'source_restricted', 'deen_referral_required',
  'deprecated_curriculum_version', 'blocked_content', 'teacher_review_required',
];

export const TASK022_FORBIDDEN_FIELDS: ReadonlySet<string> = new Set([
  'answerKey', 'answer_key', 'correctAnswer', 'correct_answer',
  'modelAnswer', 'model_answer', 'markingScheme', 'marking_scheme',
  'privateDeenText', 'private_deen_text', 'deenSensitiveRaw', 'deen_sensitive_raw',
  'rawDeenText', 'raw_deen_text', 'safeguardingRaw', 'safeguarding_raw',
  'safeguardingCaseNote', 'safeguarding_case_note', 'safeguardingDisclosure',
  'safeguarding_disclosure', 'hiddenReasoning', 'hidden_reasoning',
  'chainOfThought', 'chain_of_thought', 'scratchpad',
  'providerPrompt', 'provider_prompt', 'providerResponse', 'provider_response',
  'rawProviderResponse', 'raw_provider_response', 'rawPayload', 'raw_payload',
  'authorization', 'apiKey', 'api_key', 'token', 'cookie', 'privateKey',
  'private_key', 'connectionString', 'connection_string', 'password', 'secret',
]);

// ── String Literal Type Aliases ──────────────────────────────────

export type Task022SourceType = typeof TASK022_SOURCE_TYPES[number];
export type Task022SourceApprovalStatus = typeof TASK022_SOURCE_APPROVAL_STATUSES[number];
export type Task022CurriculumType = typeof TASK022_CURRICULUM_TYPES[number];
export type Task022CurriculumVersionStatus = typeof TASK022_CURRICULUM_VERSION_STATUSES[number];
export type Task022ContentItemType = typeof TASK022_CONTENT_ITEM_TYPES[number];
export type Task022ContentGovernanceStatus = typeof TASK022_CONTENT_GOVERNANCE_STATUSES[number];
export type Task022ContentGroundingDecisionValue = typeof TASK022_CONTENT_GROUNDING_DECISIONS[number];

// ── Generic Context ──────────────────────────────────────────────

export interface Task022CurriculumGovernanceContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  verifiedSchoolContext: boolean;
  curriculumType?: string;
  subjectId?: string;
  subjectKey?: string;
  correlationId?: string;
  requestId?: string;
}

// ── Source Contracts ─────────────────────────────────────────────

export interface Task022ApprovedSource {
  id: string;
  sourceId: string;
  schoolId?: string;
  sourceKey: string;
  title: string;
  sourceType: string;
  curriculumFamily?: string;
  curriculumType?: string;
  subject?: string;
  stage?: string;
  topic?: string;
  deenCategory?: string;
  trustLevel?: string;
  approvalStatus: string;
  visibilityScope?: string;
  approvedByActorId?: string;
  approvedByRole?: string;
  approvedAt?: string;
  reviewRequired: boolean;
  restrictedUse: boolean;
  citationMetadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Task022SourceApprovalRequest {
  id: string;
  requestId: string;
  sourceId: string;
  schoolId: string;
  requestedByActorId: string;
  requestedByRole: string;
  requestNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task022SourceApprovalDecision {
  id: string;
  decisionId: string;
  sourceId: string;
  schoolId: string;
  decidedByActorId: string;
  decidedByRole: string;
  decision: string;
  visibilityScope?: string;
  reasonCodes: string[];
  safeNotes?: string;
  decidedAt: string;
}

// ── Curriculum Contracts ─────────────────────────────────────────

export interface Task022CurriculumRegistryEntry {
  id: string;
  curriculumId: string;
  schoolId?: string;
  curriculumType: string;
  title: string;
  subjectId?: string;
  subjectKey?: string;
  curriculumFamily?: string;
  versionCount: number;
  activeVersionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Task022CurriculumVersion {
  id: string;
  curriculumVersionId: string;
  curriculumId: string;
  schoolId?: string;
  versionCode: string;
  title: string;
  status: string;
  curriculumFamily?: string;
  curriculumType?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Content Item Contracts ───────────────────────────────────────

export interface Task022ContentItem {
  id: string;
  contentItemId: string;
  schoolId?: string;
  curriculumVersionId?: string;
  curriculumId?: string;
  topicId?: string;
  skillId?: string;
  learningObjectiveId?: string;
  sourceId?: string;
  contentType: string;
  governanceStatus: string;
  sensitivity?: string;
  studentSafeContent?: string;
  teacherSafeContent?: string;
  answerKeyProtected: boolean;
  teacherOnly: boolean;
  reviewState?: string;
  reasonCodes?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Map Contracts ────────────────────────────────────────────────

export interface Task022TopicSkillObjectiveMap {
  id: string;
  mapId: string;
  curriculumVersionId: string;
  topicId: string;
  topicTitle: string;
  schoolId?: string;
  subject?: string;
  skillIds: string[];
  objectiveIds: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Task022LearningObjectiveGovernanceRecord {
  id: string;
  recordId: string;
  objectiveId: string;
  schoolId?: string;
  curriculumVersionId?: string;
  governanceStatus: string;
  sourceRequirement?: Record<string, unknown>;
  requiresApprovedSource: boolean;
  requiresCambridgeSource: boolean;
  requiresDeenSource: boolean;
  reasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Grounding Contracts ──────────────────────────────────────────

export interface Task022ContentGroundingRequest {
  requestId: string;
  contentItemId: string;
  curriculumVersionId?: string;
  sourceId?: string;
  schoolId?: string;
  requestedByActorId?: string;
  requestedByRole?: string;
  context?: Record<string, unknown>;
  createdAt: string;
}

export interface Task022ContentRetrievalRequest {
  curriculumType?: string;
  curriculumFamily?: string;
  subject?: string;
  topic?: string;
  skill?: string;
  learningObjectiveId?: string;
  stage?: string;
  sourceTrustLevel?: string;
  schoolId?: string;
  requireApprovedSource: boolean;
  requireGroundedContent: boolean;
}

export interface Task022CurriculumImportDryRunRequest {
  importId: string;
  schoolId: string;
  curriculumType: string;
  subjectId?: string;
  payload: Record<string, unknown>;
  requestedByActorId: string;
  requestedByRole: string;
  createdAt: string;
}

// ── Additional Governance Types ──────────────────────────────────

export interface Task022PrerequisiteMapEntry {
  id: string;
  schoolId?: string;
  fromSkillId: string;
  toSkillId: string;
  objectiveId?: string;
  relationshipType: string;
  reasonCodes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task022ContentGovernanceDecision {
  id: string;
  schoolId?: string;
  governanceType: string;
  resourceType: string;
  resourceId: string;
  actorRole: string;
  decision: string;
  reasonCodes: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Task022ContentGroundingDecision {
  id: string;
  schoolId?: string;
  curriculumFamily?: string;
  subject?: string;
  topic?: string;
  skill?: string;
  learnerFacing: boolean;
  decision: string;
  safeContentContext?: string;
  approvedSourceIds?: string[];
  learningObjectiveIds?: string[];
  gapReason?: string;
  referralDecision?: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task022ContentGapDecision {
  id: string;
  schoolId?: string;
  curriculumFamily: string;
  subject?: string;
  topic?: string;
  skill?: string;
  gapType: string;
  safeSummary: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task022ContentRetrievalResult {
  id: string;
  schoolId?: string;
  found: boolean;
  topics: string[];
  skills: string[];
  objectives: string[];
  sources: string[];
  contentItems: string[];
  reasonCodes: string[];
  createdAt: string;
}

export interface Task022CurriculumImportDryRunResult {
  id: string;
  schoolId?: string;
  valid: boolean;
  itemCount: number;
  duplicateTopics: string[];
  duplicateSkills: string[];
  duplicateObjectives: string[];
  missingSourceApprovals: string[];
  deenSensitiveItemsRequiringReview: string[];
  teacherOnlyFieldsDetected: string[];
  answerKeyFieldsDetected: string[];
  summary: string;
  createdAt: string;
}

export interface Task022CambridgeAcademicContentDecision {
  id: string;
  schoolId?: string;
  subject?: string;
  topic?: string;
  skill?: string;
  learnerFacing: boolean;
  decision: string;
  safeContentContext?: string;
  approvedSourceIds?: string[];
  learningObjectiveIds?: string[];
  gapReason?: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task022MadrasaDeenContentDecision {
  id: string;
  schoolId?: string;
  subject?: string;
  topic?: string;
  classificationLevel: string;
  confidence: number;
  referral: string;
  safeSummary: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task022DeenSourcePolicyDecision {
  id: string;
  schoolId?: string;
  sourceId: string;
  deenCategory?: string;
  approvalStatus: string;
  referralRequired: boolean;
  referralRole?: string;
  safeNotes?: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task022TutorChallengeRemediationContentDecision {
  id: string;
  schoolId?: string;
  challengeType: string;
  curriculumFamily?: string;
  subject?: string;
  topic?: string;
  skill?: string;
  learnerFacing: boolean;
  groundingDecision: string;
  canProceed: boolean;
  gapReason?: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task022ContentGovernanceDiagnostic {
  id: string;
  schoolId?: string;
  metricName: string;
  metricValue: number;
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

export interface Task022ContentGovernanceAuditEvent {
  id: string;
  schoolId?: string;
  actorRole: string;
  eventType: string;
  curriculumFamily?: string;
  sourceId?: string;
  contentItemId?: string;
  decision: string;
  reasonCodes: string[];
  privacyMetadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Safe Response Types (for route responses) ────────────────────

export interface SafeSourceResponse {
  id: string;
  title: string;
  sourceType: string;
  curriculumFamily: string;
  subject?: string;
  topic?: string;
  trustLevel: string;
  approvalStatus: string;
  reviewRequired: boolean;
  restrictedUse: boolean;
}

export interface SafeCurriculumResponse {
  id: string;
  curriculumFamily: string;
  versionCode: string;
  title: string;
  status: string;
}

export interface SafeContentItemResponse {
  id: string;
  contentType: string;
  status: string;
  topicId?: string;
  skillId?: string;
}
