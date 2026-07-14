import { v4 as uuid } from 'uuid';
import { ExamDeliveryAuditEvent } from '../contracts/examDeliverySnapshotContracts';
import { ExamDeliveryCommandContext } from '../contracts/examDeliveryContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';

export class ExamDeliveryAuditBridge {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async recordSessionCreated(ctx: ExamDeliveryCommandContext, deliverySessionId: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, null, 'session_created', 'allowed', 'Delivery session created');
  }

  async recordSessionOpened(ctx: ExamDeliveryCommandContext, deliverySessionId: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, null, 'session_opened', 'allowed', 'Delivery session opened');
  }

  async recordVariantAssigned(ctx: ExamDeliveryCommandContext, deliverySessionId: string, attemptId?: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, attemptId ?? null, 'variant_assigned', 'allowed', 'Variant assigned to student');
  }

  async recordAttemptStarted(ctx: ExamDeliveryCommandContext, deliverySessionId: string, attemptId: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, attemptId, 'attempt_started', 'allowed', 'Student attempt started');
  }

  async recordAnswerSaved(ctx: ExamDeliveryCommandContext, deliverySessionId: string, attemptId: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, attemptId, 'answer_saved', 'allowed', 'Answer saved');
  }

  async recordAttemptSubmitted(ctx: ExamDeliveryCommandContext, deliverySessionId: string, attemptId: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, attemptId, 'attempt_submitted', 'allowed', 'Attempt submitted');
  }

  async recordSnapshotSealed(ctx: ExamDeliveryCommandContext, deliverySessionId: string, attemptId: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, attemptId, 'snapshot_sealed', 'allowed', 'Submission snapshot sealed');
  }

  async recordSessionClosed(ctx: ExamDeliveryCommandContext, deliverySessionId: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, null, 'session_closed', 'allowed', 'Delivery session closed');
  }

  async recordPolicyBlocked(ctx: ExamDeliveryCommandContext, deliverySessionId: string | null, reason: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, null, 'policy_blocked', 'blocked', reason);
  }

  async recordSafeError(ctx: ExamDeliveryCommandContext, deliverySessionId: string | null, errorSummary: string): Promise<ExamDeliveryAuditEvent> {
    return this.record(ctx, deliverySessionId, null, 'safe_error', 'error', errorSummary);
  }

  private async record(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string | null,
    attemptId: string | null,
    eventType: string,
    decision: string,
    safeSummary: string,
  ): Promise<ExamDeliveryAuditEvent> {
    return this.repos.auditRepository.create({
      deliveryAuditId: uuid(),
      schoolId: ctx.schoolId,
      deliverySessionId,
      attemptId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType,
      decision,
      safeSummary,
      reasonCodesJson: null,
      metadataJson: null,
      requestId: null,
      correlationId: ctx.correlationId ?? null,
    });
  }
}
