export interface RecoveryCaseReviewerDecisionDraft {
  reviewerDecisionId: string;
  schoolId: string;
  queueItemId: string;
  reviewSessionId?: string;
  reviewerActorId: string;
  reviewerRole: string;
  reviewerPosition: string;
  decisionCode: string;
  currentPriorityScore?: number;
  currentPriorityBand?: string;
  recommendedPriorityBand?: string;
  safeDecisionSummary: string;
  reasonCodes: Record<string, unknown>;
  evidenceBundleId?: string;
  checklistId?: string;
  conflictDeclarationId?: string;
  sourceRefs: Record<string, unknown>;
  decisionStatus: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateReviewerDecisionInput {
  schoolId: string;
  queueItemId: string;
  reviewSessionId?: string;
  reviewerActorId: string;
  reviewerRole: string;
  reviewerPosition: string;
  decisionCode: string;
  currentPriorityScore?: number;
  currentPriorityBand?: string;
  recommendedPriorityBand?: string;
  safeDecisionSummary: string;
  reasonCodes: Record<string, unknown>;
  evidenceBundleId?: string;
  checklistId?: string;
  conflictDeclarationId?: string;
  sourceRefs: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}
