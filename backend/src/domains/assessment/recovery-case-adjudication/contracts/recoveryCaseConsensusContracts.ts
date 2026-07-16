export interface RecoveryCaseReviewerConsensus {
  consensusId: string;
  schoolId: string;
  queueItemId: string;
  primaryDecisionId?: string;
  secondaryDecisionId?: string;
  resultRecoveryPlanId?: string;
  consensusStatus: string;
  safeConsensusSummary: string;
  blockedReasonCodes: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateConsensusInput {
  schoolId: string;
  queueItemId: string;
  primaryDecisionId?: string;
  secondaryDecisionId?: string;
  resultRecoveryPlanId?: string;
  safeConsensusSummary: string;
  createdByActorId: string;
  createdByRole: string;
}

export interface RecoveryCaseConsensusEvaluation {
  canReachConsensus: boolean;
  consensusStatus: string;
  safeEvaluationSummary: string;
  matchingFields: string[];
  differingFields: string[];
  reasonCodes: string[];
}
