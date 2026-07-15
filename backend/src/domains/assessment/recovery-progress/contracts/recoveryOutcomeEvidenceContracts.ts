export interface CreateOutcomeEvidenceRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  recoveryProgressObservationId?: string;
  recoveryCheckpointEvaluationId?: string;
  evidenceType: string;
  safeEvidenceSummary: string;
  sourceEvidenceRefsJson?: Record<string, unknown>;
  learningObjectiveRefsJson?: Record<string, unknown>;
  questionRefsJson?: Record<string, unknown>;
  resourceRefsJson?: Record<string, unknown>;
  allowedAudienceJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}

export interface UpdateOutcomeEvidenceRequest {
  evidenceStatus?: string;
  safeEvidenceSummary?: string;
  blockedReasonCodesJson?: string[];
}
