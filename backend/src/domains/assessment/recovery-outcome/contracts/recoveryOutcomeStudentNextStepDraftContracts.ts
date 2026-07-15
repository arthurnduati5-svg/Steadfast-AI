import { RecoveryOutcomeDecisionStatus } from './recoveryOutcomeContracts';

export interface RecoveryOutcomeStudentNextStepDraft {
  recoveryOutcomeStudentNextStepDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  draftStatus: RecoveryOutcomeDecisionStatus;
  safeNextStepSummary: string;
  socraticPromptJson: Record<string, unknown>;
  allowedReflectionsJson: Record<string, unknown>;
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

export interface RecoveryOutcomeStudentNextStepDraftCreateRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeNextStepSummary: string;
  socraticPromptJson: Record<string, unknown>;
  allowedReflectionsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
}
