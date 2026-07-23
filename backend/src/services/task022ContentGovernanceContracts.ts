export type CurriculumFamily = 'cambridge_academic' | 'madrasa_deen' | 'school_custom' | 'system_seed';

export type CurriculumVersionStatus = 'draft' | 'active' | 'deprecated' | 'archived' | 'blocked';

export type SourceType = 'curriculum_specification' | 'teacher_note' | 'school_approved_material' | 'madrasa_text' | 'approved_islamic_reference' | 'exercise_bank' | 'rubric' | 'lesson_plan' | 'external_link_reference';

export type SourceApprovalStatus = 'approved' | 'pending_review' | 'teacher_proposed' | 'school_proposed' | 'deprecated' | 'rejected' | 'blocked';

export type SourceTrustLevel = 'system_seeded' | 'school_approved' | 'teacher_approved' | 'review_required' | 'restricted' | 'blocked';

export type ContentItemStatus = 'active' | 'draft' | 'pending_review' | 'approved' | 'deprecated' | 'rejected' | 'blocked';

export type ContentItemType = 'concept_note' | 'socratic_prompt' | 'hint' | 'worked_example_teacher_only' | 'practice_question' | 'challenge_prompt' | 'remediation_step' | 'revision_prompt' | 'deen_explanation' | 'deen_referral_message' | 'assessment_rubric_teacher_only';

export type ContentSensitivity = 'basic' | 'source_required' | 'scholar_referral' | 'sensitive' | 'private' | 'unknown';

export type ContentReviewState = 'not_reviewed' | 'in_review' | 'approved' | 'changes_requested' | 'rejected' | 'blocked';

export type ContentUsePolicy = 'allow_learner' | 'allow_teacher_only' | 'allow_admin_only' | 'block_all';

export type DeenSensitivityLevel = 'basic_curriculum' | 'advanced_source_sensitive' | 'fiqh_like' | 'sectarian_sensitive' | 'private_doubt' | 'unapproved_claim' | 'referral_required' | 'unknown';

export type DeenReferralDecision = 'no_referral' | 'teacher_referral' | 'scholar_referral' | 'safeguarding_referral' | 'safe_humility_response' | 'blocked';

export type ContentGroundingDecision = 'grounded' | 'gap' | 'referral_required' | 'denied';

export type GapType = 'missing_curriculum_mapping' | 'missing_approved_source' | 'missing_content_item' | 'source_pending_review' | 'source_restricted' | 'deen_referral_required' | 'deprecated_curriculum_version' | 'blocked_content' | 'teacher_review_required';

export type GovernanceAuditEventType = 'curriculum_resolved' | 'curriculum_gap_detected' | 'source_approved' | 'source_rejected' | 'source_deprecated' | 'content_item_approved' | 'content_item_blocked' | 'content_grounding_allowed' | 'content_grounding_denied' | 'deen_referral_required' | 'teacher_only_content_filtered' | 'answer_key_filtered' | 'curriculum_import_dry_run';

