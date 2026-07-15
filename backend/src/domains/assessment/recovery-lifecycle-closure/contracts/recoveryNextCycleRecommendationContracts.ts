import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryNextCycleRecommendationDraft {
  nextCycleRecommendationId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  recommendationType: string;
  recommendationStatus: string;
  safeRecommendationSummary: string;
  recommendationDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateRecoveryNextCycleRecommendationDraftRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  recommendationType: string;
  safeRecommendationSummary: string;
  recommendationDetailsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type RecoveryNextCycleRecommendationDraftResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft>;
export type RecoveryNextCycleRecommendationDraftListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryNextCycleRecommendationDraft[]>;
