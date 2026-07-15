export interface RecoveryExecutionApprovalChainDraft {
  approvalChainDraftId: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryAuthorityMatrixSnapshotId?: string;
  chainStatus: string;
  safeChainSummary: string;
  approvalChainJson: Record<string, any>;
  approverRefsJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvalChainReadyAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}
