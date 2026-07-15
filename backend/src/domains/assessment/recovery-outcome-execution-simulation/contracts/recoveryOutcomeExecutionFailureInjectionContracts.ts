import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionFailureInjection {
  failureInjectionId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationPlanId?: string;
  injectionType: string;
  injectionStatus: string;
  safeInjectionSummary: string;
  injectionParametersJson: Record<string, unknown>;
  expectedFailureBehaviorJson: Record<string, unknown>;
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

export interface CreateFailureInjectionRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationPlanId?: string;
  injectionType: string;
  safeInjectionSummary: string;
  injectionParametersJson?: Record<string, unknown>;
  expectedFailureBehaviorJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type FailureInjectionResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection>;
export type FailureInjectionListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionFailureInjection[]>;
