import type { FollowUpSummaryStatus, FollowUpSummaryScope } from './resultFollowUpContracts';

export interface FollowUpSummary {
  followUpSummaryId: string;
  schoolId: string;
  studentRef: string | null;
  summaryScope: FollowUpSummaryScope;
  summaryStatus: FollowUpSummaryStatus;
  safeSummary: string;
  caseCountsJson: Record<string, unknown> | null;
  priorityCountsJson: Record<string, unknown> | null;
  statusCountsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string | null;
  voidedAt: string | null;
}

export interface CreateFollowUpSummaryInput {
  schoolId: string;
  studentRef?: string;
  summaryScope?: FollowUpSummaryScope;
  safeSummary: string;
  caseCounts?: Record<string, unknown>;
  priorityCounts?: Record<string, unknown>;
  statusCounts?: Record<string, unknown>;
}

export interface UpdateFollowUpSummaryStatusInput {
  summaryStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface FollowUpSummaryPreview {
  followUpSummaryId: string;
  schoolId: string;
  studentRef: string | null;
  summaryScope: string;
  summaryStatus: string;
  safeSummary: string;
  createdAt: string;
  refreshedAt: string | null;
}
