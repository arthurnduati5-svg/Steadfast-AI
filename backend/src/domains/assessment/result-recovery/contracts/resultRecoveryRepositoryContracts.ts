import type { ResultRecoveryPlan, CreateRecoveryPlanInput, ResultRecoveryPlanPreview, UpdateRecoveryPlanStatusInput } from './resultRecoveryPlanContracts';
import type { ResultRecoveryObjective, CreateRecoveryObjectiveInput, ResultRecoveryObjectivePreview, UpdateRecoveryObjectiveStatusInput } from './resultRecoveryObjectiveContracts';
import type { ResultRecoveryStep, CreateRecoveryStepInput, ResultRecoveryStepPreview, UpdateRecoveryStepStatusInput } from './resultRecoveryStepContracts';
import type { ResultRecoveryPracticeDraft, CreatePracticeDraftInput, ResultRecoveryPracticeDraftPreview, UpdateRecoveryPracticeDraftStatusInput } from './resultRecoveryPracticeDraftContracts';
import type { ResultRecoveryResourceRecommendation, CreateResourceRecommendationInput, ResultRecoveryResourceRecommendationPreview, UpdateRecoveryResourceRecommendationStatusInput } from './resultRecoveryResourceRecommendationContracts';
import type { ResultRecoveryTeacherReviewPacket, CreateTeacherReviewPacketInput, ResultRecoveryTeacherReviewPacketPreview, UpdateRecoveryTeacherReviewPacketStatusInput } from './resultRecoveryTeacherReviewPacketContracts';
import type { ResultRecoveryStudentSupportDraft, CreateStudentSupportDraftInput, ResultRecoveryStudentSupportDraftPreview, UpdateRecoveryStudentSupportDraftStatusInput } from './resultRecoveryStudentSupportDraftContracts';
import type { ResultRecoveryParentSupportNoteDraft, CreateParentSupportNoteDraftInput, ResultRecoveryParentSupportNoteDraftPreview, UpdateRecoveryParentSupportNoteDraftStatusInput } from './resultRecoveryParentSupportNoteDraftContracts';
import type { ResultRecoveryCheckpoint, CreateRecoveryCheckpointInput, ResultRecoveryCheckpointPreview, UpdateRecoveryCheckpointStatusInput } from './resultRecoveryCheckpointContracts';
import type { ResultRecoverySummary, CreateRecoverySummaryInput, ResultRecoverySummaryPreview, UpdateRecoverySummaryStatusInput } from './resultRecoverySummaryContracts';
import type {
  ResultRecoveryPlanStatus, ResultRecoveryPlanMode, ResultRecoveryPlanPriority,
  ResultRecoveryObjectiveStatus, ResultRecoveryObjectiveType,
  ResultRecoveryStepStatus, ResultRecoveryStepType,
  ResultRecoveryPracticeDraftStatus, ResultRecoveryResourceRecommendationStatus,
  ResultRecoveryTeacherReviewPacketStatus, ResultRecoveryStudentSupportDraftStatus,
  ResultRecoveryParentSupportNoteDraftStatus, ResultRecoveryCheckpointStatus,
  ResultRecoverySummaryStatus, ResultRecoverySummaryScope,
} from './resultRecoveryContracts';

