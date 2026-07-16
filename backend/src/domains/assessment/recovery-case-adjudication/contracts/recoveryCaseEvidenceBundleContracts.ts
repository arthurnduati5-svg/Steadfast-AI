export interface RecoveryCaseReviewEvidenceBundle {
  evidenceBundleId: string;
  schoolId: string;
  queueItemId: string;
  priorityAssessmentId?: string;
  boardSnapshotId?: string;
  boardCardId?: string;
  sourceRefs: Record<string, unknown>;
  safeEvidenceItems: unknown[];
  sourceUpdatedAt: Record<string, string>;
  evidenceDigest: string;
  digestAlgorithm: string;
  bundleStatus: string;
  safeBundleSummary: string;
  blockedReasonCodes: string[];
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface CreateEvidenceBundleInput {
  schoolId: string;
  queueItemId: string;
  priorityAssessmentId?: string;
  boardSnapshotId?: string;
  boardCardId?: string;
  sourceRefs: Record<string, unknown>;
  safeEvidenceItems: unknown[];
  sourceUpdatedAt: Record<string, string>;
  safeBundleSummary: string;
  createdByActorId: string;
  createdByRole: string;
}

export interface RecoveryCaseEvidenceDigestInput {
  schoolId: string;
  queueItemId: string;
  safeSourceReferences: Record<string, string>;
  sourceTimestamps: Record<string, string>;
  policyVersion: string;
}
