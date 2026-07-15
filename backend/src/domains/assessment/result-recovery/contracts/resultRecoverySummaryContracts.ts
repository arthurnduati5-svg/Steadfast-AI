import { ResultRecoverySummaryStatus, ResultRecoverySummaryScope } from './resultRecoveryContracts';

export interface ResultRecoverySummary {
  resultRecoverySummaryId: string;
  schoolId: string;
  studentRef: string | null;
  summaryScope: ResultRecoverySummaryScope;
  summaryStatus: ResultRecoverySummaryStatus;
  safeSummary: string;
  planCountsJson: Record<string, unknown> | null;
  objectiveCountsJson: Record<string, unknown> | null;
  checkpointCountsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: string[] | null;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string | null;
  voidedAt: string | null;
}

export interface CreateRecoverySummaryInput {
  studentRef?: string;
  summaryScope?: ResultRecoverySummaryScope;
  safeSummary: string;
  planCountsJson?: Record<string, unknown>;
  objectiveCountsJson?: Record<string, unknown>;
  checkpointCountsJson?: Record<string, unknown>;
}

export interface ResultRecoverySummaryPreview {
  resultRecoverySummaryId: string;
  schoolId: string;
  summaryScope: string;
  summaryStatus: string;
  safeSummary: string;
  refreshedAt: string | null;
  createdAt: string;
}

export interface UpdateRecoverySummaryStatusInput {
  summaryStatus: string;
  reasonCode: string;
  safeMessage: string;
}
