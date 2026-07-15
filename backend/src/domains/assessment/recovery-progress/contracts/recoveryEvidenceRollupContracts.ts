export interface CreateEvidenceRollupRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  rollupScope: string;
  safeRollupSummary: string;
  observationCountsJson?: Record<string, unknown>;
  evaluationCountsJson?: Record<string, unknown>;
  evidenceCountsJson?: Record<string, unknown>;
  adjustmentCountsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}

export interface UpdateEvidenceRollupRequest {
  rollupStatus?: string;
  safeRollupSummary?: string;
  blockedReasonCodesJson?: string[];
}
