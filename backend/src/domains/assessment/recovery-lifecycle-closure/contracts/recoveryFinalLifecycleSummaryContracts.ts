import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryFinalLifecycleSummary {
  finalLifecycleSummaryId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  summaryStatus: string;
  safeSummary: string;
  lifecycleOverviewJson: Record<string, unknown>;
  outcomesJson: Record<string, unknown>;
  nextStepsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt?: string;
  staleAt?: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateRecoveryFinalLifecycleSummaryRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  safeSummary: string;
  lifecycleOverviewJson?: Record<string, unknown>;
  outcomesJson?: Record<string, unknown>;
  nextStepsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type RecoveryFinalLifecycleSummaryResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary>;
export type RecoveryFinalLifecycleSummaryListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryFinalLifecycleSummary[]>;
