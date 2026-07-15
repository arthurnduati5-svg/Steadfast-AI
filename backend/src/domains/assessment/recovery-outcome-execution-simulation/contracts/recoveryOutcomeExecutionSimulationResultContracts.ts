import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionSimulationResult {
  simulationResultId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId: string;
  outcomeStatus: string;
  safeOutcomeSummary: string;
  simulationOutcomeDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  voidedAt?: string;
}

export interface CreateSimulationResultRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId: string;
  safeOutcomeSummary: string;
  simulationOutcomeDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type SimulationResultResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult>;
export type SimulationResultListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationResult[]>;
