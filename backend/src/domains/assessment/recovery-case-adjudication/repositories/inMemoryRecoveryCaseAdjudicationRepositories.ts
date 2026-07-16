import {
  RecoveryCaseAdjudicationReadiness, CreateAdjudicationReadinessInput,
  RecoveryCaseReviewSession, CreateReviewSessionInput,
  RecoveryCaseReviewEvidenceBundle, CreateEvidenceBundleInput,
  RecoveryCaseReviewChecklist, CreateReviewChecklistInput,
  RecoveryCaseConflictOfInterestDeclaration, CreateConflictDeclarationInput,
  RecoveryCaseReviewerDecisionDraft, CreateReviewerDecisionInput,
  RecoveryCasePriorityOverrideRequest, CreatePriorityOverrideRequestInput,
  RecoveryCaseSecondReviewRequest, CreateSecondReviewRequestInput,
  RecoveryCaseReviewerConsensus, CreateConsensusInput,
  RecoveryCaseDisagreementResolutionDraft, CreateDisagreementResolutionDraftInput,
  RecoveryCaseQueueDisposition, CreateQueueDispositionInput,
  RecoveryCaseQualitySample, RecoveryCaseQualitySamplingInput,
  RecoveryCaseAdjudicationSummary, CreateAdjudicationSummaryInput,
  RecoveryCaseAdjudicationReadinessRepository,
  RecoveryCaseReviewSessionRepository,
  RecoveryCaseReviewEvidenceBundleRepository,
  RecoveryCaseReviewChecklistRepository,
  RecoveryCaseConflictOfInterestDeclarationRepository,
  RecoveryCaseReviewerDecisionDraftRepository,
  RecoveryCasePriorityOverrideRequestRepository,
  RecoveryCaseSecondReviewRequestRepository,
  RecoveryCaseReviewerConsensusRepository,
  RecoveryCaseDisagreementResolutionDraftRepository,
  RecoveryCaseQueueDispositionRepository,
  RecoveryCaseQualitySampleRepository,
  RecoveryCaseAdjudicationSummaryRepository,
  RecoveryCaseAdjudicationAuditRepository,
  RecoveryCaseAdjudicationIdempotencyRepository,
} from '../contracts';

let idCounter = 0;
function generateId(prefix: string): string {
  idCounter++;
  return `${prefix}_${idCounter}_${Date.now()}`;
}

export class InMemoryAdjudicationReadinessRepository implements RecoveryCaseAdjudicationReadinessRepository {
  private store = new Map<string, RecoveryCaseAdjudicationReadiness>();

