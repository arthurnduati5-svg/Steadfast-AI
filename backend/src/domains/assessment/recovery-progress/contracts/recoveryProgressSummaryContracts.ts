export interface CreateProgressSummaryRequest {
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  summaryScope: string;
  safeSummary: string;
  progressStateJson?: Record<string, unknown>;
  observationCountsJson?: Record<string, unknown>;
  checkpointEvaluationCountsJson?: Record<string, unknown>;
  rollupRefsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}

export interface UpdateProgressSummaryRequest {
  summaryStatus?: string;
  safeSummary?: string;
  progressStateJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
}