export interface ResultRecoveryPlanRepository {
  create(input: CreateRecoveryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryPlan>;
  getById(planId: string): Promise<ResultRecoveryPlan | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryPlanPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryPlanPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryPlanStatus | string): Promise<ResultRecoveryPlanPreview[]>;
  listByPriority(schoolId: string, priority: ResultRecoveryPlanPriority | string): Promise<ResultRecoveryPlanPreview[]>;
  listByMode(schoolId: string, mode: ResultRecoveryPlanMode | string): Promise<ResultRecoveryPlanPreview[]>;
  update(planId: string, data: Partial<ResultRecoveryPlan>): Promise<ResultRecoveryPlan>;
  updateStatus(planId: string, input: UpdateRecoveryPlanStatusInput): Promise<ResultRecoveryPlan>;
  markReviewReady(planId: string): Promise<ResultRecoveryPlan>;
  approveForFutureUse(planId: string): Promise<ResultRecoveryPlan>;
  suppress(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan>;
  block(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan>;
  void(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan>;
}

export interface ResultRecoveryObjectiveRepository {
  create(input: CreateRecoveryObjectiveInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryObjective>;
  getById(objectiveId: string): Promise<ResultRecoveryObjective | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryObjectivePreview[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryObjectivePreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryObjectivePreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryObjectiveStatus | string): Promise<ResultRecoveryObjectivePreview[]>;
  listByType(schoolId: string, type: ResultRecoveryObjectiveType | string): Promise<ResultRecoveryObjectivePreview[]>;
  update(objectiveId: string, data: Partial<ResultRecoveryObjective>): Promise<ResultRecoveryObjective>;
  updateStatus(objectiveId: string, input: UpdateRecoveryObjectiveStatusInput): Promise<ResultRecoveryObjective>;
  markReady(objectiveId: string): Promise<ResultRecoveryObjective>;
  completeMock(objectiveId: string): Promise<ResultRecoveryObjective>;
  suppress(objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective>;
  void(objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective>;
}

export interface ResultRecoveryStepRepository {
  create(input: CreateRecoveryStepInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryStep>;
  getById(stepId: string): Promise<ResultRecoveryStep | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryStepPreview[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryStepPreview[]>;
  listByObjectiveId(objectiveId: string): Promise<ResultRecoveryStepPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryStepPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryStepStatus | string): Promise<ResultRecoveryStepPreview[]>;
  listByType(schoolId: string, type: ResultRecoveryStepType | string): Promise<ResultRecoveryStepPreview[]>;
  update(stepId: string, data: Partial<ResultRecoveryStep>): Promise<ResultRecoveryStep>;
  updateStatus(stepId: string, input: UpdateRecoveryStepStatusInput): Promise<ResultRecoveryStep>;
  markReviewReady(stepId: string): Promise<ResultRecoveryStep>;
  approveForFutureUse(stepId: string): Promise<ResultRecoveryStep>;
  completeMock(stepId: string): Promise<ResultRecoveryStep>;
  suppress(stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStep>;
  void(stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStep>;
}

export interface ResultRecoveryPracticeDraftRepository {
  create(input: CreatePracticeDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryPracticeDraft>;
  getById(draftId: string): Promise<ResultRecoveryPracticeDraft | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryPracticeDraftPreview[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryPracticeDraftPreview[]>;
  listByObjectiveId(objectiveId: string): Promise<ResultRecoveryPracticeDraftPreview[]>;
  listByStepId(stepId: string): Promise<ResultRecoveryPracticeDraftPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryPracticeDraftPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryPracticeDraftStatus | string): Promise<ResultRecoveryPracticeDraftPreview[]>;
  listByPracticeType(schoolId: string, practiceType: string): Promise<ResultRecoveryPracticeDraftPreview[]>;
  update(draftId: string, data: Partial<ResultRecoveryPracticeDraft>): Promise<ResultRecoveryPracticeDraft>;
  updateStatus(draftId: string, input: UpdateRecoveryPracticeDraftStatusInput): Promise<ResultRecoveryPracticeDraft>;
  markReviewReady(draftId: string): Promise<ResultRecoveryPracticeDraft>;
  approveForFutureUse(draftId: string): Promise<ResultRecoveryPracticeDraft>;
  suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft>;
  block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft>;
  void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft>;
}

export interface ResultRecoveryResourceRecommendationRepository {
  create(input: CreateResourceRecommendationInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryResourceRecommendation>;
  getById(recommendationId: string): Promise<ResultRecoveryResourceRecommendation | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryResourceRecommendationPreview[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryResourceRecommendationPreview[]>;
  listByObjectiveId(objectiveId: string): Promise<ResultRecoveryResourceRecommendationPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryResourceRecommendationPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryResourceRecommendationStatus | string): Promise<ResultRecoveryResourceRecommendationPreview[]>;
  listByResourceType(schoolId: string, resourceType: string): Promise<ResultRecoveryResourceRecommendationPreview[]>;
  update(recommendationId: string, data: Partial<ResultRecoveryResourceRecommendation>): Promise<ResultRecoveryResourceRecommendation>;
  updateStatus(recommendationId: string, input: UpdateRecoveryResourceRecommendationStatusInput): Promise<ResultRecoveryResourceRecommendation>;
  markReviewReady(recommendationId: string): Promise<ResultRecoveryResourceRecommendation>;
  approveForFutureUse(recommendationId: string): Promise<ResultRecoveryResourceRecommendation>;
  suppress(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation>;
  block(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation>;
  void(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation>;
}

export interface ResultRecoveryTeacherReviewPacketRepository {
  create(input: CreateTeacherReviewPacketInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryTeacherReviewPacket>;
  getById(packetId: string): Promise<ResultRecoveryTeacherReviewPacket | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryTeacherReviewPacketStatus | string): Promise<ResultRecoveryTeacherReviewPacketPreview[]>;
  update(packetId: string, data: Partial<ResultRecoveryTeacherReviewPacket>): Promise<ResultRecoveryTeacherReviewPacket>;
  updateStatus(packetId: string, input: UpdateRecoveryTeacherReviewPacketStatusInput): Promise<ResultRecoveryTeacherReviewPacket>;
  markReady(packetId: string): Promise<ResultRecoveryTeacherReviewPacket>;
  acknowledgeMock(packetId: string): Promise<ResultRecoveryTeacherReviewPacket>;
  approveForFutureUse(packetId: string): Promise<ResultRecoveryTeacherReviewPacket>;
  suppress(packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryTeacherReviewPacket>;
  void(packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryTeacherReviewPacket>;
}

export interface ResultRecoveryStudentSupportDraftRepository {
  create(input: CreateStudentSupportDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryStudentSupportDraft>;
  getById(draftId: string): Promise<ResultRecoveryStudentSupportDraft | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryStudentSupportDraftPreview[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryStudentSupportDraftPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryStudentSupportDraftPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryStudentSupportDraftStatus | string): Promise<ResultRecoveryStudentSupportDraftPreview[]>;
  update(draftId: string, data: Partial<ResultRecoveryStudentSupportDraft>): Promise<ResultRecoveryStudentSupportDraft>;
  updateStatus(draftId: string, input: UpdateRecoveryStudentSupportDraftStatusInput): Promise<ResultRecoveryStudentSupportDraft>;
  markReviewReady(draftId: string): Promise<ResultRecoveryStudentSupportDraft>;
  approveForFutureUse(draftId: string): Promise<ResultRecoveryStudentSupportDraft>;
  suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft>;
  block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft>;
  void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft>;
}

export interface ResultRecoveryParentSupportNoteDraftRepository {
  create(input: CreateParentSupportNoteDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryParentSupportNoteDraft>;
  getById(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryParentSupportNoteDraftStatus | string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]>;
  listByAudienceType(schoolId: string, audienceType: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]>;
  update(draftId: string, data: Partial<ResultRecoveryParentSupportNoteDraft>): Promise<ResultRecoveryParentSupportNoteDraft>;
  updateStatus(draftId: string, input: UpdateRecoveryParentSupportNoteDraftStatusInput): Promise<ResultRecoveryParentSupportNoteDraft>;
  markReviewReady(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft>;
  approveForFutureUse(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft>;
  suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft>;
  block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft>;
  void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft>;
}

export interface ResultRecoveryCheckpointRepository {
  create(input: CreateRecoveryCheckpointInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryCheckpoint>;
  getById(checkpointId: string): Promise<ResultRecoveryCheckpoint | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryCheckpointPreview[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryCheckpointPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryCheckpointPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoveryCheckpointStatus | string): Promise<ResultRecoveryCheckpointPreview[]>;
  listByType(schoolId: string, type: string): Promise<ResultRecoveryCheckpointPreview[]>;
  update(checkpointId: string, data: Partial<ResultRecoveryCheckpoint>): Promise<ResultRecoveryCheckpoint>;
  updateStatus(checkpointId: string, input: UpdateRecoveryCheckpointStatusInput): Promise<ResultRecoveryCheckpoint>;
  scheduleMock(checkpointId: string): Promise<ResultRecoveryCheckpoint>;
  completeMock(checkpointId: string): Promise<ResultRecoveryCheckpoint>;
  cancel(checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryCheckpoint>;
  void(checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryCheckpoint>;
}

export interface ResultRecoverySummaryRepository {
  create(input: CreateRecoverySummaryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoverySummary>;
  getById(summaryId: string): Promise<ResultRecoverySummary | null>;
  listBySchool(schoolId: string): Promise<ResultRecoverySummaryPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoverySummaryPreview[]>;
  listByScope(schoolId: string, scope: ResultRecoverySummaryScope | string): Promise<ResultRecoverySummaryPreview[]>;
  listByStatus(schoolId: string, status: ResultRecoverySummaryStatus | string): Promise<ResultRecoverySummaryPreview[]>;
  update(summaryId: string, data: Partial<ResultRecoverySummary>): Promise<ResultRecoverySummary>;
  updateStatus(summaryId: string, input: UpdateRecoverySummaryStatusInput): Promise<ResultRecoverySummary>;
  refresh(summaryId: string): Promise<ResultRecoverySummary>;
  markStale(summaryId: string): Promise<ResultRecoverySummary>;
  block(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySummary>;
  void(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySummary>;
}

export interface ResultRecoveryAuditEvent {
  resultRecoveryAuditId: string;
  schoolId: string;
  resultRecoveryPlanId: string | null;
  resultRecoveryObjectiveId: string | null;
  resultRecoveryStepId: string | null;
  resultRecoveryPracticeDraftId: string | null;
  resultRecoveryResourceRecommendationId: string | null;
  resultRecoveryTeacherReviewPacketId: string | null;
  resultRecoveryStudentSupportDraftId: string | null;
  resultRecoveryParentSupportNoteDraftId: string | null;
  resultRecoveryCheckpointId: string | null;
  resultRecoverySummaryId: string | null;
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

export interface ResultRecoveryAuditRepository {
  create(event: ResultRecoveryAuditEvent): Promise<ResultRecoveryAuditEvent>;
  getById(auditId: string): Promise<ResultRecoveryAuditEvent | null>;
  listBySchool(schoolId: string): Promise<ResultRecoveryAuditEvent[]>;
  listByPlanId(planId: string): Promise<ResultRecoveryAuditEvent[]>;
  listByObjectiveId(objectiveId: string): Promise<ResultRecoveryAuditEvent[]>;
  listByStepId(stepId: string): Promise<ResultRecoveryAuditEvent[]>;
  listByEventType(schoolId: string, eventType: string): Promise<ResultRecoveryAuditEvent[]>;
}

export interface ResultRecoveryIdempotencyEntry {
  resultRecoveryIdempotencyId: string;
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

export interface ResultRecoveryIdempotencyRepository {
  create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultRecoveryIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultRecoveryIdempotencyEntry | null>;
  updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultRecoveryIdempotencyEntry>;
  expire(idempotencyId: string): Promise<ResultRecoveryIdempotencyEntry>;
}
