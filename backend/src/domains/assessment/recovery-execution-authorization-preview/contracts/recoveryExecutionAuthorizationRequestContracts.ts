export interface RecoveryExecutionAuthorizationRequestDraft {
  authorizationRequestDraftId: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryPostSimulationHandoffPacketId?: string;
  recoveryFinalLifecycleSummaryId?: string;
  requestStatus: string;
  safeRequestSummary: string;
  requestedActionsJson: Record<string, any>;
  requestedApproversJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  authorizationPreviewReadyAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}
