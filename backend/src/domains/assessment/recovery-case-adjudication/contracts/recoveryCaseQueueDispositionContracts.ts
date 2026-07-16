export interface RecoveryCaseQueueDisposition {
  queueDispositionId: string;
  schoolId: string;
  queueItemId: string;
  consensusId?: string;
  disagreementResolutionDraftId?: string;
  priorityOverrideRequestId?: string;
  dispositionCode: string;
  dispositionStatus: string;
  safeDispositionSummary: string;
  reasonCodes: Record<string, unknown>;
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateQueueDispositionInput {
  schoolId: string;
  queueItemId: string;
  consensusId?: string;
  disagreementResolutionDraftId?: string;
  priorityOverrideRequestId?: string;
  dispositionCode: string;
  safeDispositionSummary: string;
  reasonCodes: Record<string, unknown>;
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}
