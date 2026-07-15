import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionEligibilityCheck {
  eligibilityCheckId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeActionBundleId?: string;
  recoveryOutcomeActionReadinessId?: string;
  eligibilityStatus: string;
  safeEligibilitySummary: string;
  eligibilityChecksJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  voidedAt?: string;
}

export interface CreateEligibilityCheckRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeActionBundleId?: string;
  recoveryOutcomeActionReadinessId?: string;
  safeEligibilitySummary: string;
  eligibilityChecksJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type EligibilityCheckResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck>;
export type EligibilityCheckListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionEligibilityCheck[]>;
