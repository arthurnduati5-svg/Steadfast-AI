import type { ResultDeliveryCommandContext } from '../contracts/resultDeliveryContracts';
import type { ResultDeliveryJob } from '../contracts/resultDeliveryJobContracts';
import type { ResultDeliveryRecipient } from '../contracts/resultDeliveryRecipientContracts';
import type { ResultDeliveryChannelEnvelope } from '../contracts/resultDeliveryEnvelopeContracts';
import type { ResultDeliverySuppression } from '../contracts/resultDeliverySuppressionContracts';
import type { ResultDeliveryAttempt } from '../contracts/resultDeliveryAttemptContracts';
import type { ResultDeliveryReceipt } from '../contracts/resultDeliveryReceiptContracts';
import type { ResultDeliveryRetryPlan } from '../contracts/resultDeliveryRetryPlanContracts';
import type { ResultDeliveryAuditRepository } from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryAuditEvent } from '../contracts/resultDeliveryAuditContracts';
import { evaluateDeliveryAuditPolicy } from '../policies/resultDeliveryPolicyDefinitions';

function now(): string {
  return new Date().toISOString();
}

export class ResultDeliveryAuditBridge {
  constructor(private auditRepo: ResultDeliveryAuditRepository) {}

  private async record(ctx: ResultDeliveryCommandContext, event: Omit<ResultDeliveryAuditEvent, 'resultDeliveryAuditId' | 'createdAt'>): Promise<void> {
    const policyCheck = evaluateDeliveryAuditPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) return;
    try {
      await this.auditRepo.create({ ...event, createdAt: now() });
    } catch {
    }
  }

  async recordDeliveryJobCreated(ctx: ResultDeliveryCommandContext, job: ResultDeliveryJob): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: job.resultDeliveryJobId,
      resultDeliveryRecipientId: null,
      resultDeliveryChannelEnvelopeId: null,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'DELIVERY_JOB_CREATED',
      decision: 'created',
      safeSummary: `Delivery job created for student ${job.studentRef} on channel ${job.deliveryChannel}`,
      reasonCodesJson: null,
      metadataJson: { jobId: job.resultDeliveryJobId, jobStatus: job.jobStatus, deliveryChannel: job.deliveryChannel, audienceType: job.audienceType },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordDeliveryJobValidated(ctx: ResultDeliveryCommandContext, job: ResultDeliveryJob): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: job.resultDeliveryJobId,
      resultDeliveryRecipientId: null,
      resultDeliveryChannelEnvelopeId: null,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'DELIVERY_JOB_VALIDATED',
      decision: 'validated',
      safeSummary: `Delivery job validated for channel ${job.deliveryChannel}`,
      reasonCodesJson: null,
      metadataJson: { jobId: job.resultDeliveryJobId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordDeliveryJobQueuedMock(ctx: ResultDeliveryCommandContext, job: ResultDeliveryJob): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: job.resultDeliveryJobId,
      resultDeliveryRecipientId: null,
      resultDeliveryChannelEnvelopeId: null,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'DELIVERY_JOB_QUEUED_MOCK',
      decision: 'queued',
      safeSummary: `Delivery job queued for mock dispatch on ${job.deliveryChannel}`,
      reasonCodesJson: null,
      metadataJson: { jobId: job.resultDeliveryJobId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordRecipientResolved(ctx: ResultDeliveryCommandContext, recipient: ResultDeliveryRecipient): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: recipient.resultDeliveryJobId,
      resultDeliveryRecipientId: recipient.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: null,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RECIPIENT_RESOLVED',
      decision: 'resolved',
      safeSummary: `Recipient resolved for scope ${recipient.recipientScope}`,
      reasonCodesJson: null,
      metadataJson: { recipientId: recipient.resultDeliveryRecipientId, recipientScope: recipient.recipientScope, recipientDisplayLabel: recipient.recipientDisplayLabel },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordRecipientBlocked(ctx: ResultDeliveryCommandContext, recipient: ResultDeliveryRecipient, reasonCode: string, safeSummary: string): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: recipient.resultDeliveryJobId,
      resultDeliveryRecipientId: recipient.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: null,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RECIPIENT_BLOCKED',
      decision: 'blocked',
      safeSummary,
      reasonCodesJson: { reasonCode },
      metadataJson: { recipientId: recipient.resultDeliveryRecipientId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordEnvelopeCreated(ctx: ResultDeliveryCommandContext, envelope: ResultDeliveryChannelEnvelope): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: envelope.resultDeliveryJobId,
      resultDeliveryRecipientId: envelope.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: envelope.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'ENVELOPE_CREATED',
      decision: 'created',
      safeSummary: `Channel envelope created for ${envelope.deliveryChannel}`,
      reasonCodesJson: null,
      metadataJson: { envelopeId: envelope.resultDeliveryChannelEnvelopeId, deliveryChannel: envelope.deliveryChannel, envelopeStatus: envelope.envelopeStatus },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordEnvelopeSealed(ctx: ResultDeliveryCommandContext, envelope: ResultDeliveryChannelEnvelope): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: envelope.resultDeliveryJobId,
      resultDeliveryRecipientId: envelope.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: envelope.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'ENVELOPE_SEALED',
      decision: 'sealed',
      safeSummary: `Channel envelope sealed for ${envelope.deliveryChannel}`,
      reasonCodesJson: null,
      metadataJson: { envelopeId: envelope.resultDeliveryChannelEnvelopeId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordSuppressionCreated(ctx: ResultDeliveryCommandContext, suppression: ResultDeliverySuppression): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: suppression.resultDeliveryJobId,
      resultDeliveryRecipientId: suppression.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: suppression.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: suppression.resultDeliverySuppressionId,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'SUPPRESSION_CREATED',
      decision: 'suppressed',
      safeSummary: `Suppression created: ${suppression.safeSuppressionSummary}`,
      reasonCodesJson: null,
      metadataJson: { suppressionId: suppression.resultDeliverySuppressionId, suppressionType: suppression.suppressionType },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordMockAttemptCreated(ctx: ResultDeliveryCommandContext, attempt: ResultDeliveryAttempt): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: attempt.resultDeliveryJobId,
      resultDeliveryRecipientId: attempt.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: attempt.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: attempt.resultDeliveryAttemptId,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'MOCK_ATTEMPT_CREATED',
      decision: 'created',
      safeSummary: `Mock attempt ${attempt.attemptNumber} created via ${attempt.mockProviderName}`,
      reasonCodesJson: null,
      metadataJson: { attemptId: attempt.resultDeliveryAttemptId, attemptNumber: attempt.attemptNumber, mockProviderName: attempt.mockProviderName },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordMockAttemptDispatched(ctx: ResultDeliveryCommandContext, attempt: ResultDeliveryAttempt): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: attempt.resultDeliveryJobId,
      resultDeliveryRecipientId: attempt.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: attempt.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: attempt.resultDeliveryAttemptId,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'MOCK_ATTEMPT_DISPATCHED',
      decision: 'dispatched',
      safeSummary: `Mock attempt ${attempt.attemptNumber} dispatched`,
      reasonCodesJson: null,
      metadataJson: { attemptId: attempt.resultDeliveryAttemptId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordMockAttemptCompleted(ctx: ResultDeliveryCommandContext, attempt: ResultDeliveryAttempt): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: attempt.resultDeliveryJobId,
      resultDeliveryRecipientId: attempt.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: attempt.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: attempt.resultDeliveryAttemptId,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'MOCK_ATTEMPT_COMPLETED',
      decision: 'completed',
      safeSummary: `Mock attempt ${attempt.attemptNumber} completed successfully`,
      reasonCodesJson: null,
      metadataJson: { attemptId: attempt.resultDeliveryAttemptId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordMockAttemptFailed(ctx: ResultDeliveryCommandContext, attempt: ResultDeliveryAttempt): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: attempt.resultDeliveryJobId,
      resultDeliveryRecipientId: attempt.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: attempt.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: attempt.resultDeliveryAttemptId,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'MOCK_ATTEMPT_FAILED',
      decision: 'failed',
      safeSummary: `Mock attempt ${attempt.attemptNumber} failed`,
      reasonCodesJson: null,
      metadataJson: { attemptId: attempt.resultDeliveryAttemptId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordLiveAttemptBlocked(ctx: ResultDeliveryCommandContext, attempt: ResultDeliveryAttempt): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: attempt.resultDeliveryJobId,
      resultDeliveryRecipientId: attempt.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: attempt.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: attempt.resultDeliveryAttemptId,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'LIVE_ATTEMPT_BLOCKED',
      decision: 'blocked',
      safeSummary: `Live attempt blocked for ${attempt.deliveryChannel} - mock-only mode`,
      reasonCodesJson: null,
      metadataJson: { attemptId: attempt.resultDeliveryAttemptId, deliveryChannel: attempt.deliveryChannel },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReceiptRecorded(ctx: ResultDeliveryCommandContext, receipt: ResultDeliveryReceipt): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: receipt.resultDeliveryJobId,
      resultDeliveryRecipientId: receipt.resultDeliveryRecipientId,
      resultDeliveryChannelEnvelopeId: receipt.resultDeliveryChannelEnvelopeId,
      resultDeliveryAttemptId: receipt.resultDeliveryAttemptId,
      resultDeliveryReceiptId: receipt.resultDeliveryReceiptId,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RECEIPT_RECORDED',
      decision: 'recorded',
      safeSummary: `Receipt recorded: ${receipt.safeReceiptSummary}`,
      reasonCodesJson: null,
      metadataJson: { receiptId: receipt.resultDeliveryReceiptId, receiptType: receipt.receiptType, receiptStatus: receipt.receiptStatus },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordRetryPlanCreated(ctx: ResultDeliveryCommandContext, retryPlan: ResultDeliveryRetryPlan): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: retryPlan.resultDeliveryJobId,
      resultDeliveryRecipientId: null,
      resultDeliveryChannelEnvelopeId: null,
      resultDeliveryAttemptId: retryPlan.resultDeliveryAttemptId,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: retryPlan.resultDeliveryRetryPlanId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RETRY_PLAN_CREATED',
      decision: 'created',
      safeSummary: `Retry plan created with policy ${retryPlan.retryPolicy}`,
      reasonCodesJson: null,
      metadataJson: { retryPlanId: retryPlan.resultDeliveryRetryPlanId, retryPolicy: retryPlan.retryPolicy, maxMockAttempts: retryPlan.maxMockAttempts },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordPolicyBlocked(ctx: ResultDeliveryCommandContext, details: { policyFamily: string; reasonCode: string; safeSummary: string }): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: null,
      resultDeliveryRecipientId: null,
      resultDeliveryChannelEnvelopeId: null,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'POLICY_BLOCKED',
      decision: 'blocked',
      safeSummary: details.safeSummary,
      reasonCodesJson: { policyFamily: details.policyFamily, reasonCode: details.reasonCode },
      metadataJson: null,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordSafeError(ctx: ResultDeliveryCommandContext, errorSummary: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultDeliveryJobId: null,
      resultDeliveryRecipientId: null,
      resultDeliveryChannelEnvelopeId: null,
      resultDeliveryAttemptId: null,
      resultDeliveryReceiptId: null,
      resultDeliverySuppressionId: null,
      resultDeliveryRetryPlanId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'SAFE_ERROR',
      decision: 'error',
      safeSummary: errorSummary,
      reasonCodesJson: null,
      metadataJson: metadata ?? null,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }
}
