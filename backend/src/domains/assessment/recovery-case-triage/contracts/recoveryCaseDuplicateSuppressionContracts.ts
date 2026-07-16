import type { RecoveryCaseDraftStatus } from './recoveryCaseTriageContracts';

export interface RecoveryCaseDuplicateSuppression {
  duplicateSuppressionId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  canonicalBoardCardId: string;
  duplicateBoardCardId: string;
  suppressionStatus: RecoveryCaseDraftStatus | string;
  suppressionReason: string;
  suppressionDetailsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateDuplicateSuppressionRequest {
  resultRecoveryPlanId: string;
  canonicalBoardCardId: string;
  duplicateBoardCardId: string;
  suppressionReason: string;
  suppressionDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}
