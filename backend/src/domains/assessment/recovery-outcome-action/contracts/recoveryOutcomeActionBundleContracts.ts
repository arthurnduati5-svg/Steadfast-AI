import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type ActionBundleStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'voided';

export type ActionBundleType = 'continuation' | 'intensification' | 'pause' | 'closure' | 'mixed';

export interface RecoveryOutcomeActionBundle {
  actionBundleId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  bundleStatus: ActionBundleStatus;
  safeBundleSummary: string;
  readinessRefsJson: Record<string, string>;
  draftRefsJson: Record<string, string>;
  bundleType: ActionBundleType;
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

export interface CreateActionBundleRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeBundleSummary: string;
  readinessRefsJson: Record<string, string>;
  draftRefsJson: Record<string, string>;
  bundleType: ActionBundleType;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type ActionBundleResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>;
