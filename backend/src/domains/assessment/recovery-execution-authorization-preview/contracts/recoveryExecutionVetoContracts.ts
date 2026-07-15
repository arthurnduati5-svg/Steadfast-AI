export interface RecoveryExecutionVeto {
  vetoId: string;
  schoolId: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryRiskAttestationId?: string;
  vetoReason: string;
  vetoStatus: string;
  safeVetoSummary: string;
  vetoDetailsJson: Record<string, any>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, any>;
  createdByActorId: string;
  createdByRole: string;
  vetoActorId?: string;
  vetoActorRole?: string;
  vetoedAt?: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  suppressedAt?: string;
  voidedAt?: string;
}
