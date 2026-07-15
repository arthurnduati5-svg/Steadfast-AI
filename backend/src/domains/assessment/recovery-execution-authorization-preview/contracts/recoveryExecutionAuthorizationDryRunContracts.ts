export interface RecoveryExecutionAuthorizationDryRun {
  authorizationDryRunId: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  dryRunDecision: string;
  safeDryRunSummary: string;
  dryRunDetailsJson: Record<string, any>;
  mockApprovalsJson: Record<string, any>;
  mockDenialsJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  mockAuthorizedAt?: string;
  mockDeniedAt?: string;
  voidedAt?: string;
}
