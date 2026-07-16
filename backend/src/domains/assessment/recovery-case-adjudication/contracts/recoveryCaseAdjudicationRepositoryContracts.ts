import type {
  RecoveryCaseAdjudicationReadiness, CreateAdjudicationReadinessInput,
} from './recoveryCaseAdjudicationReadinessContracts';
import type {
  RecoveryCaseReviewSession, CreateReviewSessionInput,
} from './recoveryCaseReviewSessionContracts';
import type {
  RecoveryCaseReviewEvidenceBundle, CreateEvidenceBundleInput,
} from './recoveryCaseEvidenceBundleContracts';
import type {
  RecoveryCaseReviewChecklist, CreateReviewChecklistInput,
} from './recoveryCaseReviewChecklistContracts';
import type {
  RecoveryCaseConflictOfInterestDeclaration, CreateConflictDeclarationInput,
} from './recoveryCaseConflictContracts';
import type {
  RecoveryCaseReviewerDecisionDraft, CreateReviewerDecisionInput,
} from './recoveryCaseReviewerDecisionContracts';
import type {
  RecoveryCasePriorityOverrideRequest, CreatePriorityOverrideRequestInput,
} from './recoveryCasePriorityOverrideContracts';
import type {
  RecoveryCaseSecondReviewRequest, CreateSecondReviewRequestInput,
} from './recoveryCaseSecondReviewContracts';
import type {
  RecoveryCaseReviewerConsensus, CreateConsensusInput,
} from './recoveryCaseConsensusContracts';
import type {
  RecoveryCaseDisagreementResolutionDraft, CreateDisagreementResolutionDraftInput,
} from './recoveryCaseDisagreementContracts';
import type {
  RecoveryCaseQueueDisposition, CreateQueueDispositionInput,
} from './recoveryCaseQueueDispositionContracts';
import type {
  RecoveryCaseQualitySample, RecoveryCaseQualitySamplingInput,
} from './recoveryCaseQualitySampleContracts';
import type {
  RecoveryCaseAdjudicationSummary, CreateAdjudicationSummaryInput,
} from './recoveryCaseAdjudicationSummaryContracts';

