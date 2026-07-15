export interface CreateProgressObservationRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  resultRecoveryStepId?: string;
  resultRecoveryCheckpointId?: string;
  resultFollowUpCaseId?: string;
  observationMode: string;
  observationType: string;
  observationConfidence: string;
  safeObservationSummary: string;
  sourceRefsJson?: Record<string, unknown>;
  observedSignalsJson?: Record<string, unknown>;
  allowedUseJson?: Record<string, unknown>;
  blockedUseJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}

export interface UpdateProgressObservationRequest {
  observationStatus?: string;
  safeObservationSummary?: string;
  sourceRefsJson?: Record<string, unknown>;
  observedSignalsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}
