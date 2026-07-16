import type { RecoveryCaseTriageReadiness } from './recoveryCaseTriageReadinessContracts';
import type { RecoveryCasePriorityAssessment, RecoveryCasePriorityFactor } from './recoveryCasePriorityContracts';
import type { RecoveryCaseFairnessCheck } from './recoveryCaseFairnessContracts';
import type { RecoveryCaseCapacitySnapshot } from './recoveryCaseCapacityContracts';
import type { RecoveryCaseTriageQueueSnapshot, RecoveryCaseTriageQueueItem } from './recoveryCaseQueueContracts';
import type { RecoveryCaseWorkloadAllocationDraft } from './recoveryCaseAllocationDraftContracts';
import type { RecoveryCaseEscalationDraft } from './recoveryCaseEscalationDraftContracts';
import type { RecoveryCaseReviewWindowDraft } from './recoveryCaseReviewWindowDraftContracts';
import type { RecoveryCaseQueueExplanation } from './recoveryCaseQueueExplanationContracts';
import type { RecoveryCaseDuplicateSuppression } from './recoveryCaseDuplicateSuppressionContracts';
import type { RecoveryCaseTriageSummary } from './recoveryCaseTriageSummaryContracts';
import type { RecoveryCaseTriageReadinessStatus, RecoveryCasePriorityAssessmentStatus, RecoveryCaseTriageQueueSnapshotStatus, RecoveryCaseQueueItemStatus, RecoveryCaseDraftStatus, RecoveryCaseCapacityStatus, RecoveryCaseFairnessStatus, RecoveryCasePriorityBand } from './recoveryCaseTriageContracts';

