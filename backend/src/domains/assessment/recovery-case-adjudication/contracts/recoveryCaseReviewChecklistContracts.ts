export interface RecoveryCaseReviewChecklist {
  reviewChecklistId: string;
  schoolId: string;
  queueItemId: string;
  evidenceBundleId?: string;
  conflictDeclarationId?: string;
  checklistOutcome: string;
  checklistResults: Record<string, unknown>;
  safeChecklistSummary: string;
  blockedReasonCodes: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateReviewChecklistInput {
  schoolId: string;
  queueItemId: string;
  evidenceBundleId?: string;
  conflictDeclarationId?: string;
  checklistResults: Record<string, unknown>;
  safeChecklistSummary: string;
  createdByActorId: string;
  createdByRole: string;
}
