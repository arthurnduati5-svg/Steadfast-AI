import { MarkingDispatchAuditEvent, MarkingDispatchAuditRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemoryMarkingDispatchAuditRepository } from '../repositories/inMemoryMarkingInvocationRepositories';

export class MarkingInvocationAuditBridge {
  constructor(
    private auditRepo: MarkingDispatchAuditRepository = new InMemoryMarkingDispatchAuditRepository(),
  ) {}

  async recordInvocationCreated(schoolId: string, actorId: string, actorRole: string, markingInvocationRequestId: string, correlationId: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, markingInvocationRequestId, null, null, null, actorId, actorRole, 'invocation_created', 'accepted', 'Marking invocation request created', [], null, null, correlationId);
  }

  async recordSnapshotIntaken(schoolId: string, actorId: string, actorRole: string, markingInvocationRequestId: string, submissionSnapshotId: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, markingInvocationRequestId, null, null, null, actorId, actorRole, 'snapshot_intaken', 'accepted', `Snapshot ${submissionSnapshotId} intaken`, [], null, null, '');
  }

  async recordReadinessChecked(schoolId: string, actorId: string, actorRole: string, markingInvocationRequestId: string, checkType: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, markingInvocationRequestId, null, null, null, actorId, actorRole, 'readiness_checked', 'accepted', `Readiness check ${checkType} completed`, [checkType], null, null, '');
  }

  async recordBatchPlanned(schoolId: string, actorId: string, actorRole: string, markingInvocationRequestId: string, markingBatchId: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, markingInvocationRequestId, markingBatchId, null, null, actorId, actorRole, 'batch_planned', 'accepted', `Batch ${markingBatchId} planned`, [], null, null, '');
  }

  async recordBatchQueued(schoolId: string, actorId: string, actorRole: string, markingInvocationRequestId: string, markingBatchId: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, markingInvocationRequestId, markingBatchId, null, null, actorId, actorRole, 'batch_queued', 'accepted', `Batch ${markingBatchId} queued`, [], null, null, '');
  }

  async recordBatchItemMarked(schoolId: string, actorId: string, actorRole: string, markingInvocationRequestId: string, markingBatchItemId: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, markingInvocationRequestId, null, markingBatchItemId, null, actorId, actorRole, 'batch_item_marked', 'accepted', `Batch item ${markingBatchItemId} marked`, [], null, null, '');
  }

  async recordBatchItemDispatchedToTeacherReview(schoolId: string, actorId: string, actorRole: string, markingInvocationRequestId: string, markingBatchItemId: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, markingInvocationRequestId, null, markingBatchItemId, null, actorId, actorRole, 'batch_item_dispatched_teacher_review', 'accepted', `Batch item ${markingBatchItemId} dispatched to teacher review`, ['teacher_review_required'], null, null, '');
  }

  async recordResultVersionLinked(schoolId: string, actorId: string, actorRole: string, markingInvocationRequestId: string, markingResultVersionId: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, markingInvocationRequestId, null, null, null, actorId, actorRole, 'result_version_linked', 'accepted', `Result version ${markingResultVersionId} linked`, [], null, null, '');
  }

  async recordPolicyBlocked(schoolId: string, actorId: string, actorRole: string, operation: string, reasonCodes: string[]): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, null, null, null, null, actorId, actorRole, 'policy_blocked', 'blocked', `Operation ${operation} blocked by policy`, reasonCodes, null, null, '');
  }

  async recordSafeError(schoolId: string, actorId: string, actorRole: string, operation: string, errorMessage: string): Promise<MarkingDispatchAuditEvent> {
    return this.record(schoolId, null, null, null, null, actorId, actorRole, 'safe_error', 'error', `Error in ${operation}: ${errorMessage}`, [], null, null, '');
  }

  private async record(
    schoolId: string,
    markingInvocationRequestId: string | null,
    markingBatchId: string | null,
    markingBatchItemId: string | null,
    markingRunId: string | null,
    actorId: string,
    actorRole: string,
    eventType: string,
    decision: string,
    safeSummary: string,
    reasonCodes: string[],
    metadata: Record<string, unknown> | null,
    requestId: string | null,
    correlationId: string | null,
  ): Promise<MarkingDispatchAuditEvent> {
    const event: MarkingDispatchAuditEvent = {
      markingDispatchAuditId: crypto.randomUUID(),
      schoolId,
      markingInvocationRequestId,
      markingBatchId,
      markingBatchItemId,
      markingRunId,
      actorId,
      actorRole,
      eventType,
      decision,
      safeSummary,
      reasonCodesJson: reasonCodes.length > 0 ? reasonCodes : null,
      metadataJson: metadata,
      requestId,
      correlationId,
      createdAt: new Date().toISOString(),
    };
    return this.auditRepo.create(event);
  }
}
