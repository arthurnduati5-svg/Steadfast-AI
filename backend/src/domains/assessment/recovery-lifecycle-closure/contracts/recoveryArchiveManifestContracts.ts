import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryArchiveManifest {
  archiveManifestId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  manifestStatus: string;
  safeManifestSummary: string;
  manifestContentsJson: Record<string, unknown>;
  recordCountsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  archiveReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateRecoveryArchiveManifestRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  safeManifestSummary: string;
  manifestContentsJson?: Record<string, unknown>;
  recordCountsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type RecoveryArchiveManifestResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>;
export type RecoveryArchiveManifestListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest[]>;
