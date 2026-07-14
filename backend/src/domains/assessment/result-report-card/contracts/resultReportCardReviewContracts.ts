import type { ResultReportCardReviewStatus, ResultReportCardReviewType, ResultReportCardReviewDecision } from './resultReportCardContracts';

export interface ResultReportCardReview {
  resultReportCardReviewId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  resultReportCardAudienceProjectionId: string | null;
  reviewStatus: ResultReportCardReviewStatus | string;
  reviewType: ResultReportCardReviewType | string;
  reviewDecision: ResultReportCardReviewDecision | string;
  reviewedByActorId: string;
  reviewedByRole: string;
  safeReviewSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateReviewInput {
  resultReportCardAssemblyId: string;
  resultReportCardAudienceProjectionId?: string;
  reviewType: ResultReportCardReviewType | string;
  safeReviewSummary: string;
  reasonCodesJson?: Record<string, unknown>;
}
