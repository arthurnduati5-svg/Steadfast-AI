export type RecoveryOutcomeSummaryStatus = 'active' | 'stale' | 'blocked' | 'void';

export interface RecoveryOutcomeDecisionSummary {
  recoveryOutcomeDecisionSummaryId: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  summaryStatus: RecoveryOutcomeSummaryStatus;
  safeSummary: string;
  decisionCountsJson: Record<string, unknown>;
  topDecisionsJson: Record<string, unknown>;
  nextActionRefsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt?: string;
  staleAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryOutcomeDecisionSummaryCreateRequest {
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  safeSummary: string;
  decisionCountsJson: Record<string, unknown>;
  topDecisionsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
}
