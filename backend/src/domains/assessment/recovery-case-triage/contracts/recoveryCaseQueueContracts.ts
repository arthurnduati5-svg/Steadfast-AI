import type { RecoveryCaseTriageQueueSnapshotStatus, RecoveryCaseQueueItemStatus, RecoveryCaseTriageDecision, RecoveryCasePriorityBand, RecoveryCaseAudienceRole } from './recoveryCaseTriageContracts';

export interface RecoveryCaseTriageQueueSnapshot {
  queueSnapshotId: string;
  schoolId: string;
  audienceRole: RecoveryCaseAudienceRole | string;
  queueStatus: RecoveryCaseTriageQueueSnapshotStatus | string;
  totalItems: number;
  queueSummary: string;
  queueMetadataJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  generatedAt?: string;
  reviewReadyAt?: string;
  staleAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryCaseTriageQueueItem {
  queueItemId: string;
  queueSnapshotId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  boardSnapshotId: string;
  boardCardId: string;
  priorityAssessmentId: string;
  fairnessCheckId: string | null;
  queueStatus: RecoveryCaseQueueItemStatus | string;
  triageDecision: RecoveryCaseTriageDecision | string;
  priorityBand: RecoveryCasePriorityBand | string;
  riskRank: string;
  totalScore: number;
  queueRank: number;
  safeItemSummary: string;
  decisionReasonJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  deferredAt?: string;
  capacityExceededAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateQueueSnapshotRequest {
  audienceRole: RecoveryCaseAudienceRole | string;
  queueSummary?: string;
  queueMetadataJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}

export interface RecoveryCaseQueueCandidate {
  studentRef: string;
  resultRecoveryPlanId: string;
  boardSnapshotId: string;
  boardCardId: string;
  priorityAssessmentId: string;
  fairnessCheckId: string | null;
  priorityBand: RecoveryCasePriorityBand | string;
  riskRank: string;
  totalScore: number;
  triageDecision: RecoveryCaseTriageDecision | string;
}

export interface RecoveryCaseQueueRankingResult {
  queueSnapshotId: string;
  items: RecoveryCaseQueueCandidate[];
  rankedCount: number;
  totalCapacity: number;
  exceededCount: number;
}
