import type { RecoveryCaseDraftStatus } from './recoveryCaseTriageContracts';

export interface RecoveryCaseReviewWindowDraft {
  reviewWindowDraftId: string;
  schoolId: string;
  queueSnapshotId: string;
  reviewerRef: string;
  audienceRole: string;
  reviewWindowDraftStatus: RecoveryCaseDraftStatus | string;
  windowStartAt: string;
  windowEndAt: string;
  maxCapacity: number;
  safeWindowSummary: string;
  windowDetailsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedAt?: string;
  blockedAt?: string;
  suppressedAt?: string;
  voidedAt?: string;
}

export interface CreateReviewWindowDraftRequest {
  queueSnapshotId: string;
  reviewerRef: string;
  audienceRole: string;
  windowStartAt: string;
  windowEndAt: string;
  maxCapacity: number;
  safeWindowSummary?: string;
  windowDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}
