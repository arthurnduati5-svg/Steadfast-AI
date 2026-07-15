import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionReadinessVerdict {
  readinessVerdictId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  verdictStatus: string;
  safeVerdictSummary: string;
  verdictDetailsJson: Record<string, unknown>;
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

export interface CreateReadinessVerdictRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  safeVerdictSummary: string;
  verdictDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type ReadinessVerdictResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict>;
export type ReadinessVerdictListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionReadinessVerdict[]>;
