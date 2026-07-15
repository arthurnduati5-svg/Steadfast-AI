import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type RollbackPlanStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'voided';

export interface RecoveryOutcomeRollbackPlan {
  rollbackPlanId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  actionBundleId?: string;
  rollbackStatus: RollbackPlanStatus;
  safeRollbackSummary: string;
  rollbackStepsJson: Record<string, unknown>;
  rollbackTriggersJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  reviewReadyAt?: Date;
  approvedForFutureUseAt?: Date;
  suppressedAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface CreateRollbackPlanRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  actionBundleId?: string;
  safeRollbackSummary: string;
  rollbackStepsJson: Record<string, unknown>;
  rollbackTriggersJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type RollbackPlanResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>;
