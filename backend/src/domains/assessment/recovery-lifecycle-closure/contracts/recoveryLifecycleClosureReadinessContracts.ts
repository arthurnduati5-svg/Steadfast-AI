import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryLifecycleClosureReadiness {
  closureReadinessId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationReadinessId?: string;
  recoveryOutcomeExecutionSimulationPlanId?: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  recoveryOutcomeExecutionSimulationResultId?: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  closureReadinessStatus: string;
  safeReadinessSummary: string;
  readinessChecksJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  readyForFutureUseAt?: string;
  approvedForFutureUseAt?: string;
  blockedAt?: string;
  suppressedAt?: string;
  voidedAt?: string;
}

export interface CreateRecoveryLifecycleClosureReadinessRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationReadinessId?: string;
  recoveryOutcomeExecutionSimulationPlanId?: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  recoveryOutcomeExecutionSimulationResultId?: string;
  recoveryOutcomeExecutionSimulationSummaryId?: string;
  safeReadinessSummary: string;
  readinessChecksJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type RecoveryLifecycleClosureReadinessResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness>;
export type RecoveryLifecycleClosureReadinessListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryLifecycleClosureReadiness[]>;
