import type {
  ResultFollowUpCase,
  CreateFollowUpCaseInput,
  ResultFollowUpCasePreview,
  UpdateFollowUpCaseStatusInput,
} from '../contracts/resultFollowUpCaseContracts';
import type {
  ResultFollowUpSignal,
  CreateFollowUpSignalInput,
  ResultFollowUpSignalPreview,
  UpdateFollowUpSignalStatusInput,
} from '../contracts/resultFollowUpSignalContracts';
import type {
  ResultFollowUpActionPlan,
  CreateActionPlanInput,
  ResultFollowUpActionPlanPreview,
  UpdateActionPlanStatusInput,
} from '../contracts/resultFollowUpActionPlanContracts';
import type {
  TeacherFollowUpQueueItem,
  CreateTeacherQueueItemInput,
  TeacherFollowUpQueueItemPreview,
  UpdateTeacherQueueStatusInput,
} from '../contracts/teacherFollowUpQueueContracts';
import type {
  ParentGuidanceDraft,
  CreateParentGuidanceDraftInput,
  ParentGuidanceDraftPreview,
  UpdateParentGuidanceDraftStatusInput,
} from '../contracts/parentGuidanceDraftContracts';
import type {
  StudentReflectionTaskDraft,
  CreateStudentReflectionTaskDraftInput,
  StudentReflectionTaskDraftPreview,
  UpdateStudentReflectionDraftStatusInput,
} from '../contracts/studentReflectionTaskDraftContracts';
import type {
  FollowUpReviewWindow,
  CreateReviewWindowInput,
  FollowUpReviewWindowPreview,
  UpdateReviewWindowStatusInput,
} from '../contracts/followUpReviewWindowContracts';
import type {
  FollowUpEscalationPlan,
  CreateEscalationPlanInput,
  FollowUpEscalationPlanPreview,
  UpdateEscalationPlanStatusInput,
} from '../contracts/followUpEscalationPlanContracts';
import type {
  FollowUpSummary,
  CreateFollowUpSummaryInput,
  FollowUpSummaryPreview,
  UpdateFollowUpSummaryStatusInput,
} from '../contracts/followUpSummaryContracts';
import type {
  FollowUpAuditEvent,
  FollowUpIdempotencyEntry,
  ResultFollowUpCaseStatus,
  ResultFollowUpCaseType,
  ResultFollowUpCasePriority,
  ResultFollowUpSignalStatus,
  ResultFollowUpSignalType,
  ResultFollowUpSignalSeverity,
  ResultFollowUpActionPlanStatus,
  TeacherFollowUpQueueStatus,
  ParentGuidanceDraftStatus,
  StudentReflectionTaskDraftStatus,
  FollowUpReviewWindowStatus,
  FollowUpEscalationPlanStatus,
  FollowUpSummaryStatus,
} from '../contracts';
import type {
  ResultFollowUpCaseRepository,
  ResultFollowUpSignalRepository,
  ResultFollowUpActionPlanRepository,
  TeacherFollowUpQueueRepository,
  ParentGuidanceDraftRepository,
  StudentReflectionTaskDraftRepository,
  FollowUpReviewWindowRepository,
  FollowUpEscalationPlanRepository,
  FollowUpSummaryRepository,
  FollowUpAuditRepository,
  FollowUpIdempotencyRepository,
} from '../contracts';

let counter = 0;
function uuid(): string { return `fu-${++counter}`; }
function now(): string { return new Date().toISOString(); }

export class InMemoryResultFollowUpCaseRepository implements ResultFollowUpCaseRepository {
  private store = new Map<string, ResultFollowUpCase>();

