import type { FollowUpReviewWindowStatus } from './resultFollowUpContracts';

export interface FollowUpReviewWindow {
  followUpReviewWindowId: string;
  schoolId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  windowStatus: FollowUpReviewWindowStatus;
  windowMode: string;
  reviewWindowStartAt: string | null;
  reviewWindowEndAt: string | null;
  safeWindowSummary: string;
  reviewCriteriaJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  scheduledMockAt: string | null;
  completedMockAt: string | null;
  cancelledAt: string | null;
  voidedAt: string | null;
}

export interface CreateReviewWindowInput {
  resultFollowUpCaseId: string;
  studentRef: string;
  safeWindowSummary: string;
  windowMode?: string;
  reviewWindowStartAt?: string;
  reviewWindowEndAt?: string;
  reviewCriteria?: Record<string, unknown>;
}

export interface UpdateReviewWindowStatusInput {
  windowStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface FollowUpReviewWindowPreview {
  followUpReviewWindowId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  windowStatus: string;
  safeWindowSummary: string;
  createdAt: string;
}
