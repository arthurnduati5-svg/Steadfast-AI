export interface RecoveryCaseAdjudicationSummary {
  adjudicationSummaryId: string;
  schoolId: string;
  studentRef?: string;
  resultRecoveryPlanId?: string;
  queueItemId?: string;
  summaryStatus: string;
  safeSummary: string;
  adjudicationCounts: Record<string, number>;
  consensusCounts: Record<string, number>;
  disagreementCounts: Record<string, number>;
  dispositionCounts: Record<string, number>;
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateAdjudicationSummaryInput {
  schoolId: string;
  studentRef?: string;
  resultRecoveryPlanId?: string;
  queueItemId?: string;
  safeSummary: string;
  adjudicationCounts: Record<string, number>;
  consensusCounts: Record<string, number>;
  disagreementCounts: Record<string, number>;
  dispositionCounts: Record<string, number>;
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}
