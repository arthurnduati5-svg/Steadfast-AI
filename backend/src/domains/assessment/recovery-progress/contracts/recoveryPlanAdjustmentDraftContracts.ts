export interface CreatePlanAdjustmentDraftRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryCheckpointEvaluationId?: string;
  recoveryProgressObservationId?: string;
  adjustmentType: string;
  safeAdjustmentSummary: string;
  proposedChangesJson?: Record<string, unknown>;
  reasonCodesJson?: Record<string, unknown>;
  teacherReviewNotesJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}

export interface UpdatePlanAdjustmentDraftRequest {
  adjustmentStatus?: string;
  safeAdjustmentSummary?: string;
  proposedChangesJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}
