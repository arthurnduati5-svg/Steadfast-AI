export type RecoveryOutcomeDecisionStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type RecoveryOutcomeDecisionMode = 'mock_decision_only' | 'future_decision_execution' | 'teacher_review_only' | 'metadata_only';
export type RecoveryOutcomeDecisionType = 'continue' | 'intensify' | 'pause' | 'close' | 'graduation';
export type RecoveryExitCriteriaType = 'mastery_threshold' | 'confidence_threshold' | 'progress_rate' | 'checkpoint_completion' | 'teacher_judgment' | 'time_based' | 'metadata_only';
export type RecoveryExitCriteriaEvaluationResult = 'met' | 'partially_met' | 'not_met' | 'insufficient_evidence' | 'blocked_for_safety' | 'metadata_only';
export type RecoveryClosureType = 'graduation' | 'teacher_discretion' | 'plan_completed' | 'student_transfer' | 'archived' | 'metadata_only';

export const ALLOWED_OUTCOME_CREATION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
export const BLOCKED_OUTCOME_CREATION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const FORBIDDEN_OUTCOME_FIELDS: string[] = [
  'liveRecoveryCompletionPayload', 'liveRecoveryClosurePayload',
  'liveAssignmentPayload', 'homeworkAssignmentPayload', 'practiceAssignmentPayload', 'revisionTaskPayload',
  'parentNotificationPayload', 'studentNotificationPayload', 'teacherNotificationPayload',
  'emailPayload', 'smsPayload', 'pushPayload', 'whatsAppPayload', 'calendarEventPayload',
  'scoreMutationPayload', 'masteryMutationPayload', 'resultOverwritePayload', 'regradeExecutionPayload',
  'generatedQuestionText', 'generatedAnswerKey', 'aiNarrative', 'generatedNarrative', 'modelOutput',
  'ocrText', 'pdfBinary', 'pdfBase64', 'htmlExport', 'externalSyncPayload',
  'parentPortalPayload', 'studentPortalPayload', 'teacherDashboardPayload',
];

export interface RecoveryOutcomeCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey?: string;
  requestId?: string;
}

export interface RecoveryOutcomePolicyDecision {
  allowed: boolean;
  policyFamily: string;
  decision: string;
  reasonCode?: string;
  safeMessage?: string;
  blockedReasonCodes?: string[];
}

export interface RecoveryOutcomeSafeEnvelope {
  ok: boolean;
  requestId?: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: RecoveryOutcomePolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}

export interface RecoveryOutcomeAuditEvent {
  recoveryOutcomeAuditId: string;
  schoolId: string;
  recoveryOutcomeDecisionReadinessId?: string;
  recoveryExitCriteriaId?: string;
  recoveryContinuationDecisionDraftId?: string;
  recoveryIntensificationDecisionDraftId?: string;
  recoveryPauseDecisionDraftId?: string;
  recoveryClosureDecisionDraftId?: string;
  recoveryOutcomeTeacherReviewPacketId?: string;
  recoveryOutcomeStudentNextStepDraftId?: string;
  recoveryOutcomeParentUpdateDraftId?: string;
  recoveryOutcomeDecisionSummaryId?: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown>;
  metadataJson: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt: string;
}

export interface RecoveryOutcomeIdempotencyEntry {
  recoveryOutcomeIdempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  safeResultSummary?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}
