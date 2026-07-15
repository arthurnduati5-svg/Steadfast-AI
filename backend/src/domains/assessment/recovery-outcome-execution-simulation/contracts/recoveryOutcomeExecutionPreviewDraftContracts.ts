import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionStudentPreviewDraft {
  studentPreviewDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  draftStatus: string;
  safeStudentPreviewSummary: string;
  previewContentJson: Record<string, unknown>;
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

export interface RecoveryOutcomeExecutionParentPreviewDraft {
  parentPreviewDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  draftStatus: string;
  safeParentPreviewSummary: string;
  previewContentJson: Record<string, unknown>;
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

export interface CreateStudentPreviewDraftRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  safeStudentPreviewSummary: string;
  previewContentJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export interface CreateParentPreviewDraftRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  simulationRunId?: string;
  safeParentPreviewSummary: string;
  previewContentJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type StudentPreviewDraftResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft>;
export type StudentPreviewDraftListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionStudentPreviewDraft[]>;
export type ParentPreviewDraftResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft>;
export type ParentPreviewDraftListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionParentPreviewDraft[]>;
