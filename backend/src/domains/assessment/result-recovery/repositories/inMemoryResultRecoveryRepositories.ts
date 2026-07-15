import type {
  ResultRecoveryPlan,
  CreateRecoveryPlanInput,
  ResultRecoveryPlanPreview,
  UpdateRecoveryPlanStatusInput,
} from '../contracts/resultRecoveryPlanContracts';
import type {
  ResultRecoveryObjective,
  CreateRecoveryObjectiveInput,
  ResultRecoveryObjectivePreview,
  UpdateRecoveryObjectiveStatusInput,
} from '../contracts/resultRecoveryObjectiveContracts';
import type {
  ResultRecoveryStep,
  CreateRecoveryStepInput,
  ResultRecoveryStepPreview,
  UpdateRecoveryStepStatusInput,
} from '../contracts/resultRecoveryStepContracts';
import type {
  ResultRecoveryPracticeDraft,
  CreatePracticeDraftInput,
  ResultRecoveryPracticeDraftPreview,
  UpdateRecoveryPracticeDraftStatusInput,
} from '../contracts/resultRecoveryPracticeDraftContracts';
import type {
  ResultRecoveryResourceRecommendation,
  CreateResourceRecommendationInput,
  ResultRecoveryResourceRecommendationPreview,
  UpdateRecoveryResourceRecommendationStatusInput,
} from '../contracts/resultRecoveryResourceRecommendationContracts';
import type {
  ResultRecoveryTeacherReviewPacket,
  CreateTeacherReviewPacketInput,
  ResultRecoveryTeacherReviewPacketPreview,
  UpdateRecoveryTeacherReviewPacketStatusInput,
} from '../contracts/resultRecoveryTeacherReviewPacketContracts';
import type {
  ResultRecoveryStudentSupportDraft,
  CreateStudentSupportDraftInput,
  ResultRecoveryStudentSupportDraftPreview,
  UpdateRecoveryStudentSupportDraftStatusInput,
} from '../contracts/resultRecoveryStudentSupportDraftContracts';
import type {
  ResultRecoveryParentSupportNoteDraft,
  CreateParentSupportNoteDraftInput,
  ResultRecoveryParentSupportNoteDraftPreview,
  UpdateRecoveryParentSupportNoteDraftStatusInput,
} from '../contracts/resultRecoveryParentSupportNoteDraftContracts';
import type {
  ResultRecoveryCheckpoint,
  CreateRecoveryCheckpointInput,
  ResultRecoveryCheckpointPreview,
  UpdateRecoveryCheckpointStatusInput,
} from '../contracts/resultRecoveryCheckpointContracts';
import type {
  ResultRecoverySummary,
  CreateRecoverySummaryInput,
  ResultRecoverySummaryPreview,
  UpdateRecoverySummaryStatusInput,
} from '../contracts/resultRecoverySummaryContracts';
import type {
  ResultRecoveryAuditEvent,
  ResultRecoveryIdempotencyEntry,
  ResultRecoveryPlanStatus,
  ResultRecoveryPlanMode,
  ResultRecoveryPlanPriority,
  ResultRecoveryObjectiveStatus,
  ResultRecoveryObjectiveType,
  ResultRecoveryStepStatus,
  ResultRecoveryStepType,
  ResultRecoveryPracticeDraftStatus,
  ResultRecoveryResourceRecommendationStatus,
  ResultRecoveryTeacherReviewPacketStatus,
  ResultRecoveryStudentSupportDraftStatus,
  ResultRecoveryParentSupportNoteDraftStatus,
  ResultRecoveryCheckpointStatus,
  ResultRecoverySummaryStatus,
  ResultRecoverySummaryScope,
} from '../contracts';
import type {
  ResultRecoveryPlanRepository,
  ResultRecoveryObjectiveRepository,
  ResultRecoveryStepRepository,
  ResultRecoveryPracticeDraftRepository,
  ResultRecoveryResourceRecommendationRepository,
  ResultRecoveryTeacherReviewPacketRepository,
  ResultRecoveryStudentSupportDraftRepository,
  ResultRecoveryParentSupportNoteDraftRepository,
  ResultRecoveryCheckpointRepository,
  ResultRecoverySummaryRepository,
  ResultRecoveryAuditRepository,
  ResultRecoveryIdempotencyRepository,
} from '../contracts';

let counter = 0;
function uuid(): string { return `rrc-${++counter}`; }
function now(): string { return new Date().toISOString(); }

export class InMemoryResultRecoveryPlanRepository implements ResultRecoveryPlanRepository {
  private store = new Map<string, ResultRecoveryPlan>();

