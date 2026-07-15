import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type RecoveryOutcomeActionReadinessStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'voided';

export interface RecoveryOutcomeActionReadiness {
  actionReadinessId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionReadinessId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  readinessStatus: RecoveryOutcomeActionReadinessStatus;
  safeReadinessSummary: string;
  readinessChecksJson: Record<string, unknown>;
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

export interface CreateActionReadinessRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionReadinessId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeReadinessSummary: string;
  readinessChecksJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type ActionReadinessResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>;
