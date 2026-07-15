import { RecoveryOutcomeDecisionStatus, RecoveryExitCriteriaType } from './recoveryOutcomeContracts';

export interface RecoveryExitCriteria {
  recoveryExitCriteriaId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  criteriaStatus: RecoveryOutcomeDecisionStatus;
  criteriaType: RecoveryExitCriteriaType;
  safeCriteriaSummary: string;
  criteriaDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
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

export interface RecoveryExitCriteriaCreateRequest {
  schoolId: string;
  resultRecoveryPlanId: string;
  criteriaType: RecoveryExitCriteriaType;
  safeCriteriaSummary: string;
  criteriaDetailsJson: Record<string, unknown>;
}
