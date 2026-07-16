import type { RecoveryCaseDraftStatus } from './recoveryCaseTriageContracts';

export interface RecoveryCaseWorkloadAllocationDraft {
  allocationDraftId: string;
  schoolId: string;
  queueSnapshotId: string;
  reviewerRef: string;
  audienceRole: string;
  allocationDraftStatus: RecoveryCaseDraftStatus | string;
  allocatedItemIdsJson: string[];
  totalAllocated: number;
  safeAllocationSummary: string;
  allocationDetailsJson: Record<string, unknown>;
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

export interface CreateAllocationDraftRequest {
  queueSnapshotId: string;
  reviewerRef: string;
  audienceRole: string;
  allocatedItemIdsJson?: string[];
  safeAllocationSummary?: string;
  allocationDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}
