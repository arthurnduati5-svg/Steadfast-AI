export interface RecoveryExecutionAuthorizationEligibilityCheck {
  authorizationEligibilityCheckId: string;
  schoolId: string;
  studentRef?: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryOutcomeActionBundleId?: string;
  decision: string;
  safeEligibilitySummary: string;
  eligibilityDetailsJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}
