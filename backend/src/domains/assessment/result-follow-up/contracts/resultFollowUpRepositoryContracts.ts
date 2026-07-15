import type { ResultFollowUpCase, CreateFollowUpCaseInput, ResultFollowUpCasePreview, UpdateFollowUpCaseStatusInput } from './resultFollowUpCaseContracts';
import type { ResultFollowUpSignal, CreateFollowUpSignalInput, ResultFollowUpSignalPreview, UpdateFollowUpSignalStatusInput } from './resultFollowUpSignalContracts';
import type { ResultFollowUpActionPlan, CreateActionPlanInput, ResultFollowUpActionPlanPreview, UpdateActionPlanStatusInput } from './resultFollowUpActionPlanContracts';
import type { TeacherFollowUpQueueItem, CreateTeacherQueueItemInput, TeacherFollowUpQueueItemPreview, UpdateTeacherQueueStatusInput } from './teacherFollowUpQueueContracts';
import type { ParentGuidanceDraft, CreateParentGuidanceDraftInput, ParentGuidanceDraftPreview, UpdateParentGuidanceDraftStatusInput } from './parentGuidanceDraftContracts';
import type { StudentReflectionTaskDraft, CreateStudentReflectionTaskDraftInput, StudentReflectionTaskDraftPreview, UpdateStudentReflectionDraftStatusInput } from './studentReflectionTaskDraftContracts';
import type { FollowUpReviewWindow, CreateReviewWindowInput, FollowUpReviewWindowPreview, UpdateReviewWindowStatusInput } from './followUpReviewWindowContracts';
import type { FollowUpEscalationPlan, CreateEscalationPlanInput, FollowUpEscalationPlanPreview, UpdateEscalationPlanStatusInput } from './followUpEscalationPlanContracts';
import type { FollowUpSummary, CreateFollowUpSummaryInput, FollowUpSummaryPreview, UpdateFollowUpSummaryStatusInput } from './followUpSummaryContracts';
import type { ResultFollowUpCaseStatus, ResultFollowUpCaseType, ResultFollowUpCasePriority, ResultFollowUpSignalStatus, ResultFollowUpSignalType, ResultFollowUpSignalSeverity, ResultFollowUpActionPlanStatus, TeacherFollowUpQueueStatus, ParentGuidanceDraftStatus, StudentReflectionTaskDraftStatus, FollowUpReviewWindowStatus, FollowUpEscalationPlanStatus, FollowUpSummaryStatus } from './resultFollowUpContracts';

