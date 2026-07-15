import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionSimulationRun {
  simulationRunId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeActionBundleId?: string;
  simulationPlanId: string;
  runStatus: string;
  safeRunSummary: string;
  runParametersJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  simulatingAt?: string;
  simulatedAt?: string;
  reviewReadyAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateSimulationRunRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeActionBundleId?: string;
  simulationPlanId: string;
  safeRunSummary: string;
  runParametersJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type SimulationRunResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun>;
export type SimulationRunListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationRun[]>;
