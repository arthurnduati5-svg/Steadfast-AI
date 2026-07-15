export interface CreateStudentProgressReflectionDraftRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressObservationId?: string;
  recoveryCheckpointEvaluationId?: string;
  safeReflectionSummary: string;
  studentReflectionPromptJson?: Record<string, unknown>;
  scaffoldStepsJson?: Record<string, unknown>;
  blockedFieldNamesJson?: string[];
  blockedReasonCodesJson?: string[];
}

export interface UpdateStudentProgressReflectionDraftRequest {
  draftStatus?: string;
  safeReflectionSummary?: string;
  blockedFieldNamesJson?: string[];
  blockedReasonCodesJson?: string[];
}
