import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionSimulationReadiness {
  simulationReadinessId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeActionReadinessId: string;
  recoveryOutcomeActionBundleId?: string;
  readinessStatus: string;
  safeReadinessSummary: string;
  readinessChecksJson: Record<string, unknown>;
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

export interface CreateSimulationReadinessRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeActionReadinessId: string;
  recoveryOutcomeActionBundleId?: string;
  safeReadinessSummary: string;
  readinessChecksJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type SimulationReadinessResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness>;
export type SimulationReadinessListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationReadiness[]>;