  async create(input: CreateAdjudicationReadinessInput): Promise<RecoveryCaseAdjudicationReadiness> {
    const record: RecoveryCaseAdjudicationReadiness = {
      adjudicationReadinessId: generateId('ard'),
      schoolId: input.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      queueItemId: input.queueItemId,
      priorityAssessmentId: input.priorityAssessmentId,
      fairnessCheckId: input.fairnessCheckId,
      triageReadinessId: input.triageReadinessId,
      readinessStatus: 'draft',
      safeReadinessSummary: input.safeReadinessSummary,
      blockedReasonCodes: [],
      sourceRefs: input.sourceRefs,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.adjudicationReadinessId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseAdjudicationReadiness | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.readinessStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseAdjudicationReadiness> {
    const r = this.store.get(id);
    if (!r) throw new Error(`AdjudicationReadiness ${id} not found`);
    r.readinessStatus = status;
    if (blockedReasonCodes) r.blockedReasonCodes = blockedReasonCodes;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseAdjudicationReadiness> {
    const r = this.store.get(id);
    if (!r) throw new Error(`AdjudicationReadiness ${id} not found`);
    r.readinessStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryReviewSessionRepository implements RecoveryCaseReviewSessionRepository {
  private store = new Map<string, RecoveryCaseReviewSession>();

  async create(input: CreateReviewSessionInput): Promise<RecoveryCaseReviewSession> {
    const record: RecoveryCaseReviewSession = {
      reviewSessionId: generateId('rsess'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      adjudicationReadinessId: input.adjudicationReadinessId,
      reviewerActorId: input.reviewerActorId,
      reviewerRole: input.reviewerRole,
      sessionStatus: 'draft',
      safeSessionSummary: input.safeSessionSummary,
      blockedReasonCodes: [],
      sourceRefs: input.sourceRefs,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.reviewSessionId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseReviewSession | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewSession[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewSession[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseReviewSession[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewerActorId === reviewerActorId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewSession[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.sessionStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewSession> {
    const r = this.store.get(id);
    if (!r) throw new Error(`ReviewSession ${id} not found`);
    r.sessionStatus = status;
    if (blockedReasonCodes) r.blockedReasonCodes = blockedReasonCodes;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseReviewSession> {
    const r = this.store.get(id);
    if (!r) throw new Error(`ReviewSession ${id} not found`);
    r.sessionStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryEvidenceBundleRepository implements RecoveryCaseReviewEvidenceBundleRepository {
  private store = new Map<string, RecoveryCaseReviewEvidenceBundle>();

  async create(input: CreateEvidenceBundleInput): Promise<RecoveryCaseReviewEvidenceBundle> {
    const record: RecoveryCaseReviewEvidenceBundle = {
      evidenceBundleId: generateId('eb'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      priorityAssessmentId: input.priorityAssessmentId,
      boardSnapshotId: input.boardSnapshotId,
      boardCardId: input.boardCardId,
      sourceRefs: input.sourceRefs,
      safeEvidenceItems: input.safeEvidenceItems,
      sourceUpdatedAt: input.sourceUpdatedAt,
      evidenceDigest: '',
      digestAlgorithm: 'SHA-256',
      bundleStatus: 'draft',
      safeBundleSummary: input.safeBundleSummary,
      blockedReasonCodes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.evidenceBundleId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseReviewEvidenceBundle | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewEvidenceBundle[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewEvidenceBundle[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewEvidenceBundle[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.bundleStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewEvidenceBundle> {
    const r = this.store.get(id);
    if (!r) throw new Error(`EvidenceBundle ${id} not found`);
    r.bundleStatus = status;
    if (blockedReasonCodes) r.blockedReasonCodes = blockedReasonCodes;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async updateDigest(id: string, digest: string): Promise<RecoveryCaseReviewEvidenceBundle> {
    const r = this.store.get(id);
    if (!r) throw new Error(`EvidenceBundle ${id} not found`);
    r.evidenceDigest = digest;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseReviewEvidenceBundle> {
    const r = this.store.get(id);
    if (!r) throw new Error(`EvidenceBundle ${id} not found`);
    r.bundleStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryReviewChecklistRepository implements RecoveryCaseReviewChecklistRepository {
  private store = new Map<string, RecoveryCaseReviewChecklist>();

  async create(input: CreateReviewChecklistInput): Promise<RecoveryCaseReviewChecklist> {
    const record: RecoveryCaseReviewChecklist = {
      reviewChecklistId: generateId('cl'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      evidenceBundleId: input.evidenceBundleId,
      conflictDeclarationId: input.conflictDeclarationId,
      checklistOutcome: 'pending',
      checklistResults: input.checklistResults,
      safeChecklistSummary: input.safeChecklistSummary,
      blockedReasonCodes: [],
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.reviewChecklistId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseReviewChecklist | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewChecklist[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewChecklist[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByOutcome(schoolId: string, outcome: string): Promise<RecoveryCaseReviewChecklist[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.checklistOutcome === outcome);
  }

  async updateStatus(id: string, outcome: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewChecklist> {
    const r = this.store.get(id);
    if (!r) throw new Error(`ReviewChecklist ${id} not found`);
    r.checklistOutcome = outcome;
    if (blockedReasonCodes) r.blockedReasonCodes = blockedReasonCodes;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseReviewChecklist> {
    const r = this.store.get(id);
    if (!r) throw new Error(`ReviewChecklist ${id} not found`);
    r.checklistOutcome = 'blocked';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryConflictDeclarationRepository implements RecoveryCaseConflictOfInterestDeclarationRepository {
  private store = new Map<string, RecoveryCaseConflictOfInterestDeclaration>();

  async create(input: CreateConflictDeclarationInput): Promise<RecoveryCaseConflictOfInterestDeclaration> {
    const record: RecoveryCaseConflictOfInterestDeclaration = {
      conflictDeclarationId: generateId('coi'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      reviewerActorId: input.reviewerActorId,
      reviewerRole: input.reviewerRole,
      conflictType: input.conflictType,
      conflictStatus: 'draft',
      safeDeclarationSummary: input.safeDeclarationSummary,
      blockedReasonCodes: [],
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.conflictDeclarationId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseConflictOfInterestDeclaration | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewerActorId === reviewerActorId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseConflictOfInterestDeclaration[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.conflictStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseConflictOfInterestDeclaration> {
    const r = this.store.get(id);
    if (!r) throw new Error(`ConflictDeclaration ${id} not found`);
    r.conflictStatus = status;
    if (blockedReasonCodes) r.blockedReasonCodes = blockedReasonCodes;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseConflictOfInterestDeclaration> {
    const r = this.store.get(id);
    if (!r) throw new Error(`ConflictDeclaration ${id} not found`);
    r.conflictStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryReviewerDecisionRepository implements RecoveryCaseReviewerDecisionDraftRepository {
  private store = new Map<string, RecoveryCaseReviewerDecisionDraft>();

  async create(input: CreateReviewerDecisionInput): Promise<RecoveryCaseReviewerDecisionDraft> {
    const record: RecoveryCaseReviewerDecisionDraft = {
      reviewerDecisionId: generateId('rd'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      reviewSessionId: input.reviewSessionId,
      reviewerActorId: input.reviewerActorId,
      reviewerRole: input.reviewerRole,
      reviewerPosition: input.reviewerPosition,
      decisionCode: input.decisionCode,
      currentPriorityScore: input.currentPriorityScore,
      currentPriorityBand: input.currentPriorityBand,
      recommendedPriorityBand: input.recommendedPriorityBand,
      safeDecisionSummary: input.safeDecisionSummary,
      reasonCodes: input.reasonCodes,
      evidenceBundleId: input.evidenceBundleId,
      checklistId: input.checklistId,
      conflictDeclarationId: input.conflictDeclarationId,
      sourceRefs: input.sourceRefs,
      decisionStatus: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.reviewerDecisionId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseReviewerDecisionDraft | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listBySessionId(schoolId: string, reviewSessionId: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewSessionId === reviewSessionId);
  }

  async listByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewerActorId === reviewerActorId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewerDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.decisionStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewerDecisionDraft> {
    const r = this.store.get(id);
    if (!r) throw new Error(`ReviewerDecision ${id} not found`);
    r.decisionStatus = status;
    if (blockedReasonCodes) r.reasonCodes = { blocked: blockedReasonCodes };
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseReviewerDecisionDraft> {
    const r = this.store.get(id);
    if (!r) throw new Error(`ReviewerDecision ${id} not found`);
    r.decisionStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryPriorityOverrideRepository implements RecoveryCasePriorityOverrideRequestRepository {
  private store = new Map<string, RecoveryCasePriorityOverrideRequest>();

  async create(input: CreatePriorityOverrideRequestInput): Promise<RecoveryCasePriorityOverrideRequest> {
    const record: RecoveryCasePriorityOverrideRequest = {
      priorityOverrideRequestId: generateId('po'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      priorityAssessmentId: input.priorityAssessmentId,
      currentPriorityScore: input.currentPriorityScore,
      currentPriorityBand: input.currentPriorityBand,
      requestedPriorityBand: input.requestedPriorityBand,
      safeOverrideRationale: input.safeOverrideRationale,
      reasonCodes: input.reasonCodes,
      supportingDecisionIds: input.supportingDecisionIds,
      supportingEvidenceBundleIds: input.supportingEvidenceBundleIds,
      overrideStatus: 'draft',
      blockedReasonCodes: [],
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.priorityOverrideRequestId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCasePriorityOverrideRequest | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCasePriorityOverrideRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCasePriorityOverrideRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByRequestor(schoolId: string, actorId: string): Promise<RecoveryCasePriorityOverrideRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.createdByActorId === actorId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCasePriorityOverrideRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.overrideStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCasePriorityOverrideRequest> {
    const r = this.store.get(id);
    if (!r) throw new Error(`PriorityOverride ${id} not found`);
    r.overrideStatus = status;
    if (blockedReasonCodes) r.blockedReasonCodes = blockedReasonCodes;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCasePriorityOverrideRequest> {
    const r = this.store.get(id);
    if (!r) throw new Error(`PriorityOverride ${id} not found`);
    r.overrideStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemorySecondReviewRepository implements RecoveryCaseSecondReviewRequestRepository {
  private store = new Map<string, RecoveryCaseSecondReviewRequest>();

  async create(input: CreateSecondReviewRequestInput): Promise<RecoveryCaseSecondReviewRequest> {
    const record: RecoveryCaseSecondReviewRequest = {
      secondReviewRequestId: generateId('sr'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      primaryDecisionId: input.primaryDecisionId,
      requestedReviewerRole: input.requestedReviewerRole,
      requestReasonCodes: input.requestReasonCodes,
      safeRequestSummary: input.safeRequestSummary,
      requestStatus: 'draft',
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.secondReviewRequestId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseSecondReviewRequest | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseSecondReviewRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseSecondReviewRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseSecondReviewRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.requestStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseSecondReviewRequest> {
    const r = this.store.get(id);
    if (!r) throw new Error(`SecondReviewRequest ${id} not found`);
    r.requestStatus = status;
    if (blockedReasonCodes) r.requestReasonCodes = { blocked: blockedReasonCodes };
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseSecondReviewRequest> {
    const r = this.store.get(id);
    if (!r) throw new Error(`SecondReviewRequest ${id} not found`);
    r.requestStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryConsensusRepository implements RecoveryCaseReviewerConsensusRepository {
  private store = new Map<string, RecoveryCaseReviewerConsensus>();

  async create(input: CreateConsensusInput): Promise<RecoveryCaseReviewerConsensus> {
    const record: RecoveryCaseReviewerConsensus = {
      consensusId: generateId('cs'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      primaryDecisionId: input.primaryDecisionId,
      secondaryDecisionId: input.secondaryDecisionId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      consensusStatus: 'pending',
      safeConsensusSummary: input.safeConsensusSummary,
      blockedReasonCodes: [],
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.consensusId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseReviewerConsensus | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseReviewerConsensus[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseReviewerConsensus[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseReviewerConsensus[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.consensusStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseReviewerConsensus> {
    const r = this.store.get(id);
    if (!r) throw new Error(`Consensus ${id} not found`);
    r.consensusStatus = status;
    if (blockedReasonCodes) r.blockedReasonCodes = blockedReasonCodes;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseReviewerConsensus> {
    const r = this.store.get(id);
    if (!r) throw new Error(`Consensus ${id} not found`);
    r.consensusStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryDisagreementDraftRepository implements RecoveryCaseDisagreementResolutionDraftRepository {
  private store = new Map<string, RecoveryCaseDisagreementResolutionDraft>();

  async create(input: CreateDisagreementResolutionDraftInput): Promise<RecoveryCaseDisagreementResolutionDraft> {
    const record: RecoveryCaseDisagreementResolutionDraft = {
      disagreementResolutionDraftId: generateId('dr'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      consensusId: input.consensusId,
      primaryDecisionId: input.primaryDecisionId,
      secondaryDecisionId: input.secondaryDecisionId,
      safeDisagreementSummary: input.safeDisagreementSummary,
      reasonCodeComparison: input.reasonCodeComparison,
      evidenceGaps: input.evidenceGaps,
      proposedGovernanceRole: input.proposedGovernanceRole,
      proposedResolutionOptions: input.proposedResolutionOptions,
      draftStatus: 'draft',
      blockedReasonCodes: [],
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.disagreementResolutionDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseDisagreementResolutionDraft | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseDisagreementResolutionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseDisagreementResolutionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseDisagreementResolutionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseDisagreementResolutionDraft> {
    const r = this.store.get(id);
    if (!r) throw new Error(`DisagreementDraft ${id} not found`);
    r.draftStatus = status;
    if (blockedReasonCodes) r.blockedReasonCodes = blockedReasonCodes;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseDisagreementResolutionDraft> {
    const r = this.store.get(id);
    if (!r) throw new Error(`DisagreementDraft ${id} not found`);
    r.draftStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryQueueDispositionRepository implements RecoveryCaseQueueDispositionRepository {
  private store = new Map<string, RecoveryCaseQueueDisposition>();

  async create(input: CreateQueueDispositionInput): Promise<RecoveryCaseQueueDisposition> {
    const record: RecoveryCaseQueueDisposition = {
      queueDispositionId: generateId('qd'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      consensusId: input.consensusId,
      disagreementResolutionDraftId: input.disagreementResolutionDraftId,
      priorityOverrideRequestId: input.priorityOverrideRequestId,
      dispositionCode: input.dispositionCode,
      dispositionStatus: 'draft',
      safeDispositionSummary: input.safeDispositionSummary,
      reasonCodes: input.reasonCodes,
      sourceRefs: input.sourceRefs,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.queueDispositionId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseQueueDisposition | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseQueueDisposition[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseQueueDisposition[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listByCode(schoolId: string, code: string): Promise<RecoveryCaseQueueDisposition[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.dispositionCode === code);
  }

  async listByStatus(schoolId: string, status: string): Promise<RecoveryCaseQueueDisposition[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.dispositionStatus === status);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseQueueDisposition> {
    const r = this.store.get(id);
    if (!r) throw new Error(`QueueDisposition ${id} not found`);
    r.dispositionStatus = status;
    if (blockedReasonCodes) r.reasonCodes = { blocked: blockedReasonCodes };
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseQueueDisposition> {
    const r = this.store.get(id);
    if (!r) throw new Error(`QueueDisposition ${id} not found`);
    r.dispositionStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryQualitySampleRepository implements RecoveryCaseQualitySampleRepository {
  private store = new Map<string, RecoveryCaseQualitySample>();

  async create(input: RecoveryCaseQualitySamplingInput & { selected: boolean; bucket: number; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseQualitySample> {
    const record: RecoveryCaseQualitySample = {
      qualitySampleId: generateId('qs'),
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      priorityBand: input.priorityBand,
      selected: input.selected,
      bucket: input.bucket,
      sampleBasisPoints: input.sampleBasisPoints,
      policyVersion: input.policyVersion,
      sampleStatus: 'draft',
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
    };
    this.store.set(record.qualitySampleId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseQualitySample | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseQualitySample[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseQualitySample[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async listSelected(schoolId: string): Promise<RecoveryCaseQualitySample[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.selected);
  }

  async listByPolicyVersion(schoolId: string, policyVersion: string): Promise<RecoveryCaseQualitySample[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.policyVersion === policyVersion);
  }

  async void(id: string): Promise<RecoveryCaseQualitySample> {
    const r = this.store.get(id);
    if (!r) throw new Error(`QualitySample ${id} not found`);
    r.sampleStatus = 'void';
    return r;
  }
}

export class InMemoryAdjudicationSummaryRepository implements RecoveryCaseAdjudicationSummaryRepository {
  private store = new Map<string, RecoveryCaseAdjudicationSummary>();

  async create(input: CreateAdjudicationSummaryInput): Promise<RecoveryCaseAdjudicationSummary> {
    const record: RecoveryCaseAdjudicationSummary = {
      adjudicationSummaryId: generateId('as'),
      schoolId: input.schoolId,
      studentRef: input.studentRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      queueItemId: input.queueItemId,
      summaryStatus: 'draft',
      safeSummary: input.safeSummary,
      adjudicationCounts: input.adjudicationCounts,
      consensusCounts: input.consensusCounts,
      disagreementCounts: input.disagreementCounts,
      dispositionCounts: input.dispositionCounts,
      sourceRefs: input.sourceRefs,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(record.adjudicationSummaryId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryCaseAdjudicationSummary | null> {
    return this.store.get(id) || null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryCaseAdjudicationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseAdjudicationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseAdjudicationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }

  async listByQueueItemId(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.queueItemId === queueItemId);
  }

  async updateStatus(id: string, status: string, blockedReasonCodes?: string[]): Promise<RecoveryCaseAdjudicationSummary> {
    const r = this.store.get(id);
    if (!r) throw new Error(`AdjudicationSummary ${id} not found`);
    r.summaryStatus = status;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async refresh(id: string, data: Partial<CreateAdjudicationSummaryInput>): Promise<RecoveryCaseAdjudicationSummary> {
    const r = this.store.get(id);
    if (!r) throw new Error(`AdjudicationSummary ${id} not found`);
    if (data.safeSummary !== undefined) r.safeSummary = data.safeSummary;
    if (data.adjudicationCounts !== undefined) r.adjudicationCounts = data.adjudicationCounts;
    if (data.consensusCounts !== undefined) r.consensusCounts = data.consensusCounts;
    if (data.disagreementCounts !== undefined) r.disagreementCounts = data.disagreementCounts;
    if (data.dispositionCounts !== undefined) r.dispositionCounts = data.dispositionCounts;
    r.updatedAt = new Date().toISOString();
    return r;
  }

  async void(id: string): Promise<RecoveryCaseAdjudicationSummary> {
    const r = this.store.get(id);
    if (!r) throw new Error(`AdjudicationSummary ${id} not found`);
    r.summaryStatus = 'void';
    r.voidedAt = new Date().toISOString();
    r.updatedAt = new Date().toISOString();
    return r;
  }
}

export class InMemoryAdjudicationAuditRepository implements RecoveryCaseAdjudicationAuditRepository {
  private store: unknown[] = [];

  async create(event: { schoolId: string; entityType: string; entityId: string; action: string; actorId: string; actorRole: string; correlationId?: string; safeMetadata?: Record<string, unknown> }): Promise<unknown> {
    const record = { ...event, adjudicationAuditEventId: generateId('aaud'), createdAt: new Date().toISOString() };
    this.store.push(record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<unknown[]> {
    return this.store.filter((e: any) => e.schoolId === schoolId);
  }

  async listByEntityId(schoolId: string, entityId: string): Promise<unknown[]> {
    return this.store.filter((e: any) => e.schoolId === schoolId && e.entityId === entityId);
  }
}

export class InMemoryAdjudicationIdempotencyRepository implements RecoveryCaseAdjudicationIdempotencyRepository {
  private store = new Map<string, { status: string; responseRef?: string; requestHash: string }>();

  private key(schoolId: string, idempotencyKey: string, operation: string): string {
    return `${schoolId}:${idempotencyKey}:${operation}`;
  }

  async getByKey(schoolId: string, idempotencyKey: string, operation: string): Promise<{ status: string; responseRef?: string } | null> {
    const k = this.key(schoolId, idempotencyKey, operation);
    const entry = this.store.get(k);
    if (!entry) return null;
    return { status: entry.status, responseRef: entry.responseRef };
  }

  async create(entry: { schoolId: string; idempotencyKey: string; operation: string; requestHash: string; responseRef?: string; status?: string }): Promise<unknown> {
    const k = this.key(entry.schoolId, entry.idempotencyKey, entry.operation);
    this.store.set(k, {
      status: entry.status || 'in_progress',
      responseRef: entry.responseRef,
      requestHash: entry.requestHash,
    });
    return { ...entry, adjudicationIdempotencyId: generateId('aidem'), createdAt: new Date().toISOString() };
  }

  async complete(schoolId: string, idempotencyKey: string, operation: string, responseRef: string): Promise<void> {
    const k = this.key(schoolId, idempotencyKey, operation);
    const entry = this.store.get(k);
    if (entry) {
      entry.status = 'completed';
      entry.responseRef = responseRef;
    }
  }
}
