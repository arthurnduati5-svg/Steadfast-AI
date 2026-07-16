export interface RecoveryCasePriorityOverrideRequest {
  priorityOverrideRequestId: string;
  schoolId: string;
  queueItemId: string;
  priorityAssessmentId: string;
  currentPriorityScore?: number;
  currentPriorityBand?: string;
  requestedPriorityBand: string;
  safeOverrideRationale: string;
  reasonCodes: Record<string, unknown>;
  supportingDecisionIds: string[];
  supportingEvidenceBundleIds: string[];
  overrideStatus: string;
  blockedReasonCodes: string[];
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreatePriorityOverrideRequestInput {
  schoolId: string;
  queueItemId: string;
  priorityAssessmentId: string;
  currentPriorityScore?: number;
  currentPriorityBand?: string;
  requestedPriorityBand: string;
  safeOverrideRationale: string;
  reasonCodes: Record<string, unknown>;
  supportingDecisionIds: string[];
  supportingEvidenceBundleIds: string[];
  createdByActorId: string;
  createdByRole: string;
}
