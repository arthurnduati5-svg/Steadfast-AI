export interface RecoveryExecutionMockAuthorizationReceipt {
  mockAuthorizationReceiptId: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryAuthorizationDryRunId?: string;
  receiptDecision: string;
  safeReceiptSummary: string;
  receiptContentsJson: Record<string, any>;
  mockAuthorizationDetailsJson: Record<string, any>;
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}
