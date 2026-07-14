import type { MarkingInvocationRequest } from './markingInvocationContracts';
import type { SubmittedSnapshotIntake } from './submittedSnapshotIntakeContracts';
import type { MarkingBatch, MarkingBatchItem } from './markingBatchContracts';
import type { MarkingResultLink } from './markingResultBridgeContracts';

export interface MarkingInvocationRequestRepository {
  create(request: MarkingInvocationRequest): Promise<MarkingInvocationRequest>;
  findById(markingInvocationRequestId: string): Promise<MarkingInvocationRequest | null>;
  findBySchoolId(schoolId: string): Promise<MarkingInvocationRequest[]>;
  findBySchoolIdAndStatus(schoolId: string, status: string): Promise<MarkingInvocationRequest[]>;
  findByDeliverySessionId(deliverySessionId: string): Promise<MarkingInvocationRequest[]>;
  update(request: MarkingInvocationRequest): Promise<MarkingInvocationRequest>;
  delete(markingInvocationRequestId: string): Promise<void>;
}

export interface SubmittedSnapshotIntakeRepository {
  create(intake: SubmittedSnapshotIntake): Promise<SubmittedSnapshotIntake>;
  findById(snapshotIntakeId: string): Promise<SubmittedSnapshotIntake | null>;
  findBySchoolId(schoolId: string): Promise<SubmittedSnapshotIntake[]>;
  findByInvocationRequestId(markingInvocationRequestId: string): Promise<SubmittedSnapshotIntake[]>;
  findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<SubmittedSnapshotIntake[]>;
  findBySchoolIdAndSubmissionSnapshotId(schoolId: string, submissionSnapshotId: string): Promise<SubmittedSnapshotIntake | null>;
  update(intake: SubmittedSnapshotIntake): Promise<SubmittedSnapshotIntake>;
  delete(snapshotIntakeId: string): Promise<void>;
}

export interface MarkingBatchRepository {
  create(batch: MarkingBatch): Promise<MarkingBatch>;
  findById(markingBatchId: string): Promise<MarkingBatch | null>;
  findBySchoolId(schoolId: string): Promise<MarkingBatch[]>;
  findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingBatch[]>;
  findByMarkingRunId(markingRunId: string): Promise<MarkingBatch[]>;
  update(batch: MarkingBatch): Promise<MarkingBatch>;
  delete(markingBatchId: string): Promise<void>;
}

export interface MarkingBatchItemRepository {
  create(item: MarkingBatchItem): Promise<MarkingBatchItem>;
  findById(markingBatchItemId: string): Promise<MarkingBatchItem | null>;
  findByBatchId(markingBatchId: string): Promise<MarkingBatchItem[]>;
  findBySchoolId(schoolId: string): Promise<MarkingBatchItem[]>;
  findBySnapshotIntakeId(snapshotIntakeId: string): Promise<MarkingBatchItem[]>;
  findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<MarkingBatchItem[]>;
  findByAnswerSubmissionId(answerSubmissionId: string): Promise<MarkingBatchItem[]>;
  findByItemStatus(itemStatus: string): Promise<MarkingBatchItem[]>;
  update(item: MarkingBatchItem): Promise<MarkingBatchItem>;
  delete(markingBatchItemId: string): Promise<void>;
}

export interface MarkingResultLinkRepository {
  create(link: MarkingResultLink): Promise<MarkingResultLink>;
  findById(markingResultLinkId: string): Promise<MarkingResultLink | null>;
  findBySchoolId(schoolId: string): Promise<MarkingResultLink[]>;
  findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingResultLink[]>;
  findByBatchId(markingBatchId: string): Promise<MarkingResultLink[]>;
  findByBatchItemId(markingBatchItemId: string): Promise<MarkingResultLink[]>;
  findByMarkingRunId(markingRunId: string): Promise<MarkingResultLink[]>;
  findByMarkingResultVersionId(markingResultVersionId: string): Promise<MarkingResultLink[]>;
  update(link: MarkingResultLink): Promise<MarkingResultLink>;
  delete(markingResultLinkId: string): Promise<void>;
}

export interface MarkingDispatchAuditRepository {
  create(event: MarkingDispatchAuditEvent): Promise<MarkingDispatchAuditEvent>;
  findById(markingDispatchAuditId: string): Promise<MarkingDispatchAuditEvent | null>;
  findBySchoolId(schoolId: string): Promise<MarkingDispatchAuditEvent[]>;
  findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingDispatchAuditEvent[]>;
  findByBatchId(markingBatchId: string): Promise<MarkingDispatchAuditEvent[]>;
  findByEventType(eventType: string): Promise<MarkingDispatchAuditEvent[]>;
}

export interface MarkingInvocationIdempotencyRepository {
  create(entry: MarkingInvocationIdempotencyEntry): Promise<MarkingInvocationIdempotencyEntry>;
  findById(markingInvocationIdempotencyId: string): Promise<MarkingInvocationIdempotencyEntry | null>;
  findBySchoolIdOperationAndKey(schoolId: string, operation: string, idempotencyKey: string): Promise<MarkingInvocationIdempotencyEntry | null>;
  findByStatus(status: string): Promise<MarkingInvocationIdempotencyEntry[]>;
  update(entry: MarkingInvocationIdempotencyEntry): Promise<MarkingInvocationIdempotencyEntry>;
  delete(markingInvocationIdempotencyId: string): Promise<void>;
}

export interface MarkingReadinessCheckRepository {
  create(check: MarkingReadinessCheck): Promise<MarkingReadinessCheck>;
  findById(markingReadinessCheckId: string): Promise<MarkingReadinessCheck | null>;
  findBySchoolId(schoolId: string): Promise<MarkingReadinessCheck[]>;
  findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingReadinessCheck[]>;
  findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<MarkingReadinessCheck[]>;
  findByBatchId(markingBatchId: string): Promise<MarkingReadinessCheck[]>;
  findByCheckType(checkType: string): Promise<MarkingReadinessCheck[]>;
  findByCheckStatus(checkStatus: string): Promise<MarkingReadinessCheck[]>;
}

export interface MarkingDispatchAuditEvent {
  markingDispatchAuditId: string;
  schoolId: string;
  markingInvocationRequestId: string | null;
  markingBatchId: string | null;
  markingBatchItemId: string | null;
  markingRunId: string | null;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: string[] | null;
  metadataJson: Record<string, unknown> | null;
  requestId: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface MarkingInvocationIdempotencyEntry {
  markingInvocationIdempotencyId: string;
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

export interface MarkingReadinessCheck {
  markingReadinessCheckId: string;
  schoolId: string;
  markingInvocationRequestId: string | null;
  submissionSnapshotId: string | null;
  markingBatchId: string | null;
  checkType: string;
  checkStatus: string;
  reasonCodesJson: string[] | null;
  safeCheckSummary: string;
  createdAt: string;
}

export type MarkingReadinessCheckType = 'submission_snapshot_readiness' | 'marking_policy_readiness' | 'answer_key_boundary_readiness' | 'rubric_boundary_readiness' | 'teacher_review_boundary_readiness' | 'batch_execution_readiness';

export type MarkingReadinessCheckStatusType = 'passed' | 'failed' | 'blocked' | 'warning';
