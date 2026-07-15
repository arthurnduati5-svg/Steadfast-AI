export type RecoveryProgressObservationStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type RecoveryProgressObservationMode = 'mock_observation_only' | 'future_progress_observation' | 'teacher_review_only' | 'metadata_only';
export type RecoveryProgressObservationType = 'checkpoint_response' | 'practice_readiness_signal' | 'reflection_quality_signal' | 'teacher_observation' | 'parent_safe_context' | 'resource_usage_reference' | 'confidence_signal' | 'objective_movement_signal';
export type RecoveryProgressObservationConfidence = 'low' | 'medium' | 'high' | 'manual_review_required';

export type RecoveryCheckpointEvaluationStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type RecoveryCheckpointEvaluationMode = 'mock_evaluation_only' | 'future_checkpoint_evaluation' | 'teacher_review_only' | 'metadata_only';
export type RecoveryCheckpointEvaluationResult = 'on_track_ready' | 'needs_more_review' | 'adjustment_suggested' | 'insufficient_evidence' | 'blocked_for_safety' | 'metadata_only';

export type RecoveryOutcomeEvidenceStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'void';
export type RecoveryOutcomeEvidenceType = 'learning_evidence_ref' | 'revision_signal_ref' | 'existing_question_ref' | 'reflection_ref' | 'teacher_observation_ref' | 'checkpoint_evaluation_ref' | 'resource_usage_ref' | 'metadata_only';

export type RecoveryPlanAdjustmentDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type RecoveryPlanAdjustmentDraftType = 'sequence_adjustment' | 'objective_priority_adjustment' | 'checkpoint_timing_adjustment' | 'practice_reference_adjustment' | 'resource_reference_adjustment' | 'support_guidance_adjustment' | 'teacher_review_required' | 'metadata_only';

export type RecoveryTeacherReviewDecisionStatus = 'draft' | 'reviewed' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type RecoveryTeacherReviewDecisionType = 'approve_future_adjustment' | 'request_more_review' | 'suppress_adjustment' | 'block_for_safety' | 'mark_metadata_reviewed' | 'metadata_only';

export type RecoveryStudentProgressReflectionDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';
export type RecoveryParentProgressNoteDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'void';

export type RecoveryEvidenceRollupStatus = 'draft' | 'active' | 'suppressed' | 'blocked' | 'void';
export type RecoveryEvidenceRollupScope = 'school' | 'student' | 'teacher' | 'recovery_plan' | 'objective' | 'checkpoint';

export type RecoveryProgressSummaryStatus = 'active' | 'stale' | 'blocked' | 'void';
export type RecoveryProgressSummaryScope = 'school' | 'student' | 'teacher' | 'recovery_plan' | 'checkpoint' | 'progress_state';

export const ALLOWED_PROGRESS_CREATION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
export const BLOCKED_PROGRESS_CREATION_ROLES: string[] = ['student', 'parent', 'guest', 'unknown'];

export const FORBIDDEN_PROGRESS_FIELDS: string[] = [
  'answerKeySafeRef', 'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rubricText',
  'rawRubric', 'markingNotesTeacherOnly', 'teacherOnlyNotes', 'hiddenReasoning', 'chainOfThought',
  'rawStudentAnswer', 'unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization',
  'finalGradeBeforeRelease', 'diagnosis', 'medicalAssessment', 'psychologicalAssessment',
  'legalAssessment', 'riskLabelUnsafe', 'safeguardingDetailsUnsafe',
  'parentNotificationPayload', 'studentNotificationPayload', 'teacherNotificationPayload',
  'emailPayload', 'smsPayload', 'pushPayload', 'whatsAppPayload',
  'liveTaskPayload', 'liveAssignmentPayload', 'homeworkAssignmentPayload',
  'practiceAssignmentPayload', 'revisionTaskPayload',
  'calendarEventPayload', 'externalSyncPayload',
  'liveProviderPayload', 'apiKey', 'providerSecret',
  'aiNarrative', 'generatedNarrative', 'modelOutput',
  'generatedQuestionText', 'generatedAnswerKey',
  'ocrText', 'pdfBinary', 'pdfBuffer', 'pdfBase64', 'htmlExport', 'htmlFile',
  'scoreMutationPayload', 'masteryMutationPayload', 'resultOverwritePayload',
  'liveProgressUpdatePayload',
];

export interface RecoveryProgressCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey?: string;
  requestId?: string;
}

export interface RecoveryProgressPolicyDecision {
  allowed: boolean;
  policyFamily: string;
  decision: string;
  reasonCode?: string;
  safeMessage?: string;
  blockedReasonCodes?: string[];
}

export interface RecoveryProgressSafeEnvelope {
  ok: boolean;
  requestId?: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: RecoveryProgressPolicyDecision;
  nextAllowedActions?: string[];
  data?: unknown;
}

