import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryStudentClosureReflectionDraft {
  studentClosureReflectionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  draftStatus: string;
  safeStudentReflectionSummary: string;
  reflectionContentJson: Record<string, unknown>;
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

export interface RecoveryParentClosureGuidanceDraft {
  parentClosureGuidanceDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  draftStatus: string;
  safeParentGuidanceSummary: string;
  guidanceContentJson: Record<string, unknown>;
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

export interface CreateRecoveryStudentClosureReflectionDraftRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  safeStudentReflectionSummary: string;
  reflectionContentJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export interface CreateRecoveryParentClosureGuidanceDraftRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  safeParentGuidanceSummary: string;
  guidanceContentJson?: Record<string, unknown>;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type StudentClosureReflectionDraftResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft>;
export type StudentClosureReflectionDraftListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryStudentClosureReflectionDraft[]>;
export type ParentClosureGuidanceDraftResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft>;
export type ParentClosureGuidanceDraftListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryParentClosureGuidanceDraft[]>;
