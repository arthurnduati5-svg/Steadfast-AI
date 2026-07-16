import type { RecoveryCaseTriageReadinessStatus } from './recoveryCaseTriageContracts';

export interface RecoveryCaseTriageReadiness {
  triageReadinessId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  boardSnapshotId: string;
  boardCardId: string;
  triageStatus: RecoveryCaseTriageReadinessStatus | string;
  safeReadinessSummary: string;
  readinessChecksJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateTriageReadinessRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  boardSnapshotId: string;
  boardCardId: string;
  safeReadinessSummary?: string;
  readinessChecksJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}