export interface ResultFollowUpCaseRepository {
  create(input: CreateFollowUpCaseInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpCase>;
  getById(caseId: string): Promise<ResultFollowUpCase | null>;
  listBySchool(schoolId: string): Promise<ResultFollowUpCasePreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpCasePreview[]>;
  listByStatus(schoolId: string, status: ResultFollowUpCaseStatus | string): Promise<ResultFollowUpCasePreview[]>;
  listByPriority(schoolId: string, priority: ResultFollowUpCasePriority | string): Promise<ResultFollowUpCasePreview[]>;
  listByType(schoolId: string, type: ResultFollowUpCaseType | string): Promise<ResultFollowUpCasePreview[]>;
  update(caseId: string, data: Partial<ResultFollowUpCase>): Promise<ResultFollowUpCase>;
  updateStatus(caseId: string, input: UpdateFollowUpCaseStatusInput): Promise<ResultFollowUpCase>;
  open(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase>;
  triage(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase>;
  markPlanned(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase>;
  markUnderReview(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase>;
  close(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase>;
  block(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase>;
  void(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase>;
}

export interface ResultFollowUpSignalRepository {
  create(input: CreateFollowUpSignalInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpSignal>;
  getById(signalId: string): Promise<ResultFollowUpSignal | null>;
  listBySchool(schoolId: string): Promise<ResultFollowUpSignalPreview[]>;
  listByCaseId(caseId: string): Promise<ResultFollowUpSignalPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpSignalPreview[]>;
  listBySeverity(schoolId: string, severity: ResultFollowUpSignalSeverity | string): Promise<ResultFollowUpSignalPreview[]>;
  listByType(schoolId: string, type: ResultFollowUpSignalType | string): Promise<ResultFollowUpSignalPreview[]>;
  listByStatus(schoolId: string, status: ResultFollowUpSignalStatus | string): Promise<ResultFollowUpSignalPreview[]>;
  update(signalId: string, data: Partial<ResultFollowUpSignal>): Promise<ResultFollowUpSignal>;
  updateStatus(signalId: string, input: UpdateFollowUpSignalStatusInput): Promise<ResultFollowUpSignal>;
  suppress(signalId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpSignal>;
  void(signalId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpSignal>;
}

export interface ResultFollowUpActionPlanRepository {
  create(input: CreateActionPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpActionPlan>;
  getById(planId: string): Promise<ResultFollowUpActionPlan | null>;
  listBySchool(schoolId: string): Promise<ResultFollowUpActionPlanPreview[]>;
  listByCaseId(caseId: string): Promise<ResultFollowUpActionPlanPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpActionPlanPreview[]>;
  listByStatus(schoolId: string, status: ResultFollowUpActionPlanStatus | string): Promise<ResultFollowUpActionPlanPreview[]>;
  update(planId: string, data: Partial<ResultFollowUpActionPlan>): Promise<ResultFollowUpActionPlan>;
  updateStatus(planId: string, input: UpdateActionPlanStatusInput): Promise<ResultFollowUpActionPlan>;
  markReviewReady(planId: string): Promise<ResultFollowUpActionPlan>;
  approveForFutureUse(planId: string): Promise<ResultFollowUpActionPlan>;
  suppress(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan>;
  block(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan>;
  void(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan>;
}

export interface TeacherFollowUpQueueRepository {
  create(input: CreateTeacherQueueItemInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<TeacherFollowUpQueueItem>;
  getById(queueItemId: string): Promise<TeacherFollowUpQueueItem | null>;
  listBySchool(schoolId: string): Promise<TeacherFollowUpQueueItemPreview[]>;
  listByCaseId(caseId: string): Promise<TeacherFollowUpQueueItemPreview[]>;
  listByActionPlanId(planId: string): Promise<TeacherFollowUpQueueItemPreview[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<TeacherFollowUpQueueItemPreview[]>;
  listByPriority(schoolId: string, priority: string): Promise<TeacherFollowUpQueueItemPreview[]>;
  listByStatus(schoolId: string, status: TeacherFollowUpQueueStatus | string): Promise<TeacherFollowUpQueueItemPreview[]>;
  update(queueItemId: string, data: Partial<TeacherFollowUpQueueItem>): Promise<TeacherFollowUpQueueItem>;
  updateStatus(queueItemId: string, input: UpdateTeacherQueueStatusInput): Promise<TeacherFollowUpQueueItem>;
  markQueued(queueItemId: string): Promise<TeacherFollowUpQueueItem>;
  acknowledge(queueItemId: string): Promise<TeacherFollowUpQueueItem>;
  complete(queueItemId: string): Promise<TeacherFollowUpQueueItem>;
  suppress(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem>;
  block(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem>;
  void(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem>;
}

export interface ParentGuidanceDraftRepository {
  create(input: CreateParentGuidanceDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ParentGuidanceDraft>;
  getById(draftId: string): Promise<ParentGuidanceDraft | null>;
  listBySchool(schoolId: string): Promise<ParentGuidanceDraftPreview[]>;
  listByCaseId(caseId: string): Promise<ParentGuidanceDraftPreview[]>;
  listByActionPlanId(planId: string): Promise<ParentGuidanceDraftPreview[]>;
  listByStatus(schoolId: string, status: ParentGuidanceDraftStatus | string): Promise<ParentGuidanceDraftPreview[]>;
  update(draftId: string, data: Partial<ParentGuidanceDraft>): Promise<ParentGuidanceDraft>;
  updateStatus(draftId: string, input: UpdateParentGuidanceDraftStatusInput): Promise<ParentGuidanceDraft>;
  markReviewReady(draftId: string): Promise<ParentGuidanceDraft>;
  approveForFutureUse(draftId: string): Promise<ParentGuidanceDraft>;
  suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft>;
  block(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft>;
  void(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft>;
}

export interface StudentReflectionTaskDraftRepository {
  create(input: CreateStudentReflectionTaskDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<StudentReflectionTaskDraft>;
  getById(draftId: string): Promise<StudentReflectionTaskDraft | null>;
  listBySchool(schoolId: string): Promise<StudentReflectionTaskDraftPreview[]>;
  listByCaseId(caseId: string): Promise<StudentReflectionTaskDraftPreview[]>;
  listByActionPlanId(planId: string): Promise<StudentReflectionTaskDraftPreview[]>;
  listByStatus(schoolId: string, status: StudentReflectionTaskDraftStatus | string): Promise<StudentReflectionTaskDraftPreview[]>;
  update(draftId: string, data: Partial<StudentReflectionTaskDraft>): Promise<StudentReflectionTaskDraft>;
  updateStatus(draftId: string, input: UpdateStudentReflectionDraftStatusInput): Promise<StudentReflectionTaskDraft>;
  markReviewReady(draftId: string): Promise<StudentReflectionTaskDraft>;
  approveForFutureUse(draftId: string): Promise<StudentReflectionTaskDraft>;
  suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft>;
  block(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft>;
  void(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft>;
}

export interface FollowUpReviewWindowRepository {
  create(input: CreateReviewWindowInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<FollowUpReviewWindow>;
  getById(windowId: string): Promise<FollowUpReviewWindow | null>;
  listBySchool(schoolId: string): Promise<FollowUpReviewWindowPreview[]>;
  listByCaseId(caseId: string): Promise<FollowUpReviewWindowPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpReviewWindowPreview[]>;
  listByStatus(schoolId: string, status: FollowUpReviewWindowStatus | string): Promise<FollowUpReviewWindowPreview[]>;
  update(windowId: string, data: Partial<FollowUpReviewWindow>): Promise<FollowUpReviewWindow>;
  updateStatus(windowId: string, input: UpdateReviewWindowStatusInput): Promise<FollowUpReviewWindow>;
  scheduleMock(windowId: string): Promise<FollowUpReviewWindow>;
  completeMock(windowId: string): Promise<FollowUpReviewWindow>;
  cancel(windowId: string, reasonCode: string, safeMessage: string): Promise<FollowUpReviewWindow>;
  void(windowId: string, reasonCode: string, safeMessage: string): Promise<FollowUpReviewWindow>;
}

export interface FollowUpEscalationPlanRepository {
  create(input: CreateEscalationPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<FollowUpEscalationPlan>;
  getById(planId: string): Promise<FollowUpEscalationPlan | null>;
  listBySchool(schoolId: string): Promise<FollowUpEscalationPlanPreview[]>;
  listByCaseId(caseId: string): Promise<FollowUpEscalationPlanPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpEscalationPlanPreview[]>;
  listByStatus(schoolId: string, status: FollowUpEscalationPlanStatus | string): Promise<FollowUpEscalationPlanPreview[]>;
  listByLevel(schoolId: string, level: string): Promise<FollowUpEscalationPlanPreview[]>;
  update(planId: string, data: Partial<FollowUpEscalationPlan>): Promise<FollowUpEscalationPlan>;
  updateStatus(planId: string, input: UpdateEscalationPlanStatusInput): Promise<FollowUpEscalationPlan>;
  markReviewReady(planId: string): Promise<FollowUpEscalationPlan>;
  approveForFutureUse(planId: string): Promise<FollowUpEscalationPlan>;
  suppress(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan>;
  block(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan>;
  void(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan>;
}

export interface FollowUpSummaryRepository {
  create(input: CreateFollowUpSummaryInput & { createdByActorId: string; createdByRole: string }): Promise<FollowUpSummary>;
  getById(summaryId: string): Promise<FollowUpSummary | null>;
  listBySchool(schoolId: string): Promise<FollowUpSummaryPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpSummaryPreview[]>;
  listByScope(schoolId: string, scope: string): Promise<FollowUpSummaryPreview[]>;
  listByStatus(schoolId: string, status: FollowUpSummaryStatus | string): Promise<FollowUpSummaryPreview[]>;
  update(summaryId: string, data: Partial<FollowUpSummary>): Promise<FollowUpSummary>;
  updateStatus(summaryId: string, input: UpdateFollowUpSummaryStatusInput): Promise<FollowUpSummary>;
  refresh(summaryId: string): Promise<FollowUpSummary>;
  markStale(summaryId: string): Promise<FollowUpSummary>;
  block(summaryId: string, reasonCode: string, safeMessage: string): Promise<FollowUpSummary>;
  void(summaryId: string, reasonCode: string, safeMessage: string): Promise<FollowUpSummary>;
}

export interface FollowUpAuditEvent {
  followUpAuditId: string;
  schoolId: string;
  resultFollowUpCaseId: string | null;
  resultFollowUpSignalId: string | null;
  resultFollowUpActionPlanId: string | null;
  teacherFollowUpQueueItemId: string | null;
  parentGuidanceDraftId: string | null;
  studentReflectionTaskDraftId: string | null;
  followUpReviewWindowId: string | null;
  followUpEscalationPlanId: string | null;
  followUpSummaryId: string | null;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  requestId: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface FollowUpAuditRepository {
  create(event: FollowUpAuditEvent): Promise<FollowUpAuditEvent>;
  getById(auditId: string): Promise<FollowUpAuditEvent | null>;
  listBySchool(schoolId: string): Promise<FollowUpAuditEvent[]>;
  listByCaseId(caseId: string): Promise<FollowUpAuditEvent[]>;
  listByEventType(schoolId: string, eventType: string): Promise<FollowUpAuditEvent[]>;
}

export interface FollowUpIdempotencyEntry {
  followUpIdempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType: string | null;
  resourceId: string | null;
  safeResultSummary: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface FollowUpIdempotencyRepository {
  create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<FollowUpIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<FollowUpIdempotencyEntry | null>;
  updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<FollowUpIdempotencyEntry>;
  expire(idempotencyId: string): Promise<FollowUpIdempotencyEntry>;
}