export interface RecoveryProgressObservation {
  recoveryProgressObservationId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  resultRecoveryStepId?: string;
  resultRecoveryCheckpointId?: string;
  resultFollowUpCaseId?: string;
  recoveryProgressSummaryId?: string;
  observationStatus: RecoveryProgressObservationStatus;
  observationMode: RecoveryProgressObservationMode;
  observationType: RecoveryProgressObservationType;
  observationConfidence: RecoveryProgressObservationConfidence;
  safeObservationSummary: string;
  sourceRefsJson: Record<string, unknown>;
  observedSignalsJson: Record<string, unknown>;
  allowedUseJson: Record<string, unknown>;
  blockedUseJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  recordedAt?: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryCheckpointEvaluation {
  recoveryCheckpointEvaluationId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  resultRecoveryCheckpointId: string;
  recoveryProgressObservationId?: string;
  evaluationStatus: RecoveryCheckpointEvaluationStatus;
  evaluationMode: RecoveryCheckpointEvaluationMode;
  evaluationResult: RecoveryCheckpointEvaluationResult;
  safeEvaluationSummary: string;
  criteriaRefsJson: Record<string, unknown>;
  criteriaResultsJson: Record<string, unknown>;
  evidenceRefsJson: Record<string, unknown>;
  recommendedNextStateJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  evaluatedAt?: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryOutcomeEvidence {
  recoveryOutcomeEvidenceId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  recoveryProgressObservationId?: string;
  recoveryCheckpointEvaluationId?: string;
  evidenceStatus: RecoveryOutcomeEvidenceStatus;
  evidenceType: RecoveryOutcomeEvidenceType;
  safeEvidenceSummary: string;
  sourceEvidenceRefsJson: Record<string, unknown>;
  learningObjectiveRefsJson: Record<string, unknown>;
  questionRefsJson: Record<string, unknown>;
  resourceRefsJson: Record<string, unknown>;
  allowedAudienceJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  voidedAt?: string;
}

export interface RecoveryPlanAdjustmentDraft {
  recoveryPlanAdjustmentDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryCheckpointEvaluationId?: string;
  recoveryProgressObservationId?: string;
  adjustmentStatus: RecoveryPlanAdjustmentDraftStatus;
  adjustmentType: RecoveryPlanAdjustmentDraftType;
  safeAdjustmentSummary: string;
  proposedChangesJson: Record<string, unknown>;
  reasonCodesJson: Record<string, unknown>;
  teacherReviewNotesJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryTeacherReviewDecision {
  recoveryTeacherReviewDecisionId: string;
  schoolId: string;
  studentRef: string;
  teacherRef: string;
  resultRecoveryPlanId: string;
  recoveryPlanAdjustmentDraftId?: string;
  recoveryCheckpointEvaluationId?: string;
  recoveryEvidenceRollupId?: string;
  decisionStatus: RecoveryTeacherReviewDecisionStatus;
  decisionType: RecoveryTeacherReviewDecisionType;
  safeDecisionSummary: string;
  decisionReasonCodesJson: Record<string, unknown>;
  approvedFutureUseRefsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryStudentProgressReflectionDraft {
  recoveryStudentProgressReflectionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressObservationId?: string;
  recoveryCheckpointEvaluationId?: string;
  draftStatus: RecoveryStudentProgressReflectionDraftStatus;
  safeReflectionSummary: string;
  studentReflectionPromptJson: Record<string, unknown>;
  scaffoldStepsJson: Record<string, unknown>;
  blockedFieldNamesJson: string[];
  blockedReasonCodesJson: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryParentProgressNoteDraft {
  recoveryParentProgressNoteDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressObservationId?: string;
  recoveryCheckpointEvaluationId?: string;
  audienceType: string;
  draftStatus: RecoveryParentProgressNoteDraftStatus;
  safeProgressSummary: string;
  parentProgressBodyJson: Record<string, unknown>;
  allowedFieldNamesJson: string[];
  blockedFieldNamesJson: string[];
  blockedReasonCodesJson: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryEvidenceRollup {
  recoveryEvidenceRollupId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  rollupStatus: RecoveryEvidenceRollupStatus;
  rollupScope: RecoveryEvidenceRollupScope;
  safeRollupSummary: string;
  observationCountsJson: Record<string, unknown>;
  evaluationCountsJson: Record<string, unknown>;
  evidenceCountsJson: Record<string, unknown>;
  adjustmentCountsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryProgressSummary {
  recoveryProgressSummaryId: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  summaryScope: RecoveryProgressSummaryScope;
  summaryStatus: RecoveryProgressSummaryStatus;
  safeSummary: string;
  progressStateJson: Record<string, unknown>;
  observationCountsJson: Record<string, unknown>;
  checkpointEvaluationCountsJson: Record<string, unknown>;
  rollupRefsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  createdAt: string;
  updatedAt: string;
  refreshedAt?: string;
  voidedAt?: string;
}

export interface RecoveryProgressAuditEvent {
  recoveryProgressAuditId: string;
  schoolId: string;
  recoveryProgressObservationId?: string;
  recoveryCheckpointEvaluationId?: string;
  recoveryOutcomeEvidenceId?: string;
  recoveryPlanAdjustmentDraftId?: string;
  recoveryTeacherReviewDecisionId?: string;
  recoveryStudentProgressReflectionDraftId?: string;
  recoveryParentProgressNoteDraftId?: string;
  recoveryEvidenceRollupId?: string;
  recoveryProgressSummaryId?: string;
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

export interface RecoveryProgressIdempotencyEntry {
  recoveryProgressIdempotencyId: string;
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
