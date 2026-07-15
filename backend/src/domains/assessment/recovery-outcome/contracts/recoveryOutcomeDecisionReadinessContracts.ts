import { RecoveryOutcomeDecisionStatus } from './recoveryOutcomeContracts';

export interface RecoveryOutcomeDecisionReadiness {
  recoveryOutcomeDecisionReadinessId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  readinessStatus: RecoveryOutcomeDecisionStatus;
  safeReadinessSummary: string;
  readinessChecksJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
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

export interface RecoveryOutcomeDecisionReadinessCreateRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryProgressSummaryId?: string;
  recoveryEvidenceRollupId?: string;
  safeReadinessSummary: string;
  readinessChecksJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
}
