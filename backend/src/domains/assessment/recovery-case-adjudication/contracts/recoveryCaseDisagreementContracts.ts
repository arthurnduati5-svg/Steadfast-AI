export interface RecoveryCaseDisagreementResolutionDraft {
  disagreementResolutionDraftId: string;
  schoolId: string;
  queueItemId: string;
  consensusId?: string;
  primaryDecisionId?: string;
  secondaryDecisionId?: string;
  safeDisagreementSummary: string;
  reasonCodeComparison: Record<string, unknown>;
  evidenceGaps: unknown[];
  proposedGovernanceRole?: string;
  proposedResolutionOptions: unknown[];
  draftStatus: string;
  blockedReasonCodes: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateDisagreementResolutionDraftInput {
  schoolId: string;
  queueItemId: string;
  consensusId?: string;
  primaryDecisionId?: string;
  secondaryDecisionId?: string;
  safeDisagreementSummary: string;
  reasonCodeComparison: Record<string, unknown>;
  evidenceGaps: unknown[];
  proposedGovernanceRole?: string;
  proposedResolutionOptions: unknown[];
  createdByActorId: string;
  createdByRole: string;
}
