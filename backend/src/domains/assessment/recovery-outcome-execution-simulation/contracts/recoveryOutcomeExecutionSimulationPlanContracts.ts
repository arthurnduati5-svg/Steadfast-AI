import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionSimulationPlan {
  simulationPlanId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeActionBundleId?: string;
  recoveryContinuationActionDraftId?: string;
  recoveryIntensificationActionDraftId?: string;
  recoveryPauseActionDraftId?: string;
  recoveryClosureActionDraftId?: string;
  planStatus: string;
  safePlanSummary: string;
  simulationParametersJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  simulationReadyAt?: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateSimulationPlanRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeActionBundleId?: string;
  recoveryContinuationActionDraftId?: string;
  recoveryIntensificationActionDraftId?: string;
  recoveryPauseActionDraftId?: string;
  recoveryClosureActionDraftId?: string;
  safePlanSummary: string;
  simulationParametersJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type SimulationPlanResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan>;
export type SimulationPlanListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationPlan[]>;
