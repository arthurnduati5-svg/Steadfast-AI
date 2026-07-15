import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionBlockedActionDiagnostic {
  blockedActionDiagnosticId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  recoveryOutcomeActionBundleId?: string;
  diagnosticStatus: string;
  safeDiagnosticSummary: string;
  blockedReasonCodesJson: string[];
  diagnosticDetailsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  suppressedAt?: string;
  voidedAt?: string;
}

export interface CreateBlockedActionDiagnosticRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  recoveryOutcomeActionBundleId?: string;
  safeDiagnosticSummary: string;
  blockedReasonCodesJson?: string[];
  diagnosticDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type BlockedActionDiagnosticResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic>;
export type BlockedActionDiagnosticListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>;
