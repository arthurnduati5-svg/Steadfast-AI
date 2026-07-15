export interface CreateCheckpointEvaluationRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  resultRecoveryCheckpointId: string;
  recoveryProgressObservationId?: string;
  evaluationMode: string;
  evaluationResult: string;
  safeEvaluationSummary: string;
  criteriaRefsJson?: Record<string, unknown>;
  criteriaResultsJson?: Record<string, unknown>;
  evidenceRefsJson?: Record<string, unknown>;
  recommendedNextStateJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}

export interface UpdateCheckpointEvaluationRequest {
  evaluationStatus?: string;
  evaluationResult?: string;
  safeEvaluationSummary?: string;
  blockedReasonCodesJson?: string[];
}