export interface RecoveryCaseTriageReadinessRepository {
  create(data: Partial<RecoveryCaseTriageReadiness> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageReadiness>;
  getById(triageReadinessId: string): Promise<RecoveryCaseTriageReadiness | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseTriageReadiness[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageReadiness[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageReadiness[]>;
  listByBoardSnapshotId(schoolId: string, boardSnapshotId: string): Promise<RecoveryCaseTriageReadiness[]>;
  listByBoardCardId(schoolId: string, boardCardId: string): Promise<RecoveryCaseTriageReadiness[]>;
  listByStatus(schoolId: string, status: RecoveryCaseTriageReadinessStatus | string): Promise<RecoveryCaseTriageReadiness[]>;
  update(triageReadinessId: string, data: Partial<RecoveryCaseTriageReadiness>): Promise<RecoveryCaseTriageReadiness>;
  updateStatus(triageReadinessId: string, status: RecoveryCaseTriageReadinessStatus | string): Promise<RecoveryCaseTriageReadiness>;
  markReady(triageReadinessId: string): Promise<RecoveryCaseTriageReadiness>;
  markReviewReady(triageReadinessId: string): Promise<RecoveryCaseTriageReadiness>;
  markStale(triageReadinessId: string): Promise<RecoveryCaseTriageReadiness>;
  block(triageReadinessId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageReadiness>;
  suppress(triageReadinessId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageReadiness>;
  void(triageReadinessId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageReadiness>;
}

export interface RecoveryCasePriorityAssessmentRepository {
  create(data: Partial<RecoveryCasePriorityAssessment> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCasePriorityAssessment>;
  getById(priorityAssessmentId: string): Promise<RecoveryCasePriorityAssessment | null>;
  listBySchool(schoolId: string): Promise<RecoveryCasePriorityAssessment[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCasePriorityAssessment[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryCasePriorityAssessment[]>;
  listByBoardSnapshotId(schoolId: string, boardSnapshotId: string): Promise<RecoveryCasePriorityAssessment[]>;
  listByBoardCardId(schoolId: string, boardCardId: string): Promise<RecoveryCasePriorityAssessment[]>;
  listByBand(schoolId: string, band: RecoveryCasePriorityBand | string): Promise<RecoveryCasePriorityAssessment[]>;
  listByStatus(schoolId: string, status: RecoveryCasePriorityAssessmentStatus | string): Promise<RecoveryCasePriorityAssessment[]>;
  update(priorityAssessmentId: string, data: Partial<RecoveryCasePriorityAssessment>): Promise<RecoveryCasePriorityAssessment>;
  updateStatus(priorityAssessmentId: string, status: RecoveryCasePriorityAssessmentStatus | string): Promise<RecoveryCasePriorityAssessment>;
  markScored(priorityAssessmentId: string): Promise<RecoveryCasePriorityAssessment>;
  markReviewReady(priorityAssessmentId: string): Promise<RecoveryCasePriorityAssessment>;
  markStale(priorityAssessmentId: string): Promise<RecoveryCasePriorityAssessment>;
  block(priorityAssessmentId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCasePriorityAssessment>;
  void(priorityAssessmentId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCasePriorityAssessment>;
}

export interface RecoveryCasePriorityFactorRepository {
  create(data: Partial<RecoveryCasePriorityFactor> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCasePriorityFactor>;
  getById(priorityFactorId: string): Promise<RecoveryCasePriorityFactor | null>;
  listByAssessment(priorityAssessmentId: string): Promise<RecoveryCasePriorityFactor[]>;
  listBySchool(schoolId: string): Promise<RecoveryCasePriorityFactor[]>;
  listByFactorCode(schoolId: string, factorCode: string): Promise<RecoveryCasePriorityFactor[]>;
  update(priorityFactorId: string, data: Partial<RecoveryCasePriorityFactor>): Promise<RecoveryCasePriorityFactor>;
}

export interface RecoveryCaseFairnessCheckRepository {
  create(data: Partial<RecoveryCaseFairnessCheck> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseFairnessCheck>;
  getById(fairnessCheckId: string): Promise<RecoveryCaseFairnessCheck | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseFairnessCheck[]>;
  listByAssessment(priorityAssessmentId: string): Promise<RecoveryCaseFairnessCheck[]>;
  listByQueue(queueSnapshotId: string): Promise<RecoveryCaseFairnessCheck[]>;
  listByStatus(schoolId: string, status: RecoveryCaseFairnessStatus | string): Promise<RecoveryCaseFairnessCheck[]>;
  update(fairnessCheckId: string, data: Partial<RecoveryCaseFairnessCheck>): Promise<RecoveryCaseFairnessCheck>;
  updateStatus(fairnessCheckId: string, status: RecoveryCaseFairnessStatus | string): Promise<RecoveryCaseFairnessCheck>;
  block(fairnessCheckId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseFairnessCheck>;
  void(fairnessCheckId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseFairnessCheck>;
}

export interface RecoveryCaseCapacitySnapshotRepository {
  create(data: Partial<RecoveryCaseCapacitySnapshot> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseCapacitySnapshot>;
  getById(capacitySnapshotId: string): Promise<RecoveryCaseCapacitySnapshot | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseCapacitySnapshot[]>;
  listByRole(schoolId: string, audienceRole: string): Promise<RecoveryCaseCapacitySnapshot[]>;
  listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseCapacitySnapshot[]>;
  listByWindow(schoolId: string, reviewWindowId: string): Promise<RecoveryCaseCapacitySnapshot[]>;
  update(capacitySnapshotId: string, data: Partial<RecoveryCaseCapacitySnapshot>): Promise<RecoveryCaseCapacitySnapshot>;
  updateStatus(capacitySnapshotId: string, status: RecoveryCaseCapacityStatus | string): Promise<RecoveryCaseCapacitySnapshot>;
  markReviewReady(capacitySnapshotId: string): Promise<RecoveryCaseCapacitySnapshot>;
  markCapacityExceeded(capacitySnapshotId: string): Promise<RecoveryCaseCapacitySnapshot>;
  void(capacitySnapshotId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseCapacitySnapshot>;
}

export interface RecoveryCaseTriageQueueSnapshotRepository {
  create(data: Partial<RecoveryCaseTriageQueueSnapshot> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageQueueSnapshot>;
  getById(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueSnapshot | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseTriageQueueSnapshot[]>;
  listByAudienceRole(schoolId: string, audienceRole: string): Promise<RecoveryCaseTriageQueueSnapshot[]>;
  listByStatus(schoolId: string, status: RecoveryCaseTriageQueueSnapshotStatus | string): Promise<RecoveryCaseTriageQueueSnapshot[]>;
  update(queueSnapshotId: string, data: Partial<RecoveryCaseTriageQueueSnapshot>): Promise<RecoveryCaseTriageQueueSnapshot>;
  updateStatus(queueSnapshotId: string, status: RecoveryCaseTriageQueueSnapshotStatus | string): Promise<RecoveryCaseTriageQueueSnapshot>;
  markGenerated(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueSnapshot>;
  markReviewReady(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueSnapshot>;
  markStale(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueSnapshot>;
  block(queueSnapshotId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueSnapshot>;
  void(queueSnapshotId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueSnapshot>;
}

export interface RecoveryCaseTriageQueueItemRepository {
  create(data: Partial<RecoveryCaseTriageQueueItem> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageQueueItem>;
  getById(queueItemId: string): Promise<RecoveryCaseTriageQueueItem | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseTriageQueueItem[]>;
  listByQueueSnapshot(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueItem[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageQueueItem[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageQueueItem[]>;
  listByBand(schoolId: string, band: RecoveryCasePriorityBand | string): Promise<RecoveryCaseTriageQueueItem[]>;
  listByStatus(schoolId: string, status: RecoveryCaseQueueItemStatus | string): Promise<RecoveryCaseTriageQueueItem[]>;
  listByTriageDecision(schoolId: string, triageDecision: string): Promise<RecoveryCaseTriageQueueItem[]>;
  listByRank(queueSnapshotId: string): Promise<RecoveryCaseTriageQueueItem[]>;
  update(queueItemId: string, data: Partial<RecoveryCaseTriageQueueItem>): Promise<RecoveryCaseTriageQueueItem>;
  updateStatus(queueItemId: string, status: RecoveryCaseQueueItemStatus | string): Promise<RecoveryCaseTriageQueueItem>;
  markReviewReady(queueItemId: string): Promise<RecoveryCaseTriageQueueItem>;
  defer(queueItemId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueItem>;
  block(queueItemId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueItem>;
  void(queueItemId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageQueueItem>;
}

export interface RecoveryCaseWorkloadAllocationDraftRepository {
  create(data: Partial<RecoveryCaseWorkloadAllocationDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseWorkloadAllocationDraft>;
  getById(allocationDraftId: string): Promise<RecoveryCaseWorkloadAllocationDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseWorkloadAllocationDraft[]>;
  listByQueue(queueSnapshotId: string): Promise<RecoveryCaseWorkloadAllocationDraft[]>;
  listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseWorkloadAllocationDraft[]>;
  listByStatus(schoolId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseWorkloadAllocationDraft[]>;
  update(allocationDraftId: string, data: Partial<RecoveryCaseWorkloadAllocationDraft>): Promise<RecoveryCaseWorkloadAllocationDraft>;
  updateStatus(allocationDraftId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseWorkloadAllocationDraft>;
  markReviewReady(allocationDraftId: string): Promise<RecoveryCaseWorkloadAllocationDraft>;
  approveFutureUse(allocationDraftId: string): Promise<RecoveryCaseWorkloadAllocationDraft>;
  block(allocationDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseWorkloadAllocationDraft>;
  suppress(allocationDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseWorkloadAllocationDraft>;
  void(allocationDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseWorkloadAllocationDraft>;
}

export interface RecoveryCaseEscalationDraftRepository {
  create(data: Partial<RecoveryCaseEscalationDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseEscalationDraft>;
  getById(escalationDraftId: string): Promise<RecoveryCaseEscalationDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseEscalationDraft[]>;
  listByQueue(queueSnapshotId: string): Promise<RecoveryCaseEscalationDraft[]>;
  listByLevel(schoolId: string, escalationLevel: string): Promise<RecoveryCaseEscalationDraft[]>;
  listByStatus(schoolId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseEscalationDraft[]>;
  update(escalationDraftId: string, data: Partial<RecoveryCaseEscalationDraft>): Promise<RecoveryCaseEscalationDraft>;
  updateStatus(escalationDraftId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseEscalationDraft>;
  markReviewReady(escalationDraftId: string): Promise<RecoveryCaseEscalationDraft>;
  approveFutureUse(escalationDraftId: string): Promise<RecoveryCaseEscalationDraft>;
  block(escalationDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft>;
  suppress(escalationDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft>;
  void(escalationDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseEscalationDraft>;
}

export interface RecoveryCaseReviewWindowDraftRepository {
  create(data: Partial<RecoveryCaseReviewWindowDraft> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseReviewWindowDraft>;
  getById(reviewWindowDraftId: string): Promise<RecoveryCaseReviewWindowDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseReviewWindowDraft[]>;
  listByQueue(queueSnapshotId: string): Promise<RecoveryCaseReviewWindowDraft[]>;
  listByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseReviewWindowDraft[]>;
  listByStatus(schoolId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseReviewWindowDraft[]>;
  update(reviewWindowDraftId: string, data: Partial<RecoveryCaseReviewWindowDraft>): Promise<RecoveryCaseReviewWindowDraft>;
  updateStatus(reviewWindowDraftId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseReviewWindowDraft>;
  markReviewReady(reviewWindowDraftId: string): Promise<RecoveryCaseReviewWindowDraft>;
  approveFutureUse(reviewWindowDraftId: string): Promise<RecoveryCaseReviewWindowDraft>;
  block(reviewWindowDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft>;
  suppress(reviewWindowDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft>;
  void(reviewWindowDraftId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseReviewWindowDraft>;
}

export interface RecoveryCaseQueueExplanationRepository {
  create(data: Partial<RecoveryCaseQueueExplanation> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseQueueExplanation>;
  getById(queueExplanationId: string): Promise<RecoveryCaseQueueExplanation | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseQueueExplanation[]>;
  listByQueueItem(queueItemId: string): Promise<RecoveryCaseQueueExplanation[]>;
  listByAssessment(priorityAssessmentId: string): Promise<RecoveryCaseQueueExplanation[]>;
  listBySnapshot(queueSnapshotId: string): Promise<RecoveryCaseQueueExplanation[]>;
}

export interface RecoveryCaseDuplicateSuppressionRepository {
  create(data: Partial<RecoveryCaseDuplicateSuppression> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseDuplicateSuppression>;
  getById(duplicateSuppressionId: string): Promise<RecoveryCaseDuplicateSuppression | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseDuplicateSuppression[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseDuplicateSuppression[]>;
  listByCanonicalCard(schoolId: string, canonicalBoardCardId: string): Promise<RecoveryCaseDuplicateSuppression[]>;
  listByDuplicateCard(schoolId: string, duplicateBoardCardId: string): Promise<RecoveryCaseDuplicateSuppression[]>;
  listByStatus(schoolId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseDuplicateSuppression[]>;
  update(duplicateSuppressionId: string, data: Partial<RecoveryCaseDuplicateSuppression>): Promise<RecoveryCaseDuplicateSuppression>;
  updateStatus(duplicateSuppressionId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseDuplicateSuppression>;
  void(duplicateSuppressionId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseDuplicateSuppression>;
}

export interface RecoveryCaseTriageSummaryRepository {
  create(data: Partial<RecoveryCaseTriageSummary> & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<RecoveryCaseTriageSummary>;
  getById(triageSummaryId: string): Promise<RecoveryCaseTriageSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryCaseTriageSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageSummary[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryCaseTriageSummary[]>;
  listByQueueSnapshot(queueSnapshotId: string): Promise<RecoveryCaseTriageSummary[]>;
  listByStatus(schoolId: string, status: RecoveryCaseTriageReadinessStatus | string): Promise<RecoveryCaseTriageSummary[]>;
  update(triageSummaryId: string, data: Partial<RecoveryCaseTriageSummary>): Promise<RecoveryCaseTriageSummary>;
  updateStatus(triageSummaryId: string, status: RecoveryCaseTriageReadinessStatus | string): Promise<RecoveryCaseTriageSummary>;
  refresh(triageSummaryId: string): Promise<RecoveryCaseTriageSummary>;
  markReviewReady(triageSummaryId: string): Promise<RecoveryCaseTriageSummary>;
  markStale(triageSummaryId: string): Promise<RecoveryCaseTriageSummary>;
  block(triageSummaryId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSummary>;
  void(triageSummaryId: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSummary>;
}

export interface RecoveryCaseTriageAuditEvent {
  triageAuditId: string;
  schoolId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorRole: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  correlationId: string | null;
  createdAt: string;
}

export interface RecoveryCaseTriageAuditRepository {
  create(event: Partial<RecoveryCaseTriageAuditEvent> & { schoolId: string; actorId: string; actorRole: string }): Promise<RecoveryCaseTriageAuditEvent>;
  listBySchool(schoolId: string): Promise<RecoveryCaseTriageAuditEvent[]>;
  listByEntity(schoolId: string, entityType: string, entityId: string): Promise<RecoveryCaseTriageAuditEvent[]>;
  listByAction(schoolId: string, action: string): Promise<RecoveryCaseTriageAuditEvent[]>;
  listByActor(schoolId: string, actorId: string): Promise<RecoveryCaseTriageAuditEvent[]>;
}

export interface RecoveryCaseTriageIdempotencyEntry {
  triageIdempotencyId: string;
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

export interface RecoveryCaseTriageIdempotencyRepository {
  create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<RecoveryCaseTriageIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryCaseTriageIdempotencyEntry | null>;
  update(idempotencyId: string, data: Partial<RecoveryCaseTriageIdempotencyEntry>): Promise<RecoveryCaseTriageIdempotencyEntry>;
  complete(idempotencyId: string, safeResultSummary: string, resourceType?: string, resourceId?: string): Promise<RecoveryCaseTriageIdempotencyEntry>;
  listBySchool(schoolId: string): Promise<RecoveryCaseTriageIdempotencyEntry[]>;
  listByOperation(schoolId: string, operation: string): Promise<RecoveryCaseTriageIdempotencyEntry[]>;
}
