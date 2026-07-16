export interface RecoveryCaseAdjudicationCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
  sourceRefsJson: Record<string, unknown>;
}

export interface RecoveryCaseAdjudicationSafeEnvelope<T = unknown> {
  success: boolean;
  status: string;
  data?: T;
  message?: string;
  correlationId?: string;
  errorCode?: string;
}

export interface RecoveryCaseAdjudicationPolicyDecision {
  allowed: boolean;
  denied: boolean;
  reasonCodes: string[];
}

export type RecoveryCaseAdjudicationReadinessStatus = 'draft' | 'ready' | 'review_ready' | 'stale' | 'blocked' | 'suppressed' | 'void';
export type RecoveryCaseReviewSessionStatus = 'draft' | 'in_progress' | 'review_ready' | 'needs_second_review' | 'needs_more_evidence' | 'blocked' | 'void';
export type RecoveryCaseEvidenceBundleStatus = 'draft' | 'review_ready' | 'stale' | 'blocked' | 'void';
export type RecoveryCaseReviewChecklistOutcome = 'pending' | 'ready' | 'needs_more_evidence' | 'needs_conflict_declaration' | 'needs_second_review' | 'blocked' | 'stale';
export type RecoveryCaseConflictType = 'none_declared' | 'priority_assessment_author' | 'override_requestor' | 'primary_reviewer' | 'secondary_reviewer' | 'source_record_author' | 'declared_personal_conflict' | 'other_declared_conflict';
export type RecoveryCaseConflictStatus = 'draft' | 'no_conflict' | 'blocked' | 'needs_alternate_reviewer' | 'void';
export type RecoveryCaseReviewerDecisionCode = 'confirm_priority' | 'recommend_lower_priority' | 'recommend_higher_priority' | 'request_more_evidence' | 'request_second_review' | 'recommend_escalation' | 'defer_review' | 'block_for_governance' | 'return_to_triage' | 'no_change';
export type RecoveryCaseReviewerPosition = 'primary' | 'secondary' | 'governance_resolver' | 'quality_reviewer';
export type RecoveryCaseDecisionStatus = 'draft' | 'review_ready' | 'needs_second_review' | 'needs_more_evidence' | 'blocked' | 'suppressed' | 'void' | 'archived_ready';
export type RecoveryCasePriorityBand = 'critical_review' | 'high' | 'normal' | 'low' | 'deferred';
export type RecoveryCaseOverrideStatus = 'draft' | 'review_ready' | 'needs_second_review' | 'approved_for_future_use' | 'rejected' | 'blocked' | 'suppressed' | 'void';
export type RecoveryCaseSecondReviewStatus = 'draft' | 'review_ready' | 'awaiting_distinct_reviewer' | 'review_received' | 'blocked' | 'suppressed' | 'void';
export type RecoveryCaseConsensusStatus = 'consensus_reached' | 'partial_consensus' | 'disagreement' | 'needs_more_evidence' | 'blocked' | 'void';
export type RecoveryCaseDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'blocked' | 'suppressed' | 'void';
export type RecoveryCaseDispositionCode = 'retain_in_queue' | 'defer_for_more_evidence' | 'second_review_required' | 'priority_override_proposed' | 'escalation_proposed' | 'return_to_triage' | 'governance_blocked' | 'archived_ready';
export type RecoveryCaseDispositionStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'blocked' | 'suppressed' | 'void';
export type RecoveryCaseAdjudicationSummaryStatus = 'draft' | 'review_ready' | 'stale' | 'blocked' | 'void';
export type RecoveryCaseAudienceRole = 'teacher' | 'lead_teacher' | 'department_head' | 'admin' | 'system_job';

export const ForbiddenAdjudicationActorRoles: readonly string[] = ['student', 'parent', 'guest', 'unknown'];

export const AllowedAdjudicationActorRoles: readonly string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];

export const ForbiddenAdjudicationStatuses: readonly string[] = [
  'executed', 'assigned', 'sent', 'published', 'authorized_live', 'live_authorized',
  'activated', 'closed_live', 'completed_live', 'synced', 'mutated',
];

export const ForbiddenAdjudicationEntityFields: readonly string[] = [
  'rawStudentAnswer', 'answerKeyText', 'correctAnswerSummary', 'rawRubric',
  'rubricInternal', 'hiddenReasoning', 'chainOfThought', 'unreleasedScore',
  'unreleasedGrade', 'diagnosis', 'medicalAssessment', 'psychologicalAssessment',
  'race', 'ethnicity', 'religiousIdentity', 'sectIdentity', 'genderIdentity',
  'sexualOrientation', 'familyIncome', 'paymentStatus', 'parentEngagementScore',
  'teacherPreferenceScore', 'aiDecision', 'aiConsensus', 'modelOutput',
  'generatedNarrative', 'notificationPayload', 'emailPayload', 'smsPayload',
  'pushPayload', 'whatsAppPayload', 'calendarEventPayload', 'liveAssignmentPayload',
  'portalPublishPayload', 'externalSyncPayload', 'scoreMutationPayload',
  'masteryMutationPayload', 'regradeExecutionPayload', 'pdfBuffer', 'pdfBase64',
  'ocrText',
];

export const ADJUDICATION_GOVERNANCE_POLICY_VERSION = 'RECOVERY_CASE_ADJUDICATION_POLICY_V1';
export const ADJUDICATION_QUALITY_POLICY_VERSION = 'RECOVERY_CASE_ADJUDICATION_QUALITY_V1';

export const AdjudicationDecisionCodes: readonly RecoveryCaseReviewerDecisionCode[] = [
  'confirm_priority', 'recommend_lower_priority', 'recommend_higher_priority',
  'request_more_evidence', 'request_second_review', 'recommend_escalation',
  'defer_review', 'block_for_governance', 'return_to_triage', 'no_change',
];

export const AdjudicationReviewerPositions: readonly RecoveryCaseReviewerPosition[] = [
  'primary', 'secondary', 'governance_resolver', 'quality_reviewer',
];

export const AdjudicationDispositionCodes: readonly RecoveryCaseDispositionCode[] = [
  'retain_in_queue', 'defer_for_more_evidence', 'second_review_required',
  'priority_override_proposed', 'escalation_proposed', 'return_to_triage',
  'governance_blocked', 'archived_ready',
];

export const AdjudicationPriorityOverrideBands: readonly RecoveryCasePriorityBand[] = [
  'critical_review', 'high', 'normal', 'low', 'deferred',
];
