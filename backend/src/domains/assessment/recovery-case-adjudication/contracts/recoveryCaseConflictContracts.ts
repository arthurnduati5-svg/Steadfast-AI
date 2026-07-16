export interface RecoveryCaseConflictOfInterestDeclaration {
  conflictDeclarationId: string;
  schoolId: string;
  queueItemId: string;
  reviewerActorId: string;
  reviewerRole: string;
  conflictType: string;
  conflictStatus: string;
  safeDeclarationSummary: string;
  blockedReasonCodes: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateConflictDeclarationInput {
  schoolId: string;
  queueItemId: string;
  reviewerActorId: string;
  reviewerRole: string;
  conflictType: string;
  safeDeclarationSummary: string;
  createdByActorId: string;
  createdByRole: string;
}