  async create(input: CreateRecoveryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryPlan> {
    const record: ResultRecoveryPlan = {
      resultRecoveryPlanId: uuid(),
      schoolId: input.schoolId,
      studentRef: input.studentRef,
      resultFollowUpCaseId: input.resultFollowUpCaseId ?? null,
      resultFollowUpActionPlanId: input.resultFollowUpActionPlanId ?? null,
      resultFollowUpSummaryId: input.resultFollowUpSummaryId ?? null,
      resultReportCardAssemblyId: input.resultReportCardAssemblyId ?? null,
      resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId ?? null,
      resultReportCardAccessGrantId: input.resultReportCardAccessGrantId ?? null,
      resultLearningEvidenceSnapshotId: input.resultLearningEvidenceSnapshotId ?? null,
      planStatus: 'draft' as ResultRecoveryPlanStatus,
      planMode: input.planMode ?? 'mock_plan_only' as ResultRecoveryPlanMode,
      planPriority: input.planPriority ?? 'medium' as ResultRecoveryPlanPriority,
      safePlanSummary: input.safePlanSummary,
      sourceRefsJson: (input.sourceRefsJson as Record<string, unknown>) ?? null,
      objectiveRefsJson: (input.objectiveRefsJson as Record<string, unknown>) ?? null,
      recommendedSequenceJson: (input.recommendedSequenceJson as Record<string, unknown>) ?? null,
      allowedActionsJson: (input.allowedActionsJson as Record<string, unknown>) ?? null,
      blockedActionsJson: (input.blockedActionsJson as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      draftedAt: now(),
      reviewReadyAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryPlanId, record);
    return record;
  }

  async getById(planId: string): Promise<ResultRecoveryPlan | null> {
    return this.store.get(planId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryPlanStatus | string): Promise<ResultRecoveryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.planStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByPriority(schoolId: string, priority: ResultRecoveryPlanPriority | string): Promise<ResultRecoveryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.planPriority === priority)
      .map(r => this.toPreview(r));
  }

  async listByMode(schoolId: string, mode: ResultRecoveryPlanMode | string): Promise<ResultRecoveryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.planMode === mode)
      .map(r => this.toPreview(r));
  }

  async update(planId: string, data: Partial<ResultRecoveryPlan>): Promise<ResultRecoveryPlan> {
    const r = this.store.get(planId);
    if (!r) throw new Error(`ResultRecoveryPlan not found: ${planId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(planId, updated);
    return updated;
  }

  async updateStatus(planId: string, input: UpdateRecoveryPlanStatusInput): Promise<ResultRecoveryPlan> {
    const r = this.store.get(planId);
    if (!r) throw new Error(`ResultRecoveryPlan not found: ${planId}`);
    const data: any = { planStatus: input.planStatus, updatedAt: now() };
    if (input.planStatus === 'review_ready') data.reviewReadyAt = now();
    if (input.planStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.planStatus === 'suppressed') data.suppressedAt = now();
    if (input.planStatus === 'blocked') data.blockedAt = now();
    if (input.planStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(planId, updated);
    return updated;
  }

  async markReviewReady(planId: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Recovery plan ready for review' });
  }

  async approveForFutureUse(planId: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Recovery plan approved for future use' });
  }

  async suppress(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryPlan): ResultRecoveryPlanPreview {
    return {
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      schoolId: r.schoolId,
      studentRef: r.studentRef,
      planStatus: r.planStatus as string,
      planMode: r.planMode as string,
      planPriority: r.planPriority as string,
      safePlanSummary: r.safePlanSummary,
      createdByActorId: r.createdByActorId,
      createdByRole: r.createdByRole,
      createdAt: r.createdAt,
      reviewReadyAt: r.reviewReadyAt,
      approvedForFutureUseAt: r.approvedForFutureUseAt,
      suppressedAt: r.suppressedAt,
      blockedAt: r.blockedAt,
      voidedAt: r.voidedAt,
    };
  }
}

export class InMemoryResultRecoveryObjectiveRepository implements ResultRecoveryObjectiveRepository {
  private store = new Map<string, ResultRecoveryObjective>();

  async create(input: CreateRecoveryObjectiveInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryObjective> {
    const record: ResultRecoveryObjective = {
      resultRecoveryObjectiveId: uuid(),
      schoolId: input.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      studentRef: input.studentRef,
      objectiveStatus: 'draft' as ResultRecoveryObjectiveStatus,
      objectiveType: input.objectiveType ?? 'concept_repair' as ResultRecoveryObjectiveType,
      objectivePriority: input.objectivePriority ?? 'medium',
      learningObjectiveRef: input.learningObjectiveRef ?? null,
      skillRef: input.skillRef ?? null,
      topicRef: input.topicRef ?? null,
      safeObjectiveSummary: input.safeObjectiveSummary,
      evidenceRefsJson: (input.evidenceRefsJson as Record<string, unknown>) ?? null,
      successCriteriaJson: (input.successCriteriaJson as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      readyAt: null,
      completedMockAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryObjectiveId, record);
    return record;
  }

  async getById(objectiveId: string): Promise<ResultRecoveryObjective | null> {
    return this.store.get(objectiveId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryObjectivePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryObjectivePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryObjectivePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryObjectiveStatus | string): Promise<ResultRecoveryObjectivePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.objectiveStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByType(schoolId: string, type: ResultRecoveryObjectiveType | string): Promise<ResultRecoveryObjectivePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.objectiveType === type)
      .map(r => this.toPreview(r));
  }

  async update(objectiveId: string, data: Partial<ResultRecoveryObjective>): Promise<ResultRecoveryObjective> {
    const r = this.store.get(objectiveId);
    if (!r) throw new Error(`ResultRecoveryObjective not found: ${objectiveId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(objectiveId, updated);
    return updated;
  }

  async updateStatus(objectiveId: string, input: UpdateRecoveryObjectiveStatusInput): Promise<ResultRecoveryObjective> {
    const r = this.store.get(objectiveId);
    if (!r) throw new Error(`ResultRecoveryObjective not found: ${objectiveId}`);
    const data: any = { objectiveStatus: input.objectiveStatus, updatedAt: now() };
    if (input.objectiveStatus === 'ready') data.readyAt = now();
    if (input.objectiveStatus === 'completed_mock') data.completedMockAt = now();
    if (input.objectiveStatus === 'suppressed') data.suppressedAt = now();
    if (input.objectiveStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(objectiveId, updated);
    return updated;
  }

  async markReady(objectiveId: string): Promise<ResultRecoveryObjective> {
    return this.updateStatus(objectiveId, { objectiveStatus: 'ready', reasonCode: 'ready', safeMessage: 'Objective ready' });
  }

  async completeMock(objectiveId: string): Promise<ResultRecoveryObjective> {
    return this.updateStatus(objectiveId, { objectiveStatus: 'completed_mock', reasonCode: 'completed_mock', safeMessage: 'Objective mock completed' });
  }

  async suppress(objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective> {
    return this.updateStatus(objectiveId, { objectiveStatus: 'suppressed', reasonCode, safeMessage });
  }

  async void(objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective> {
    return this.updateStatus(objectiveId, { objectiveStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryObjective): ResultRecoveryObjectivePreview {
    return {
      resultRecoveryObjectiveId: r.resultRecoveryObjectiveId,
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      studentRef: r.studentRef,
      objectiveStatus: r.objectiveStatus as string,
      objectiveType: r.objectiveType as string,
      safeObjectiveSummary: r.safeObjectiveSummary,
      readyAt: r.readyAt,
      completedMockAt: r.completedMockAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoveryStepRepository implements ResultRecoveryStepRepository {
  private store = new Map<string, ResultRecoveryStep>();

  async create(input: CreateRecoveryStepInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryStep> {
    const record: ResultRecoveryStep = {
      resultRecoveryStepId: uuid(),
      schoolId: input.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      resultRecoveryObjectiveId: input.resultRecoveryObjectiveId ?? null,
      studentRef: input.studentRef,
      stepStatus: 'draft' as ResultRecoveryStepStatus,
      stepType: input.stepType ?? 'review_concept' as ResultRecoveryStepType,
      stepOrder: input.stepOrder ?? 0,
      stepMode: input.stepMode ?? 'mock',
      safeStepSummary: input.safeStepSummary,
      stepInstructionsJson: (input.stepInstructionsJson as Record<string, unknown>) ?? null,
      teacherNotesJson: (input.teacherNotesJson as Record<string, unknown>) ?? null,
      studentSafeNotesJson: (input.studentSafeNotesJson as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewReadyAt: null,
      approvedForFutureUseAt: null,
      completedMockAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryStepId, record);
    return record;
  }

  async getById(stepId: string): Promise<ResultRecoveryStep | null> {
    return this.store.get(stepId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryStepPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryStepPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByObjectiveId(objectiveId: string): Promise<ResultRecoveryStepPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryObjectiveId === objectiveId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryStepPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryStepStatus | string): Promise<ResultRecoveryStepPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.stepStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByType(schoolId: string, type: ResultRecoveryStepType | string): Promise<ResultRecoveryStepPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.stepType === type)
      .map(r => this.toPreview(r));
  }

  async update(stepId: string, data: Partial<ResultRecoveryStep>): Promise<ResultRecoveryStep> {
    const r = this.store.get(stepId);
    if (!r) throw new Error(`ResultRecoveryStep not found: ${stepId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(stepId, updated);
    return updated;
  }

  async updateStatus(stepId: string, input: UpdateRecoveryStepStatusInput): Promise<ResultRecoveryStep> {
    const r = this.store.get(stepId);
    if (!r) throw new Error(`ResultRecoveryStep not found: ${stepId}`);
    const data: any = { stepStatus: input.stepStatus, updatedAt: now() };
    if (input.stepStatus === 'review_ready') data.reviewReadyAt = now();
    if (input.stepStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.stepStatus === 'completed_mock') data.completedMockAt = now();
    if (input.stepStatus === 'suppressed') data.suppressedAt = now();
    if (input.stepStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(stepId, updated);
    return updated;
  }

  async markReviewReady(stepId: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Step ready for review' });
  }

  async approveForFutureUse(stepId: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Step approved for future use' });
  }

  async completeMock(stepId: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'completed_mock', reasonCode: 'completed_mock', safeMessage: 'Step mock completed' });
  }

  async suppress(stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'suppressed', reasonCode, safeMessage });
  }

  async void(stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryStep): ResultRecoveryStepPreview {
    return {
      resultRecoveryStepId: r.resultRecoveryStepId,
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      stepOrder: r.stepOrder,
      stepStatus: r.stepStatus as string,
      stepType: r.stepType as string,
      safeStepSummary: r.safeStepSummary,
      reviewReadyAt: r.reviewReadyAt,
      completedMockAt: r.completedMockAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoveryPracticeDraftRepository implements ResultRecoveryPracticeDraftRepository {
  private store = new Map<string, ResultRecoveryPracticeDraft>();

  async create(input: CreatePracticeDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryPracticeDraft> {
    const record: ResultRecoveryPracticeDraft = {
      resultRecoveryPracticeDraftId: uuid(),
      schoolId: input.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      resultRecoveryObjectiveId: input.resultRecoveryObjectiveId ?? null,
      resultRecoveryStepId: input.resultRecoveryStepId ?? null,
      studentRef: input.studentRef,
      draftStatus: 'draft' as ResultRecoveryPracticeDraftStatus,
      draftMode: input.draftMode ?? 'mock',
      practiceType: input.practiceType ?? 'general_practice',
      safePracticeSummary: input.safePracticeSummary,
      questionRefsJson: (input.questionRefsJson as Record<string, unknown>) ?? null,
      objectiveRefsJson: (input.objectiveRefsJson as Record<string, unknown>) ?? null,
      difficultyHintsJson: (input.difficultyHintsJson as Record<string, unknown>) ?? null,
      selectionReasonCodesJson: (input.selectionReasonCodesJson as string[]) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewReadyAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryPracticeDraftId, record);
    return record;
  }

  async getById(draftId: string): Promise<ResultRecoveryPracticeDraft | null> {
    return this.store.get(draftId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByObjectiveId(objectiveId: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryObjectiveId === objectiveId)
      .map(r => this.toPreview(r));
  }

  async listByStepId(stepId: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryStepId === stepId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryPracticeDraftStatus | string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.draftStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByPracticeType(schoolId: string, practiceType: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.practiceType === practiceType)
      .map(r => this.toPreview(r));
  }

  async update(draftId: string, data: Partial<ResultRecoveryPracticeDraft>): Promise<ResultRecoveryPracticeDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`ResultRecoveryPracticeDraft not found: ${draftId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(draftId, updated);
    return updated;
  }

  async updateStatus(draftId: string, input: UpdateRecoveryPracticeDraftStatusInput): Promise<ResultRecoveryPracticeDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`ResultRecoveryPracticeDraft not found: ${draftId}`);
    const data: any = { draftStatus: input.draftStatus, updatedAt: now() };
    if (input.draftStatus === 'review_ready') data.reviewReadyAt = now();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.draftStatus === 'suppressed') data.suppressedAt = now();
    if (input.draftStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(draftId, updated);
    return updated;
  }

  async markReviewReady(draftId: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Practice draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Practice draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryPracticeDraft): ResultRecoveryPracticeDraftPreview {
    return {
      resultRecoveryPracticeDraftId: r.resultRecoveryPracticeDraftId,
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      practiceType: r.practiceType,
      draftStatus: r.draftStatus as string,
      safePracticeSummary: r.safePracticeSummary,
      reviewReadyAt: r.reviewReadyAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoveryResourceRecommendationRepository implements ResultRecoveryResourceRecommendationRepository {
  private store = new Map<string, ResultRecoveryResourceRecommendation>();

  async create(input: CreateResourceRecommendationInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryResourceRecommendation> {
    const record: ResultRecoveryResourceRecommendation = {
      resultRecoveryResourceRecommendationId: uuid(),
      schoolId: input.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      resultRecoveryObjectiveId: input.resultRecoveryObjectiveId ?? null,
      studentRef: input.studentRef,
      recommendationStatus: 'draft' as ResultRecoveryResourceRecommendationStatus,
      recommendationMode: input.recommendationMode ?? 'mock',
      resourceType: input.resourceType ?? 'practice',
      safeResourceSummary: input.safeResourceSummary,
      resourceRefsJson: (input.resourceRefsJson as Record<string, unknown>) ?? null,
      selectionReasonCodesJson: (input.selectionReasonCodesJson as string[]) ?? null,
      allowedAudienceJson: (input.allowedAudienceJson as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewReadyAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryResourceRecommendationId, record);
    return record;
  }

  async getById(recommendationId: string): Promise<ResultRecoveryResourceRecommendation | null> {
    return this.store.get(recommendationId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByObjectiveId(objectiveId: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryObjectiveId === objectiveId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryResourceRecommendationStatus | string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.recommendationStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByResourceType(schoolId: string, resourceType: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.resourceType === resourceType)
      .map(r => this.toPreview(r));
  }

  async update(recommendationId: string, data: Partial<ResultRecoveryResourceRecommendation>): Promise<ResultRecoveryResourceRecommendation> {
    const r = this.store.get(recommendationId);
    if (!r) throw new Error(`ResultRecoveryResourceRecommendation not found: ${recommendationId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(recommendationId, updated);
    return updated;
  }

  async updateStatus(recommendationId: string, input: UpdateRecoveryResourceRecommendationStatusInput): Promise<ResultRecoveryResourceRecommendation> {
    const r = this.store.get(recommendationId);
    if (!r) throw new Error(`ResultRecoveryResourceRecommendation not found: ${recommendationId}`);
    const data: any = { recommendationStatus: input.recommendationStatus, updatedAt: now() };
    if (input.recommendationStatus === 'review_ready') data.reviewReadyAt = now();
    if (input.recommendationStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.recommendationStatus === 'suppressed') data.suppressedAt = now();
    if (input.recommendationStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(recommendationId, updated);
    return updated;
  }

  async markReviewReady(recommendationId: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Resource recommendation ready for review' });
  }

  async approveForFutureUse(recommendationId: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Resource recommendation approved for future use' });
  }

  async suppress(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryResourceRecommendation): ResultRecoveryResourceRecommendationPreview {
    return {
      resultRecoveryResourceRecommendationId: r.resultRecoveryResourceRecommendationId,
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      resourceType: r.resourceType,
      recommendationStatus: r.recommendationStatus as string,
      safeResourceSummary: r.safeResourceSummary,
      reviewReadyAt: r.reviewReadyAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoveryTeacherReviewPacketRepository implements ResultRecoveryTeacherReviewPacketRepository {
  private store = new Map<string, ResultRecoveryTeacherReviewPacket>();

  async create(input: CreateTeacherReviewPacketInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryTeacherReviewPacket> {
    const record: ResultRecoveryTeacherReviewPacket = {
      resultRecoveryTeacherReviewPacketId: uuid(),
      schoolId: input.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      studentRef: input.studentRef,
      teacherRef: input.teacherRef,
      packetStatus: 'draft' as ResultRecoveryTeacherReviewPacketStatus,
      packetMode: input.packetMode ?? 'review',
      safePacketSummary: input.safePacketSummary,
      caseRefsJson: (input.caseRefsJson as Record<string, unknown>) ?? null,
      objectiveRefsJson: (input.objectiveRefsJson as Record<string, unknown>) ?? null,
      stepRefsJson: (input.stepRefsJson as Record<string, unknown>) ?? null,
      practiceDraftRefsJson: (input.practiceDraftRefsJson as Record<string, unknown>) ?? null,
      resourceRecommendationRefsJson: (input.resourceRecommendationRefsJson as Record<string, unknown>) ?? null,
      reviewQuestionsJson: (input.reviewQuestionsJson as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewReadyAt: null,
      acknowledgedMockAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryTeacherReviewPacketId, record);
    return record;
  }

  async getById(packetId: string): Promise<ResultRecoveryTeacherReviewPacket | null> {
    return this.store.get(packetId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryTeacherReviewPacketStatus | string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.packetStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(packetId: string, data: Partial<ResultRecoveryTeacherReviewPacket>): Promise<ResultRecoveryTeacherReviewPacket> {
    const r = this.store.get(packetId);
    if (!r) throw new Error(`ResultRecoveryTeacherReviewPacket not found: ${packetId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(packetId, updated);
    return updated;
  }

  async updateStatus(packetId: string, input: UpdateRecoveryTeacherReviewPacketStatusInput): Promise<ResultRecoveryTeacherReviewPacket> {
    const r = this.store.get(packetId);
    if (!r) throw new Error(`ResultRecoveryTeacherReviewPacket not found: ${packetId}`);
    const data: any = { packetStatus: input.packetStatus, updatedAt: now() };
    if (input.packetStatus === 'ready') data.reviewReadyAt = now();
    if (input.packetStatus === 'acknowledged_mock') data.acknowledgedMockAt = now();
    if (input.packetStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.packetStatus === 'suppressed') data.suppressedAt = now();
    if (input.packetStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(packetId, updated);
    return updated;
  }

  async markReady(packetId: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'ready', reasonCode: 'ready', safeMessage: 'Review packet ready' });
  }

  async acknowledgeMock(packetId: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'acknowledged_mock', reasonCode: 'acknowledged_mock', safeMessage: 'Review packet mock acknowledged' });
  }

  async approveForFutureUse(packetId: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Review packet approved for future use' });
  }

  async suppress(packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'suppressed', reasonCode, safeMessage });
  }

  async void(packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryTeacherReviewPacket): ResultRecoveryTeacherReviewPacketPreview {
    return {
      resultRecoveryTeacherReviewPacketId: r.resultRecoveryTeacherReviewPacketId,
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      teacherRef: r.teacherRef,
      packetStatus: r.packetStatus as string,
      safePacketSummary: r.safePacketSummary,
      reviewReadyAt: r.reviewReadyAt,
      acknowledgedMockAt: r.acknowledgedMockAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoveryStudentSupportDraftRepository implements ResultRecoveryStudentSupportDraftRepository {
  private store = new Map<string, ResultRecoveryStudentSupportDraft>();

  async create(input: CreateStudentSupportDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryStudentSupportDraft> {
    const record: ResultRecoveryStudentSupportDraft = {
      resultRecoveryStudentSupportDraftId: uuid(),
      schoolId: input.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      studentRef: input.studentRef,
      draftStatus: 'draft' as ResultRecoveryStudentSupportDraftStatus,
      draftMode: input.draftMode ?? 'mock',
      safeSupportSummary: input.safeSupportSummary,
      studentSupportBodyJson: (input.studentSupportBodyJson as Record<string, unknown>) ?? null,
      reflectionPromptRefsJson: (input.reflectionPromptRefsJson as Record<string, unknown>) ?? null,
      practiceDraftRefsJson: (input.practiceDraftRefsJson as Record<string, unknown>) ?? null,
      blockedFieldNamesJson: null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewReadyAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryStudentSupportDraftId, record);
    return record;
  }

  async getById(draftId: string): Promise<ResultRecoveryStudentSupportDraft | null> {
    return this.store.get(draftId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryStudentSupportDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryStudentSupportDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryStudentSupportDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryStudentSupportDraftStatus | string): Promise<ResultRecoveryStudentSupportDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.draftStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(draftId: string, data: Partial<ResultRecoveryStudentSupportDraft>): Promise<ResultRecoveryStudentSupportDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`ResultRecoveryStudentSupportDraft not found: ${draftId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(draftId, updated);
    return updated;
  }

  async updateStatus(draftId: string, input: UpdateRecoveryStudentSupportDraftStatusInput): Promise<ResultRecoveryStudentSupportDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`ResultRecoveryStudentSupportDraft not found: ${draftId}`);
    const data: any = { draftStatus: input.draftStatus, updatedAt: now() };
    if (input.draftStatus === 'review_ready') data.reviewReadyAt = now();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.draftStatus === 'suppressed') data.suppressedAt = now();
    if (input.draftStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(draftId, updated);
    return updated;
  }

  async markReviewReady(draftId: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Student support draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Student support draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryStudentSupportDraft): ResultRecoveryStudentSupportDraftPreview {
    return {
      resultRecoveryStudentSupportDraftId: r.resultRecoveryStudentSupportDraftId,
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      draftStatus: r.draftStatus as string,
      safeSupportSummary: r.safeSupportSummary,
      reviewReadyAt: r.reviewReadyAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoveryParentSupportNoteDraftRepository implements ResultRecoveryParentSupportNoteDraftRepository {
  private store = new Map<string, ResultRecoveryParentSupportNoteDraft>();

  async create(input: CreateParentSupportNoteDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryParentSupportNoteDraft> {
    const record: ResultRecoveryParentSupportNoteDraft = {
      resultRecoveryParentSupportNoteDraftId: uuid(),
      schoolId: input.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      studentRef: input.studentRef,
      audienceType: input.audienceType ?? 'parent',
      draftStatus: 'draft' as ResultRecoveryParentSupportNoteDraftStatus,
      draftMode: input.draftMode ?? 'mock',
      safeSupportSummary: input.safeSupportSummary,
      parentSupportBodyJson: (input.parentSupportBodyJson as Record<string, unknown>) ?? null,
      allowedFieldNamesJson: null,
      blockedFieldNamesJson: null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewReadyAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryParentSupportNoteDraftId, record);
    return record;
  }

  async getById(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft | null> {
    return this.store.get(draftId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryParentSupportNoteDraftStatus | string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.draftStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.audienceType === audienceType)
      .map(r => this.toPreview(r));
  }

  async update(draftId: string, data: Partial<ResultRecoveryParentSupportNoteDraft>): Promise<ResultRecoveryParentSupportNoteDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`ResultRecoveryParentSupportNoteDraft not found: ${draftId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(draftId, updated);
    return updated;
  }

  async updateStatus(draftId: string, input: UpdateRecoveryParentSupportNoteDraftStatusInput): Promise<ResultRecoveryParentSupportNoteDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`ResultRecoveryParentSupportNoteDraft not found: ${draftId}`);
    const data: any = { draftStatus: input.draftStatus, updatedAt: now() };
    if (input.draftStatus === 'review_ready') data.reviewReadyAt = now();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.draftStatus === 'suppressed') data.suppressedAt = now();
    if (input.draftStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(draftId, updated);
    return updated;
  }

  async markReviewReady(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Parent support note draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Parent support note draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryParentSupportNoteDraft): ResultRecoveryParentSupportNoteDraftPreview {
    return {
      resultRecoveryParentSupportNoteDraftId: r.resultRecoveryParentSupportNoteDraftId,
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      audienceType: r.audienceType,
      draftStatus: r.draftStatus as string,
      safeSupportSummary: r.safeSupportSummary,
      reviewReadyAt: r.reviewReadyAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoveryCheckpointRepository implements ResultRecoveryCheckpointRepository {
  private store = new Map<string, ResultRecoveryCheckpoint>();

  async create(input: CreateRecoveryCheckpointInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryCheckpoint> {
    const record: ResultRecoveryCheckpoint = {
      resultRecoveryCheckpointId: uuid(),
      schoolId: input.schoolId,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      studentRef: input.studentRef,
      checkpointStatus: 'draft' as ResultRecoveryCheckpointStatus,
      checkpointMode: input.checkpointMode ?? 'mock',
      checkpointType: input.checkpointType ?? 'progress_check',
      safeCheckpointSummary: input.safeCheckpointSummary,
      checkpointCriteriaJson: (input.checkpointCriteriaJson as Record<string, unknown>) ?? null,
      scheduledMockAt: null,
      completedMockAt: null,
      cancelledAt: null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      voidedAt: null,
    };
    this.store.set(record.resultRecoveryCheckpointId, record);
    return record;
  }

  async getById(checkpointId: string): Promise<ResultRecoveryCheckpoint | null> {
    return this.store.get(checkpointId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryCheckpointPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryCheckpointPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultRecoveryPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryCheckpointPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoveryCheckpointStatus | string): Promise<ResultRecoveryCheckpointPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.checkpointStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByType(schoolId: string, type: string): Promise<ResultRecoveryCheckpointPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.checkpointType === type)
      .map(r => this.toPreview(r));
  }

  async update(checkpointId: string, data: Partial<ResultRecoveryCheckpoint>): Promise<ResultRecoveryCheckpoint> {
    const r = this.store.get(checkpointId);
    if (!r) throw new Error(`ResultRecoveryCheckpoint not found: ${checkpointId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(checkpointId, updated);
    return updated;
  }

  async updateStatus(checkpointId: string, input: UpdateRecoveryCheckpointStatusInput): Promise<ResultRecoveryCheckpoint> {
    const r = this.store.get(checkpointId);
    if (!r) throw new Error(`ResultRecoveryCheckpoint not found: ${checkpointId}`);
    const data: any = { checkpointStatus: input.checkpointStatus, updatedAt: now() };
    if (input.checkpointStatus === 'scheduled_mock') data.scheduledMockAt = now();
    if (input.checkpointStatus === 'completed_mock') data.completedMockAt = now();
    if (input.checkpointStatus === 'cancelled') data.cancelledAt = now();
    if (input.checkpointStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(checkpointId, updated);
    return updated;
  }

  async scheduleMock(checkpointId: string): Promise<ResultRecoveryCheckpoint> {
    return this.updateStatus(checkpointId, { checkpointStatus: 'scheduled_mock', reasonCode: 'scheduled', safeMessage: 'Checkpoint mock scheduled' });
  }

  async completeMock(checkpointId: string): Promise<ResultRecoveryCheckpoint> {
    return this.updateStatus(checkpointId, { checkpointStatus: 'completed_mock', reasonCode: 'completed', safeMessage: 'Checkpoint mock completed' });
  }

  async cancel(checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryCheckpoint> {
    return this.updateStatus(checkpointId, { checkpointStatus: 'cancelled', reasonCode, safeMessage });
  }

  async void(checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryCheckpoint> {
    return this.updateStatus(checkpointId, { checkpointStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoveryCheckpoint): ResultRecoveryCheckpointPreview {
    return {
      resultRecoveryCheckpointId: r.resultRecoveryCheckpointId,
      resultRecoveryPlanId: r.resultRecoveryPlanId,
      checkpointStatus: r.checkpointStatus as string,
      checkpointType: r.checkpointType,
      safeCheckpointSummary: r.safeCheckpointSummary,
      scheduledMockAt: r.scheduledMockAt,
      completedMockAt: r.completedMockAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoverySummaryRepository implements ResultRecoverySummaryRepository {
  private store = new Map<string, ResultRecoverySummary>();

  async create(input: CreateRecoverySummaryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoverySummary> {
    const record: ResultRecoverySummary = {
      resultRecoverySummaryId: uuid(),
      schoolId: input.schoolId,
      studentRef: input.studentRef ?? null,
      summaryScope: input.summaryScope ?? 'school' as ResultRecoverySummaryScope,
      summaryStatus: 'active' as ResultRecoverySummaryStatus,
      safeSummary: input.safeSummary,
      planCountsJson: (input.planCountsJson as Record<string, unknown>) ?? null,
      objectiveCountsJson: (input.objectiveCountsJson as Record<string, unknown>) ?? null,
      checkpointCountsJson: (input.checkpointCountsJson as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdAt: now(),
      updatedAt: now(),
      refreshedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultRecoverySummaryId, record);
    return record;
  }

  async getById(summaryId: string): Promise<ResultRecoverySummary | null> {
    return this.store.get(summaryId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoverySummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoverySummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByScope(schoolId: string, scope: ResultRecoverySummaryScope | string): Promise<ResultRecoverySummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.summaryScope === scope)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultRecoverySummaryStatus | string): Promise<ResultRecoverySummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.summaryStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(summaryId: string, data: Partial<ResultRecoverySummary>): Promise<ResultRecoverySummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`ResultRecoverySummary not found: ${summaryId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(summaryId, updated);
    return updated;
  }

  async updateStatus(summaryId: string, input: UpdateRecoverySummaryStatusInput): Promise<ResultRecoverySummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`ResultRecoverySummary not found: ${summaryId}`);
    const data: any = { summaryStatus: input.summaryStatus, updatedAt: now() };
    if (input.summaryStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(summaryId, updated);
    return updated;
  }

  async refresh(summaryId: string): Promise<ResultRecoverySummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`ResultRecoverySummary not found: ${summaryId}`);
    const updated = { ...r, refreshedAt: now(), updatedAt: now() };
    this.store.set(summaryId, updated);
    return updated;
  }

  async markStale(summaryId: string): Promise<ResultRecoverySummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'stale', reasonCode: 'stale', safeMessage: 'Summary marked stale' });
  }

  async block(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultRecoverySummary): ResultRecoverySummaryPreview {
    return {
      resultRecoverySummaryId: r.resultRecoverySummaryId,
      schoolId: r.schoolId,
      summaryScope: r.summaryScope as string,
      summaryStatus: r.summaryStatus as string,
      safeSummary: r.safeSummary,
      refreshedAt: r.refreshedAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultRecoveryAuditRepository implements ResultRecoveryAuditRepository {
  private store = new Map<string, ResultRecoveryAuditEvent>();

  async create(event: ResultRecoveryAuditEvent): Promise<ResultRecoveryAuditEvent> {
    this.store.set(event.resultRecoveryAuditId, event);
    return event;
  }

  async getById(auditId: string): Promise<ResultRecoveryAuditEvent | null> {
    return this.store.get(auditId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryPlanId === planId);
  }

  async listByObjectiveId(objectiveId: string): Promise<ResultRecoveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryObjectiveId === objectiveId);
  }

  async listByStepId(stepId: string): Promise<ResultRecoveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.resultRecoveryStepId === stepId);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultRecoveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eventType === eventType);
  }
}

export class InMemoryResultRecoveryIdempotencyRepository implements ResultRecoveryIdempotencyRepository {
  private store = new Map<string, ResultRecoveryIdempotencyEntry>();

  private key(schoolId: string, operation: string, idempotencyKey: string): string {
    return `${schoolId}:${operation}:${idempotencyKey}`;
  }

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultRecoveryIdempotencyEntry> {
    const record: ResultRecoveryIdempotencyEntry = {
      resultRecoveryIdempotencyId: uuid(),
      schoolId: input.schoolId,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      status: input.status ?? 'in_progress',
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      safeResultSummary: input.safeResultSummary ?? null,
      createdAt: now(),
      updatedAt: now(),
      expiresAt: input.expiresAt ?? null,
    };
    this.store.set(this.key(record.schoolId, record.operation, record.idempotencyKey), record);
    this.store.set(record.resultRecoveryIdempotencyId, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultRecoveryIdempotencyEntry | null> {
    return this.store.get(this.key(schoolId, operation, idempotencyKey)) ?? null;
  }

  async updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultRecoveryIdempotencyEntry> {
    const r = this.store.get(idempotencyId);
    if (!r) throw new Error(`ResultRecoveryIdempotencyEntry not found: ${idempotencyId}`);
    const data: any = { status, updatedAt: now() };
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const updated = { ...r, ...data };
    this.store.set(idempotencyId, updated);
    this.store.set(this.key(r.schoolId, r.operation, r.idempotencyKey), updated);
    return updated;
  }

  async expire(idempotencyId: string): Promise<ResultRecoveryIdempotencyEntry> {
    return this.updateStatus(idempotencyId, 'expired');
  }
}
