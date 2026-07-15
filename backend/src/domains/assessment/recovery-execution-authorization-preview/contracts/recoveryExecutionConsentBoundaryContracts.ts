export interface RecoveryExecutionConsentBoundaryCheck {
  consentBoundaryCheckId: string;
  schoolId: string;
  studentRef?: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  decision: string;
  safeConsentSummary: string;
  consentBoundaryDetailsJson: Record<string, any>;
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