  async create(input: CreateFollowUpCaseInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpCase> {
    const record: ResultFollowUpCase = {
      resultFollowUpCaseId: uuid(),
      schoolId: input.schoolId,
      studentRef: input.studentRef,
      resultFinalizationDecisionId: input.resultFinalizationDecisionId ?? null,
      resultReleaseReadinessId: input.resultReleaseReadinessId ?? null,
      resultReleasePacketId: input.resultReleasePacketId ?? null,
      resultReportCardAssemblyId: input.resultReportCardAssemblyId ?? null,
      resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId ?? null,
      resultReportCardAccessGrantId: input.resultReportCardAccessGrantId ?? null,
      resultReportCardAccessSummaryId: input.resultReportCardAccessSummaryId ?? null,
      caseStatus: 'draft' as ResultFollowUpCaseStatus,
      caseType: input.caseType ?? 'general_growth_support' as ResultFollowUpCaseType,
      casePriority: input.casePriority ?? 'medium' as ResultFollowUpCasePriority,
      caseMode: input.caseMode ?? 'mock_action_only' as any,
      safeCaseSummary: input.safeCaseSummary,
      sourceRefsJson: (input.sourceRefs as Record<string, unknown>) ?? null,
      triggerReasonsJson: (input.triggerReasons as Record<string, unknown>) ?? null,
      allowedActionsJson: (input.allowedActions as Record<string, unknown>) ?? null,
      blockedActionsJson: (input.blockedActions as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: (input.blockedReasonCodes as Record<string, unknown>) ?? null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      openedAt: null,
      triagedAt: null,
      plannedAt: null,
      reviewedAt: null,
      closedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultFollowUpCaseId, record);
    return record;
  }

  async getById(caseId: string): Promise<ResultFollowUpCase | null> {
    return this.store.get(caseId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultFollowUpCasePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpCasePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultFollowUpCaseStatus | string): Promise<ResultFollowUpCasePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.caseStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByPriority(schoolId: string, priority: ResultFollowUpCasePriority | string): Promise<ResultFollowUpCasePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.casePriority === priority)
      .map(r => this.toPreview(r));
  }

  async listByType(schoolId: string, type: ResultFollowUpCaseType | string): Promise<ResultFollowUpCasePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.caseType === type)
      .map(r => this.toPreview(r));
  }

  async update(caseId: string, data: Partial<ResultFollowUpCase>): Promise<ResultFollowUpCase> {
    const r = this.store.get(caseId);
    if (!r) throw new Error(`ResultFollowUpCase not found: ${caseId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(caseId, updated);
    return updated;
  }

  async updateStatus(caseId: string, input: UpdateFollowUpCaseStatusInput): Promise<ResultFollowUpCase> {
    const r = this.store.get(caseId);
    if (!r) throw new Error(`ResultFollowUpCase not found: ${caseId}`);
    const data: any = { caseStatus: input.caseStatus, updatedAt: now() };
    if (input.caseStatus === 'opened') data.openedAt = now();
    if (input.caseStatus === 'triaged') data.triagedAt = now();
    if (input.caseStatus === 'planned') data.plannedAt = now();
    if (input.caseStatus === 'under_review') data.reviewedAt = now();
    if (input.caseStatus === 'closed') data.closedAt = now();
    if (input.caseStatus === 'blocked') data.blockedAt = now();
    if (input.caseStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(caseId, updated);
    return updated;
  }

  async open(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'opened', reasonCode, safeMessage });
  }

  async triage(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'triaged', reasonCode, safeMessage });
  }

  async markPlanned(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'planned', reasonCode, safeMessage });
  }

  async markUnderReview(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'under_review', reasonCode, safeMessage });
  }

  async close(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'closed', reasonCode, safeMessage });
  }

  async block(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultFollowUpCase): ResultFollowUpCasePreview {
    return {
      resultFollowUpCaseId: r.resultFollowUpCaseId,
      schoolId: r.schoolId,
      studentRef: r.studentRef,
      caseStatus: r.caseStatus as string,
      caseType: r.caseType as string,
      casePriority: r.casePriority as string,
      caseMode: r.caseMode as string,
      safeCaseSummary: r.safeCaseSummary,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export class InMemoryResultFollowUpSignalRepository implements ResultFollowUpSignalRepository {
  private store = new Map<string, ResultFollowUpSignal>();

  async create(input: CreateFollowUpSignalInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpSignal> {
    const record: ResultFollowUpSignal = {
      resultFollowUpSignalId: uuid(),
      schoolId: input.schoolId,
      resultFollowUpCaseId: input.resultFollowUpCaseId,
      studentRef: input.studentRef,
      signalStatus: 'active' as ResultFollowUpSignalStatus,
      signalType: input.signalType ?? 'teacher_review_requested' as ResultFollowUpSignalType,
      signalSeverity: input.signalSeverity ?? 'medium' as ResultFollowUpSignalSeverity,
      signalSource: input.signalSource,
      safeSignalSummary: input.safeSignalSummary,
      evidenceRefsJson: (input.evidenceRefs as Record<string, unknown>) ?? null,
      reasonCodesJson: (input.reasonCodes as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultFollowUpSignalId, record);
    return record;
  }

  async getById(signalId: string): Promise<ResultFollowUpSignal | null> {
    return this.store.get(signalId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultFollowUpSignalPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByCaseId(caseId: string): Promise<ResultFollowUpSignalPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpCaseId === caseId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpSignalPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listBySeverity(schoolId: string, severity: ResultFollowUpSignalSeverity | string): Promise<ResultFollowUpSignalPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.signalSeverity === severity)
      .map(r => this.toPreview(r));
  }

  async listByType(schoolId: string, type: ResultFollowUpSignalType | string): Promise<ResultFollowUpSignalPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.signalType === type)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultFollowUpSignalStatus | string): Promise<ResultFollowUpSignalPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.signalStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(signalId: string, data: Partial<ResultFollowUpSignal>): Promise<ResultFollowUpSignal> {
    const r = this.store.get(signalId);
    if (!r) throw new Error(`ResultFollowUpSignal not found: ${signalId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(signalId, updated);
    return updated;
  }

  async updateStatus(signalId: string, input: UpdateFollowUpSignalStatusInput): Promise<ResultFollowUpSignal> {
    const r = this.store.get(signalId);
    if (!r) throw new Error(`ResultFollowUpSignal not found: ${signalId}`);
    const data: any = { signalStatus: input.signalStatus, updatedAt: now() };
    if (input.signalStatus === 'suppressed') data.suppressedAt = now();
    if (input.signalStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(signalId, updated);
    return updated;
  }

  async suppress(signalId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpSignal> {
    return this.updateStatus(signalId, { signalStatus: 'suppressed', reasonCode, safeMessage });
  }

  async void(signalId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpSignal> {
    return this.updateStatus(signalId, { signalStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultFollowUpSignal): ResultFollowUpSignalPreview {
    return {
      resultFollowUpSignalId: r.resultFollowUpSignalId,
      resultFollowUpCaseId: r.resultFollowUpCaseId,
      studentRef: r.studentRef,
      signalStatus: r.signalStatus as string,
      signalType: r.signalType as string,
      signalSeverity: r.signalSeverity as string,
      safeSignalSummary: r.safeSignalSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultFollowUpActionPlanRepository implements ResultFollowUpActionPlanRepository {
  private store = new Map<string, ResultFollowUpActionPlan>();

  async create(input: CreateActionPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpActionPlan> {
    const record: ResultFollowUpActionPlan = {
      resultFollowUpActionPlanId: uuid(),
      schoolId: input.schoolId,
      resultFollowUpCaseId: input.resultFollowUpCaseId,
      studentRef: input.studentRef,
      planStatus: 'draft' as ResultFollowUpActionPlanStatus,
      planMode: input.planMode ?? 'mock_action_only',
      safePlanSummary: input.safePlanSummary,
      recommendedActionsJson: (input.recommendedActions as Record<string, unknown>) ?? null,
      teacherReviewNotesJson: (input.teacherReviewNotes as Record<string, unknown>) ?? null,
      parentSafeGuidanceRefsJson: null,
      studentReflectionRefsJson: null,
      reviewWindowRefsJson: null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      draftedAt: now(),
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultFollowUpActionPlanId, record);
    return record;
  }

  async getById(planId: string): Promise<ResultFollowUpActionPlan | null> {
    return this.store.get(planId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultFollowUpActionPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByCaseId(caseId: string): Promise<ResultFollowUpActionPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpCaseId === caseId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpActionPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultFollowUpActionPlanStatus | string): Promise<ResultFollowUpActionPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.planStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(planId: string, data: Partial<ResultFollowUpActionPlan>): Promise<ResultFollowUpActionPlan> {
    const r = this.store.get(planId);
    if (!r) throw new Error(`ResultFollowUpActionPlan not found: ${planId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(planId, updated);
    return updated;
  }

  async updateStatus(planId: string, input: UpdateActionPlanStatusInput): Promise<ResultFollowUpActionPlan> {
    const r = this.store.get(planId);
    if (!r) throw new Error(`ResultFollowUpActionPlan not found: ${planId}`);
    const data: any = { planStatus: input.planStatus, updatedAt: now() };
    if (input.planStatus === 'teacher_review_ready') data.updatedAt = now();
    if (input.planStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.planStatus === 'suppressed') data.suppressedAt = now();
    if (input.planStatus === 'blocked') data.updatedAt = now();
    if (input.planStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(planId, updated);
    return updated;
  }

  async markReviewReady(planId: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'teacher_review_ready', reasonCode: 'review_ready', safeMessage: 'Action plan ready for review' });
  }

  async approveForFutureUse(planId: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Action plan approved for future use' });
  }

  async suppress(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultFollowUpActionPlan): ResultFollowUpActionPlanPreview {
    return {
      resultFollowUpActionPlanId: r.resultFollowUpActionPlanId,
      resultFollowUpCaseId: r.resultFollowUpCaseId,
      studentRef: r.studentRef,
      planStatus: r.planStatus as string,
      planMode: r.planMode,
      safePlanSummary: r.safePlanSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryTeacherFollowUpQueueRepository implements TeacherFollowUpQueueRepository {
  private store = new Map<string, TeacherFollowUpQueueItem>();

  async create(input: CreateTeacherQueueItemInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<TeacherFollowUpQueueItem> {
    const record: TeacherFollowUpQueueItem = {
      teacherFollowUpQueueItemId: uuid(),
      schoolId: input.schoolId,
      resultFollowUpCaseId: input.resultFollowUpCaseId,
      resultFollowUpActionPlanId: input.resultFollowUpActionPlanId ?? null,
      studentRef: input.studentRef,
      teacherRef: input.teacherRef,
      queueStatus: 'draft' as TeacherFollowUpQueueStatus,
      queueMode: input.queueMode ?? 'mock_review',
      queuePriority: input.queuePriority ?? 'medium',
      safeQueueSummary: input.safeQueueSummary,
      suggestedNextActionsJson: (input.suggestedNextActions as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      queuedAt: null,
      acknowledgedAt: null,
      completedAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.teacherFollowUpQueueItemId, record);
    return record;
  }

  async getById(queueItemId: string): Promise<TeacherFollowUpQueueItem | null> {
    return this.store.get(queueItemId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByCaseId(caseId: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpCaseId === caseId)
      .map(r => this.toPreview(r));
  }

  async listByActionPlanId(planId: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpActionPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef)
      .map(r => this.toPreview(r));
  }

  async listByPriority(schoolId: string, priority: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.queuePriority === priority)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: TeacherFollowUpQueueStatus | string): Promise<TeacherFollowUpQueueItemPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.queueStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(queueItemId: string, data: Partial<TeacherFollowUpQueueItem>): Promise<TeacherFollowUpQueueItem> {
    const r = this.store.get(queueItemId);
    if (!r) throw new Error(`TeacherFollowUpQueueItem not found: ${queueItemId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(queueItemId, updated);
    return updated;
  }

  async updateStatus(queueItemId: string, input: UpdateTeacherQueueStatusInput): Promise<TeacherFollowUpQueueItem> {
    const r = this.store.get(queueItemId);
    if (!r) throw new Error(`TeacherFollowUpQueueItem not found: ${queueItemId}`);
    const data: any = { queueStatus: input.queueStatus, updatedAt: now() };
    if (input.queueStatus === 'queued_for_review') data.queuedAt = now();
    if (input.queueStatus === 'acknowledged_mock') data.acknowledgedAt = now();
    if (input.queueStatus === 'completed_mock') data.completedAt = now();
    if (input.queueStatus === 'suppressed') data.suppressedAt = now();
    if (input.queueStatus === 'blocked') data.updatedAt = now();
    if (input.queueStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(queueItemId, updated);
    return updated;
  }

  async markQueued(queueItemId: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'queued_for_review', reasonCode: 'queued', safeMessage: 'Queue item queued for review' });
  }

  async acknowledge(queueItemId: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'acknowledged_mock', reasonCode: 'acknowledged', safeMessage: 'Queue item acknowledged' });
  }

  async complete(queueItemId: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'completed_mock', reasonCode: 'completed', safeMessage: 'Queue item completed' });
  }

  async suppress(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: TeacherFollowUpQueueItem): TeacherFollowUpQueueItemPreview {
    return {
      teacherFollowUpQueueItemId: r.teacherFollowUpQueueItemId,
      resultFollowUpCaseId: r.resultFollowUpCaseId,
      studentRef: r.studentRef,
      teacherRef: r.teacherRef,
      queueStatus: r.queueStatus as string,
      queuePriority: r.queuePriority,
      safeQueueSummary: r.safeQueueSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryParentGuidanceDraftRepository implements ParentGuidanceDraftRepository {
  private store = new Map<string, ParentGuidanceDraft>();

  async create(input: CreateParentGuidanceDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ParentGuidanceDraft> {
    const record: ParentGuidanceDraft = {
      parentGuidanceDraftId: uuid(),
      schoolId: input.schoolId,
      resultFollowUpCaseId: input.resultFollowUpCaseId,
      resultFollowUpActionPlanId: input.resultFollowUpActionPlanId ?? null,
      studentRef: input.studentRef,
      audienceType: input.audienceType ?? 'parent',
      draftStatus: 'draft' as ParentGuidanceDraftStatus,
      draftMode: input.draftMode ?? 'mock_only',
      safeGuidanceSummary: input.safeGuidanceSummary,
      safeGuidanceBodyJson: (input.safeGuidanceBody as Record<string, unknown>) ?? null,
      allowedFieldNamesJson: (input.allowedFieldNames as Record<string, unknown>) ?? null,
      blockedFieldNamesJson: (input.blockedFieldNames as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewedAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.parentGuidanceDraftId, record);
    return record;
  }

  async getById(draftId: string): Promise<ParentGuidanceDraft | null> {
    return this.store.get(draftId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ParentGuidanceDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByCaseId(caseId: string): Promise<ParentGuidanceDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpCaseId === caseId)
      .map(r => this.toPreview(r));
  }

  async listByActionPlanId(planId: string): Promise<ParentGuidanceDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpActionPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ParentGuidanceDraftStatus | string): Promise<ParentGuidanceDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.draftStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(draftId: string, data: Partial<ParentGuidanceDraft>): Promise<ParentGuidanceDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`ParentGuidanceDraft not found: ${draftId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(draftId, updated);
    return updated;
  }

  async updateStatus(draftId: string, input: UpdateParentGuidanceDraftStatusInput): Promise<ParentGuidanceDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`ParentGuidanceDraft not found: ${draftId}`);
    const data: any = { draftStatus: input.draftStatus, updatedAt: now() };
    if (input.draftStatus === 'review_ready') data.reviewedAt = now();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.draftStatus === 'suppressed') data.suppressedAt = now();
    if (input.draftStatus === 'blocked') data.updatedAt = now();
    if (input.draftStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(draftId, updated);
    return updated;
  }

  async markReviewReady(draftId: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Parent guidance draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Parent guidance draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ParentGuidanceDraft): ParentGuidanceDraftPreview {
    return {
      parentGuidanceDraftId: r.parentGuidanceDraftId,
      resultFollowUpCaseId: r.resultFollowUpCaseId,
      studentRef: r.studentRef,
      draftStatus: r.draftStatus as string,
      safeGuidanceSummary: r.safeGuidanceSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryStudentReflectionTaskDraftRepository implements StudentReflectionTaskDraftRepository {
  private store = new Map<string, StudentReflectionTaskDraft>();

  async create(input: CreateStudentReflectionTaskDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<StudentReflectionTaskDraft> {
    const record: StudentReflectionTaskDraft = {
      studentReflectionTaskDraftId: uuid(),
      schoolId: input.schoolId,
      resultFollowUpCaseId: input.resultFollowUpCaseId,
      resultFollowUpActionPlanId: input.resultFollowUpActionPlanId ?? null,
      studentRef: input.studentRef,
      draftStatus: 'draft' as StudentReflectionTaskDraftStatus,
      draftMode: input.draftMode ?? 'mock_only',
      safeReflectionPrompt: input.safeReflectionPrompt,
      reflectionObjectiveRefsJson: (input.reflectionObjectiveRefs as Record<string, unknown>) ?? null,
      scaffoldStepsJson: (input.scaffoldSteps as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewedAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.studentReflectionTaskDraftId, record);
    return record;
  }

  async getById(draftId: string): Promise<StudentReflectionTaskDraft | null> {
    return this.store.get(draftId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<StudentReflectionTaskDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByCaseId(caseId: string): Promise<StudentReflectionTaskDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpCaseId === caseId)
      .map(r => this.toPreview(r));
  }

  async listByActionPlanId(planId: string): Promise<StudentReflectionTaskDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpActionPlanId === planId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: StudentReflectionTaskDraftStatus | string): Promise<StudentReflectionTaskDraftPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.draftStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(draftId: string, data: Partial<StudentReflectionTaskDraft>): Promise<StudentReflectionTaskDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`StudentReflectionTaskDraft not found: ${draftId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(draftId, updated);
    return updated;
  }

  async updateStatus(draftId: string, input: UpdateStudentReflectionDraftStatusInput): Promise<StudentReflectionTaskDraft> {
    const r = this.store.get(draftId);
    if (!r) throw new Error(`StudentReflectionTaskDraft not found: ${draftId}`);
    const data: any = { draftStatus: input.draftStatus, updatedAt: now() };
    if (input.draftStatus === 'review_ready') data.reviewedAt = now();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.draftStatus === 'suppressed') data.suppressedAt = now();
    if (input.draftStatus === 'blocked') data.updatedAt = now();
    if (input.draftStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(draftId, updated);
    return updated;
  }

  async markReviewReady(draftId: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Student reflection draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Student reflection draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: StudentReflectionTaskDraft): StudentReflectionTaskDraftPreview {
    return {
      studentReflectionTaskDraftId: r.studentReflectionTaskDraftId,
      resultFollowUpCaseId: r.resultFollowUpCaseId,
      studentRef: r.studentRef,
      draftStatus: r.draftStatus as string,
      safeReflectionPrompt: r.safeReflectionPrompt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryFollowUpReviewWindowRepository implements FollowUpReviewWindowRepository {
  private store = new Map<string, FollowUpReviewWindow>();

  async create(input: CreateReviewWindowInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<FollowUpReviewWindow> {
    const record: FollowUpReviewWindow = {
      followUpReviewWindowId: uuid(),
      schoolId: input.schoolId,
      resultFollowUpCaseId: input.resultFollowUpCaseId,
      studentRef: input.studentRef,
      windowStatus: 'draft' as FollowUpReviewWindowStatus,
      windowMode: input.windowMode ?? 'mock_only',
      reviewWindowStartAt: input.reviewWindowStartAt ?? null,
      reviewWindowEndAt: input.reviewWindowEndAt ?? null,
      safeWindowSummary: input.safeWindowSummary,
      reviewCriteriaJson: (input.reviewCriteria as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      scheduledMockAt: null,
      completedMockAt: null,
      cancelledAt: null,
      voidedAt: null,
    };
    this.store.set(record.followUpReviewWindowId, record);
    return record;
  }

  async getById(windowId: string): Promise<FollowUpReviewWindow | null> {
    return this.store.get(windowId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<FollowUpReviewWindowPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByCaseId(caseId: string): Promise<FollowUpReviewWindowPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpCaseId === caseId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpReviewWindowPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: FollowUpReviewWindowStatus | string): Promise<FollowUpReviewWindowPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.windowStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(windowId: string, data: Partial<FollowUpReviewWindow>): Promise<FollowUpReviewWindow> {
    const r = this.store.get(windowId);
    if (!r) throw new Error(`FollowUpReviewWindow not found: ${windowId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(windowId, updated);
    return updated;
  }

  async updateStatus(windowId: string, input: UpdateReviewWindowStatusInput): Promise<FollowUpReviewWindow> {
    const r = this.store.get(windowId);
    if (!r) throw new Error(`FollowUpReviewWindow not found: ${windowId}`);
    const data: any = { windowStatus: input.windowStatus, updatedAt: now() };
    if (input.windowStatus === 'scheduled_mock') data.scheduledMockAt = now();
    if (input.windowStatus === 'completed_mock') data.completedMockAt = now();
    if (input.windowStatus === 'cancelled') data.cancelledAt = now();
    if (input.windowStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(windowId, updated);
    return updated;
  }

  async scheduleMock(windowId: string): Promise<FollowUpReviewWindow> {
    return this.updateStatus(windowId, { windowStatus: 'scheduled_mock', reasonCode: 'scheduled', safeMessage: 'Review window mock scheduled' });
  }

  async completeMock(windowId: string): Promise<FollowUpReviewWindow> {
    return this.updateStatus(windowId, { windowStatus: 'completed_mock', reasonCode: 'completed', safeMessage: 'Review window mock completed' });
  }

  async cancel(windowId: string, reasonCode: string, safeMessage: string): Promise<FollowUpReviewWindow> {
    return this.updateStatus(windowId, { windowStatus: 'cancelled', reasonCode, safeMessage });
  }

  async void(windowId: string, reasonCode: string, safeMessage: string): Promise<FollowUpReviewWindow> {
    return this.updateStatus(windowId, { windowStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: FollowUpReviewWindow): FollowUpReviewWindowPreview {
    return {
      followUpReviewWindowId: r.followUpReviewWindowId,
      resultFollowUpCaseId: r.resultFollowUpCaseId,
      studentRef: r.studentRef,
      windowStatus: r.windowStatus as string,
      safeWindowSummary: r.safeWindowSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryFollowUpEscalationPlanRepository implements FollowUpEscalationPlanRepository {
  private store = new Map<string, FollowUpEscalationPlan>();

  async create(input: CreateEscalationPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<FollowUpEscalationPlan> {
    const record: FollowUpEscalationPlan = {
      followUpEscalationPlanId: uuid(),
      schoolId: input.schoolId,
      resultFollowUpCaseId: input.resultFollowUpCaseId,
      studentRef: input.studentRef,
      escalationStatus: 'draft' as FollowUpEscalationPlanStatus,
      escalationMode: input.escalationMode ?? 'mock_preparation',
      escalationLevel: input.escalationLevel ?? 'teacher_level_1',
      safeEscalationSummary: input.safeEscalationSummary,
      reviewerRoleTargetsJson: (input.reviewerRoleTargets as Record<string, unknown>) ?? null,
      allowedDisclosureJson: (input.allowedDisclosure as Record<string, unknown>) ?? null,
      blockedDisclosureJson: (input.blockedDisclosure as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdByActorId: input.createdByActorId,
      createdByRole: input.createdByRole,
      createdAt: now(),
      updatedAt: now(),
      reviewedAt: null,
      approvedForFutureUseAt: null,
      suppressedAt: null,
      voidedAt: null,
    };
    this.store.set(record.followUpEscalationPlanId, record);
    return record;
  }

  async getById(planId: string): Promise<FollowUpEscalationPlan | null> {
    return this.store.get(planId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<FollowUpEscalationPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByCaseId(caseId: string): Promise<FollowUpEscalationPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultFollowUpCaseId === caseId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpEscalationPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: FollowUpEscalationPlanStatus | string): Promise<FollowUpEscalationPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.escalationStatus === status)
      .map(r => this.toPreview(r));
  }

  async listByLevel(schoolId: string, level: string): Promise<FollowUpEscalationPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.escalationLevel === level)
      .map(r => this.toPreview(r));
  }

  async update(planId: string, data: Partial<FollowUpEscalationPlan>): Promise<FollowUpEscalationPlan> {
    const r = this.store.get(planId);
    if (!r) throw new Error(`FollowUpEscalationPlan not found: ${planId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(planId, updated);
    return updated;
  }

  async updateStatus(planId: string, input: UpdateEscalationPlanStatusInput): Promise<FollowUpEscalationPlan> {
    const r = this.store.get(planId);
    if (!r) throw new Error(`FollowUpEscalationPlan not found: ${planId}`);
    const data: any = { escalationStatus: input.escalationStatus, updatedAt: now() };
    if (input.escalationStatus === 'review_ready') data.reviewedAt = now();
    if (input.escalationStatus === 'approved_for_future_use') data.approvedForFutureUseAt = now();
    if (input.escalationStatus === 'suppressed') data.suppressedAt = now();
    if (input.escalationStatus === 'blocked') data.updatedAt = now();
    if (input.escalationStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(planId, updated);
    return updated;
  }

  async markReviewReady(planId: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Escalation plan ready for review' });
  }

  async approveForFutureUse(planId: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Escalation plan approved for future use' });
  }

  async suppress(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: FollowUpEscalationPlan): FollowUpEscalationPlanPreview {
    return {
      followUpEscalationPlanId: r.followUpEscalationPlanId,
      resultFollowUpCaseId: r.resultFollowUpCaseId,
      studentRef: r.studentRef,
      escalationStatus: r.escalationStatus as string,
      escalationLevel: r.escalationLevel,
      safeEscalationSummary: r.safeEscalationSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryFollowUpSummaryRepository implements FollowUpSummaryRepository {
  private store = new Map<string, FollowUpSummary>();

  async create(input: CreateFollowUpSummaryInput & { createdByActorId: string; createdByRole: string }): Promise<FollowUpSummary> {
    const record: FollowUpSummary = {
      followUpSummaryId: uuid(),
      schoolId: input.schoolId,
      studentRef: input.studentRef ?? null,
      summaryScope: input.summaryScope as any ?? 'school',
      summaryStatus: 'active' as FollowUpSummaryStatus,
      safeSummary: input.safeSummary,
      caseCountsJson: (input.caseCounts as Record<string, unknown>) ?? null,
      priorityCountsJson: (input.priorityCounts as Record<string, unknown>) ?? null,
      statusCountsJson: (input.statusCounts as Record<string, unknown>) ?? null,
      blockedReasonCodesJson: null,
      createdAt: now(),
      updatedAt: now(),
      refreshedAt: null,
      voidedAt: null,
    };
    this.store.set(record.followUpSummaryId, record);
    return record;
  }

  async getById(summaryId: string): Promise<FollowUpSummary | null> {
    return this.store.get(summaryId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<FollowUpSummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpSummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByScope(schoolId: string, scope: string): Promise<FollowUpSummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.summaryScope === scope)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: FollowUpSummaryStatus | string): Promise<FollowUpSummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.summaryStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(summaryId: string, data: Partial<FollowUpSummary>): Promise<FollowUpSummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`FollowUpSummary not found: ${summaryId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(summaryId, updated);
    return updated;
  }

  async updateStatus(summaryId: string, input: UpdateFollowUpSummaryStatusInput): Promise<FollowUpSummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`FollowUpSummary not found: ${summaryId}`);
    const data: any = { summaryStatus: input.summaryStatus, updatedAt: now() };
    if (input.summaryStatus === 'stale') data.updatedAt = now();
    if (input.summaryStatus === 'blocked') data.updatedAt = now();
    if (input.summaryStatus === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(summaryId, updated);
    return updated;
  }

  async refresh(summaryId: string): Promise<FollowUpSummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`FollowUpSummary not found: ${summaryId}`);
    const updated = { ...r, refreshedAt: now(), updatedAt: now() };
    this.store.set(summaryId, updated);
    return updated;
  }

  async markStale(summaryId: string): Promise<FollowUpSummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'stale', reasonCode: 'stale', safeMessage: 'Summary marked stale' });
  }

  async block(summaryId: string, reasonCode: string, safeMessage: string): Promise<FollowUpSummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(summaryId: string, reasonCode: string, safeMessage: string): Promise<FollowUpSummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: FollowUpSummary): FollowUpSummaryPreview {
    return {
      followUpSummaryId: r.followUpSummaryId,
      schoolId: r.schoolId,
      studentRef: r.studentRef,
      summaryScope: r.summaryScope as string,
      summaryStatus: r.summaryStatus as string,
      safeSummary: r.safeSummary,
      createdAt: r.createdAt,
      refreshedAt: r.refreshedAt,
    };
  }
}

export class InMemoryFollowUpAuditRepository implements FollowUpAuditRepository {
  private store = new Map<string, FollowUpAuditEvent>();

  async create(event: FollowUpAuditEvent): Promise<FollowUpAuditEvent> {
    this.store.set(event.followUpAuditId, event);
    return event;
  }

  async getById(auditId: string): Promise<FollowUpAuditEvent | null> {
    return this.store.get(auditId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<FollowUpAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByCaseId(caseId: string): Promise<FollowUpAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.resultFollowUpCaseId === caseId);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<FollowUpAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eventType === eventType);
  }
}

export class InMemoryFollowUpIdempotencyRepository implements FollowUpIdempotencyRepository {
  private store = new Map<string, FollowUpIdempotencyEntry>();

  private key(schoolId: string, operation: string, idempotencyKey: string): string {
    return `${schoolId}:${operation}:${idempotencyKey}`;
  }

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<FollowUpIdempotencyEntry> {
    const record: FollowUpIdempotencyEntry = {
      followUpIdempotencyId: uuid(),
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
    this.store.set(record.followUpIdempotencyId, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<FollowUpIdempotencyEntry | null> {
    return this.store.get(this.key(schoolId, operation, idempotencyKey)) ?? null;
  }

  async updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<FollowUpIdempotencyEntry> {
    const r = this.store.get(idempotencyId);
    if (!r) throw new Error(`FollowUpIdempotencyEntry not found: ${idempotencyId}`);
    const data: any = { status, updatedAt: now() };
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const updated = { ...r, ...data };
    this.store.set(idempotencyId, updated);
    this.store.set(this.key(r.schoolId, r.operation, r.idempotencyKey), updated);
    return updated;
  }

  async expire(idempotencyId: string): Promise<FollowUpIdempotencyEntry> {
    return this.updateStatus(idempotencyId, 'expired');
  }
}
