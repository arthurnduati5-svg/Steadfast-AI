import type { RecoveryCaseFairnessStatus } from './recoveryCaseTriageContracts';

export interface RecoveryCaseFairnessCheck {
  fairnessCheckId: string;
  schoolId: string;
  priorityAssessmentId: string;
  queueSnapshotId: string | null;
  queueItemId: string | null;
  fairnessStatus: RecoveryCaseFairnessStatus | string;
  safeFairnessSummary: string;
  fairnessChecksJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateFairnessCheckRequest {
  priorityAssessmentId: string;
  queueSnapshotId?: string;
  queueItemId?: string;
  safeFairnessSummary?: string;
  fairnessChecksJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}
