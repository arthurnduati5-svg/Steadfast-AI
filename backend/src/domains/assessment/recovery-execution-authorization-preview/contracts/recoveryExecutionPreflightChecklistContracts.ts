export interface RecoveryExecutionPreflightChecklist {
  preflightChecklistId: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  checklistStatus: string;
  safeChecklistSummary: string;
  checklistItemsJson: Record<string, any>;
  passedItemsJson: Record<string, any>;
  failedItemsJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  authorizationPreviewReadyAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}