export interface CurriculumVersion {
  id: string;
  schoolId?: string;
  curriculumFamily: CurriculumFamily;
  versionCode: string;
  title: string;
  status: CurriculumVersionStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumSubject {
  subjectId: string;
  name: string;
  normalizedName: string;
  curriculumFamily: CurriculumFamily;
}

export interface CurriculumStage {
  stageId: string;
  subjectId: string;
  stageCode?: string;
  title: string;
}

export interface CurriculumTopic {
  topicId: string;
  curriculumVersionId?: string;
  subject: string;
  stage?: string;
  topicCode?: string;
  title: string;
  descriptionSafe?: string;
  status: ContentItemStatus;
  metadata?: Record<string, unknown>;
}

export interface CurriculumSkill {
  skillId: string;
  curriculumTopicId: string;
  skillCode?: string;
  title: string;
  studentSafeDescription?: string;
  teacherSafeDescription?: string;
  difficultyBand?: string;
  status: ContentItemStatus;
  metadata?: Record<string, unknown>;
}

export interface LearningObjective {
  objectiveId: string;
  curriculumSkillId: string;
  objectiveCode?: string;
  title: string;
  studentSafeDescription?: string;
  teacherSafeDescription?: string;
  status: ContentItemStatus;
  sourceRequirement?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface PrerequisiteLink {
  fromSkillId: string;
  toSkillId: string;
  relationshipType: string;
  reasonCodes?: string[];
}

export interface CurriculumMap {
  curriculumFamily: CurriculumFamily;
  curriculumVersion?: CurriculumVersion;
  subject?: string;
  stage?: string;
  topics: CurriculumTopic[];
  skills: CurriculumSkill[];
  objectives: LearningObjective[];
  prerequisites: PrerequisiteLink[];
}

export interface ApprovedSource {
  id: string;
  schoolId?: string;
  sourceKey: string;
  title: string;
  sourceType: SourceType;
  curriculumFamily: CurriculumFamily;
  subject?: string;
  stage?: string;
  topic?: string;
  deenCategory?: string;
  trustLevel: SourceTrustLevel;
  approvalStatus: SourceApprovalStatus;
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

export interface ContentItem {
  id: string;
  schoolId?: string;
  curriculumVersionId?: string;
  topicId?: string;
  skillId?: string;
  learningObjectiveId?: string;
  sourceId?: string;
  contentType: ContentItemType;
  status: ContentItemStatus;
  sensitivity: ContentSensitivity;
  studentSafeContent?: string;
  teacherSafeContent?: string;
  answerKeyProtected: boolean;
  teacherOnly: boolean;
  reviewState: ContentReviewState;
  reasonCodes?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContentUseDecision {
  policy: ContentUsePolicy;
  reasonCodes: string[];
}

export interface DeenClassificationResult {
  level: DeenSensitivityLevel;
  confidence: number;
  reasonCodes: string[];
}

export interface DeenHandlingDecision {
  level: DeenSensitivityLevel;
  referral: DeenReferralDecision;
  safeSummary: string;
  reasonCodes: string[];
}

export interface ContentGroundingResult {
  decision: ContentGroundingDecision;
  safeContentContext?: string;
  approvedSourceIds?: string[];
  curriculumMap?: CurriculumMap;
  learningObjectiveIds?: string[];
  sensitivity?: ContentSensitivity;
  usePolicy?: ContentUsePolicy;
  gapReason?: string;
  referralDecision?: DeenReferralDecision;
  reasonCodes: string[];
}

export interface CurriculumRetrievalRequest {
  curriculumFamily: CurriculumFamily;
  subject?: string;
  topic?: string;
  skill?: string;
  learningObjectiveId?: string;
  stage?: string;
  sourceTrustLevel?: SourceTrustLevel;
  schoolId?: string;
}

export interface CurriculumRetrievalResult {
  found: boolean;
  topics: CurriculumTopic[];
  skills: CurriculumSkill[];
  objectives: LearningObjective[];
  sources: ApprovedSource[];
  contentItems: ContentItem[];
  reasonCodes: string[];
}

export interface ContentGapRecord {
  id: string;
  schoolId?: string;
  curriculumFamily: CurriculumFamily;
  subject?: string;
  topic?: string;
  skill?: string;
  gapType: GapType;
  status: string;
  safeSummary: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface ContentGovernanceAuditRecord {
  id: string;
  schoolId?: string;
  actorId?: string;
  actorRole: string;
  eventType: GovernanceAuditEventType;
  curriculumFamily?: CurriculumFamily;
  curriculumVersionId?: string;
  sourceId?: string;
  contentItemId?: string;
  decision: string;
  reasonCodes: string[];
  privacyMetadata?: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt: string;
}

export interface CurriculumImportDryRunItem {
  topic?: string;
  skill?: string;
  objective?: string;
  issues: string[];
  severity: 'info' | 'warning' | 'error';
}

export interface CurriculumImportDryRunResult {
  valid: boolean;
  itemCount: number;
  items: CurriculumImportDryRunItem[];
  duplicateTopics: string[];
  duplicateSkills: string[];
  duplicateObjectives: string[];
  missingSourceApprovals: string[];
  deenSensitiveItemsRequiringReview: string[];
  teacherOnlyFieldsDetected: string[];
  answerKeyFieldsDetected: string[];
  summary: string;
}

export interface ContentGapSummary {
  gapType: GapType;
  count: number;
  items: ContentGapRecord[];
}

export interface ContentGovernanceDiagnostics {
  activeCurriculumVersions: number;
  approvedSourceCount: number;
  pendingReviewCount: number;
  contentGapsByType: { gapType: GapType; count: number }[];
  blockedSourceCount: number;
  deprecatedSourceCount: number;
  deenReferralCountByCategory: { category: string; count: number }[];
  contentGroundingSuccessCount: number;
  contentGroundingFailureCount: number;
}
