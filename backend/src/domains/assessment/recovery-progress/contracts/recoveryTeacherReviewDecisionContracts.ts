export interface CreateTeacherReviewDecisionRequest {
  schoolId: string;
  studentRef: string;
  teacherRef: string;
  resultRecoveryPlanId: string;
  recoveryPlanAdjustmentDraftId?: string;
  recoveryCheckpointEvaluationId?: string;
  recoveryEvidenceRollupId?: string;
  decisionType: string;
  safeDecisionSummary: string;
  decisionReasonCodesJson?: Record<string, unknown>;
  approvedFutureUseRefsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}

export interface UpdateTeacherReviewDecisionRequest {
  decisionStatus?: string;
  safeDecisionSummary?: string;
  blockedReasonCodesJson?: string[];
}
