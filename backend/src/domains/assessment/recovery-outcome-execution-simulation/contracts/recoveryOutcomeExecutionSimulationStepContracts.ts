import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionSimulationStep {
  simulationStepId: string;
  schoolId: string;
  simulationRunId: string;
  stepSequence: number;
  stepName: string;
  stepStatus: string;
  safeStepSummary: string;
  stepDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  simulatedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateSimulationStepRequest {
  simulationRunId: string;
  stepSequence: number;
  stepName: string;
  safeStepSummary: string;
  stepDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type SimulationStepResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep>;
export type SimulationStepListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationStep[]>;