export interface RecoveryCaseAdjudicationReadinessRepository {
  create(input: CreateAdjudicationReadinessInput): Promise<RecoveryCaseAdjudicationReadiness>;
  getById(adjudicationReadinessId: string): Promise<RecoveryCaseAdjudicationReadiness | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseAdjudicationReadiness[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseAdjudicationReadiness[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryCaseAdjudicationReadiness[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationReadiness[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationReadiness[]>;
  updateStatus(adjudicationReadinessId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseAdjudicationReadiness>;
  void(adjudicationReadinessId: string): Promise<RecoveryCaseAdjudicationReadiness>;
}

export interface RecoveryCaseReviewSessionRepository {
  create(input: CreateReviewSessionInput): Promise<RecoveryCaseReviewSession>;
  getById(reviewSessionId: string): Promise<RecoveryCaseReviewSession | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseReviewSession[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewSession[]>;
  listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseReviewSession[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewSession[]>;
  updateStatus(reviewSessionId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewSession>;
  void(reviewSessionId: string): Promise<RecoveryCaseReviewSession>;
}

export interface RecoveryCaseReviewEvidenceBundleRepository {
  create(input: CreateEvidenceBundleInput): Promise<RecoveryCaseReviewEvidenceBundle>;
  getById(evidenceBundleId: string): Promise<RecoveryCaseReviewEvidenceBundle | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseReviewEvidenceBundle[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewEvidenceBundle[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewEvidenceBundle[]>;
  updateStatus(evidenceBundleId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewEvidenceBundle>;
  updateDigest(evidenceBundleId: string, digest: string): Promise<RecoveryCaseReviewEvidenceBundle>;
  void(evidenceBundleId: string): Promise<RecoveryCaseReviewEvidenceBundle>;
}

export interface RecoveryCaseReviewChecklistRepository {
  create(input: CreateReviewChecklistInput): Promise<RecoveryCaseReviewChecklist>;
  getById(reviewChecklistId: string): Promise<RecoveryCaseReviewChecklist | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseReviewChecklist[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewChecklist[]>;
  listByOutcome(schoolId: string, outcome: string): Promise<RecoveryCaseReviewChecklist[]>;
  updateStatus(reviewChecklistId: string, outcome: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewChecklist>;
  void(reviewChecklistId: string): Promise<RecoveryCaseReviewChecklist>;
}

export interface RecoveryCaseConflictOfInterestDeclarationRepository {
  create(input: CreateConflictDeclarationInput): Promise<RecoveryCaseConflictOfInterestDeclaration>;
  getById(conflictDeclarationId: string): Promise<RecoveryCaseConflictOfInterestDeclaration | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]>;
  listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]>;
  updateStatus(conflictDeclarationId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseConflictOfInterestDeclaration>;
  void(conflictDeclarationId: string): Promise<RecoveryCaseConflictOfInterestDeclaration>;
}

export interface RecoveryCaseReviewerDecisionDraftRepository {
  create(input: CreateReviewerDecisionInput): Promise<RecoveryCaseReviewerDecisionDraft>;
  getById(reviewerDecisionId: string): Promise<RecoveryCaseReviewerDecisionDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseReviewerDecisionDraft[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewerDecisionDraft[]>;
  listBySessionId(schoolId: string, reviewSessionId: string): Promise<RecoveryCaseReviewerDecisionDraft[]>;
  listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseReviewerDecisionDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewerDecisionDraft[]>;
  updateStatus(reviewerDecisionId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewerDecisionDraft>;
  void(reviewerDecisionId: string): Promise<RecoveryCaseReviewerDecisionDraft>;
}

export interface RecoveryCasePriorityOverrideRequestRepository {
  create(input: CreatePriorityOverrideRequestInput): Promise<RecoveryCasePriorityOverrideRequest>;
  getById(priorityOverrideRequestId: string): Promise<RecoveryCasePriorityOverrideRequest | null>;
  listBySchool(schoolId: string): Promise<RecoveryCasePriorityOverrideRequest[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCasePriorityOverrideRequest[]>;
  listByRequestor(schoolId: string, createdByActorId: string): Promise<RecoveryCasePriorityOverrideRequest[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCasePriorityOverrideRequest[]>;
  updateStatus(priorityOverrideRequestId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCasePriorityOverrideRequest>;
  void(priorityOverrideRequestId: string): Promise<RecoveryCasePriorityOverrideRequest>;
}

export interface RecoveryCaseSecondReviewRequestRepository {
  create(input: CreateSecondReviewRequestInput): Promise<RecoveryCaseSecondReviewRequest>;
  getById(secondReviewRequestId: string): Promise<RecoveryCaseSecondReviewRequest | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseSecondReviewRequest[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseSecondReviewRequest[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseSecondReviewRequest[]>;
  updateStatus(secondReviewRequestId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseSecondReviewRequest>;
  void(secondReviewRequestId: string): Promise<RecoveryCaseSecondReviewRequest>;
}

export interface RecoveryCaseReviewerConsensusRepository {
  create(input: CreateConsensusInput): Promise<RecoveryCaseReviewerConsensus>;
  getById(consensusId: string): Promise<RecoveryCaseReviewerConsensus | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseReviewerConsensus[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewerConsensus[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewerConsensus[]>;
  updateStatus(consensusId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewerConsensus>;
  void(consensusId: string): Promise<RecoveryCaseReviewerConsensus>;
}

export interface RecoveryCaseDisagreementResolutionDraftRepository {
  create(input: CreateDisagreementResolutionDraftInput): Promise<RecoveryCaseDisagreementResolutionDraft>;
  getById(disagreementResolutionDraftId: string): Promise<RecoveryCaseDisagreementResolutionDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseDisagreementResolutionDraft[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseDisagreementResolutionDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseDisagreementResolutionDraft[]>;
  updateStatus(disagreementResolutionDraftId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseDisagreementResolutionDraft>;
  void(disagreementResolutionDraftId: string): Promise<RecoveryCaseDisagreementResolutionDraft>;
}

export interface RecoveryCaseQueueDispositionRepository {
  create(input: CreateQueueDispositionInput): Promise<RecoveryCaseQueueDisposition>;
  getById(queueDispositionId: string): Promise<RecoveryCaseQueueDisposition | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseQueueDisposition[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseQueueDisposition[]>;
  listByCode(schoolId: string, code: string): Promise<RecoveryCaseQueueDisposition[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCaseQueueDisposition[]>;
  updateStatus(queueDispositionId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseQueueDisposition>;
  void(queueDispositionId: string): Promise<RecoveryCaseQueueDisposition>;
}

export interface RecoveryCaseQualitySampleRepository {
  create(input: RecoveryCaseQualitySamplingInput & { selected: boolean; bucket: number; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseQualitySample>;
  getById(qualitySampleId: string): Promise<RecoveryCaseQualitySample | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseQualitySample[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseQualitySample[]>;
  listSelected(schoolId: string): Promise<RecoveryCaseQualitySample[]>;
  listByPolicyVersion(schoolId: string, policyVersion: string): Promise<RecoveryCaseQualitySample[]>;
  void(qualitySampleId: string): Promise<RecoveryCaseQualitySample>;
}

export interface RecoveryCaseAdjudicationSummaryRepository {
  create(input: CreateAdjudicationSummaryInput): Promise<RecoveryCaseAdjudicationSummary>;
  getById(adjudicationSummaryId: string): Promise<RecoveryCaseAdjudicationSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseAdjudicationSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseAdjudicationSummary[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryCaseAdjudicationSummary[]>;
  listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSummary[]>;
  updateStatus(adjudicationSummaryId: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseAdjudicationSummary>;
  refresh(adjudicationSummaryId: string, data: Partial<CreateAdjudicationSummaryInput>): Promise<RecoveryCaseAdjudicationSummary>;
  void(adjudicationSummaryId: string): Promise<RecoveryCaseAdjudicationSummary>;
}

export interface RecoveryCaseAdjudicationAuditRepository {
  create(event: { schoolId: string; entityType: string; entityId: string; action: string; actorId: string; actorRole: string; correlationId?: string; safeMetadata?: Record<string, unknown> }): Promise<unknown>;
  listBySchool(schoolId: string): Promise<unknown[]>;
  listByEntityId(schoolId: string, entityId: string): Promise<unknown[]>;
}

export interface RecoveryCaseAdjudicationIdempotencyRepository {
  getByKey(schoolId: string, idempotencyKey: string, operation: string): Promise<{ status: string; responseRef?: string } | null>;
  create(entry: { schoolId: string; idempotencyKey: string; operation: string; requestHash: string; responseRef?: string; status?: string }): Promise<unknown>;
  complete(schoolId: string, idempotencyKey: string, operation: string, responseRef: string): Promise<void>;
}
