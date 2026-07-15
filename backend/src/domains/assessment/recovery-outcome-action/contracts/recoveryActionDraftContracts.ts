import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type ActionDraftStatus = 'draft' | 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'voided';

export type ActionDraftType = 'continuation' | 'intensification' | 'pause' | 'closure';

export interface RecoveryContinuationActionDraft {
  continuationActionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryContinuationDecisionDraftId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  draftStatus: ActionDraftStatus;
  safeActionSummary: string;
  actionDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  reviewReadyAt?: Date;
  approvedForFutureUseAt?: Date;
  suppressedAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface RecoveryIntensificationActionDraft {
  intensificationActionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryIntensificationDecisionDraftId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  draftStatus: ActionDraftStatus;
  safeActionSummary: string;
  intensificationDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  reviewReadyAt?: Date;
  approvedForFutureUseAt?: Date;
  suppressedAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface RecoveryPauseActionDraft {
  pauseActionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryPauseDecisionDraftId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  draftStatus: ActionDraftStatus;
  safeActionSummary: string;
  pauseDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  reviewReadyAt?: Date;
  approvedForFutureUseAt?: Date;
  suppressedAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface RecoveryClosureActionDraft {
  closureActionDraftId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryClosureDecisionDraftId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  draftStatus: ActionDraftStatus;
  safeActionSummary: string;
  closureDetailsJson: Record<string, unknown>;
  closureType: string;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  reviewReadyAt?: Date;
  approvedForFutureUseAt?: Date;
  suppressedAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface CreateContinuationActionDraftRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryContinuationDecisionDraftId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeActionSummary: string;
  actionDetailsJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export interface CreateIntensificationActionDraftRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryIntensificationDecisionDraftId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeActionSummary: string;
  intensificationDetailsJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export interface CreatePauseActionDraftRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryPauseDecisionDraftId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeActionSummary: string;
  pauseDetailsJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export interface CreateClosureActionDraftRequest {
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryClosureDecisionDraftId: string;
  recoveryOutcomeDecisionSummaryId?: string;
  safeActionSummary: string;
  closureDetailsJson: Record<string, unknown>;
  closureType: string;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type ContinuationActionDraftResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryContinuationActionDraft>;
export type IntensificationActionDraftResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>;
export type PauseActionDraftResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>;
export type ClosureActionDraftResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryClosureActionDraft>;
