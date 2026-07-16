import type { RecoveryCaseDraftStatus } from './recoveryCaseTriageContracts';

export interface RecoveryCaseEscalationDraft {
  escalationDraftId: string;
  schoolId: string;
  queueSnapshotId: string;
  queueItemId: string;
  escalationLevel: string;
  escalationDraftStatus: RecoveryCaseDraftStatus | string;
  escalatedToRole: string;
  escalationReason: string;
  escalationNotesJson: Record<string, unknown>;
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

export interface CreateEscalationDraftRequest {
  queueSnapshotId: string;
  queueItemId: string;
  escalationLevel: string;
  escalatedToRole: string;
  escalationReason: string;
  escalationNotesJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}
