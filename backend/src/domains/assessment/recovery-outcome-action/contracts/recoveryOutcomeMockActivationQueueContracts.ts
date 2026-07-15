import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type MockActivationQueueStatus = 'draft' | 'dry_run_ready' | 'suppressed' | 'blocked' | 'voided';

export interface RecoveryOutcomeMockActivationQueueItem {
  mockActivationQueueItemId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  actionBundleId?: string;
  queueStatus: MockActivationQueueStatus;
  safeQueueSummary: string;
  actionRefsJson: Record<string, string>;
  mockParametersJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  dryRunReadyAt?: Date;
  suppressedAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface CreateMockActivationQueueItemRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  actionBundleId?: string;
  safeQueueSummary: string;
  actionRefsJson: Record<string, string>;
  mockParametersJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type MockActivationQueueItemResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>;
