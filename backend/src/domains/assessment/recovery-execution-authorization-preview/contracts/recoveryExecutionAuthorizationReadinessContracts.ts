export interface RecoveryExecutionAuthorizationPreviewReadiness {
  authorizationReadinessId: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  adminRef?: string;
  departmentHeadRef?: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryPostSimulationHandoffPacketId?: string;
  recoveryFinalLifecycleSummaryId?: string;
  recoveryArchiveManifestId?: string;
  recoveryOutcomeExecutionSimulationRunId?: string;
  recoveryOutcomeExecutionReadinessVerdictId?: string;
  recoveryOutcomeActionBundleId?: string;
  status: string;
  safeSummary: string;
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
