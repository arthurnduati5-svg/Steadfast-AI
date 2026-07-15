export interface CreateParentProgressNoteDraftRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressObservationId?: string;
  recoveryCheckpointEvaluationId?: string;
  audienceType: string;
  safeProgressSummary: string;
  parentProgressBodyJson?: Record<string, unknown>;
  allowedFieldNamesJson?: string[];
  blockedFieldNamesJson?: string[];
  blockedReasonCodesJson?: string[];
}

export interface UpdateParentProgressNoteDraftRequest {
  draftStatus?: string;
  safeProgressSummary?: string;
  allowedFieldNamesJson?: string[];
  blockedFieldNamesJson?: string[];
  blockedReasonCodesJson?: string[];
}
