import type {
  ResultDeliverySafeEnvelope,
  ResultDeliveryCommandContext,
} from '../contracts/resultDeliveryContracts';
import type { ResultDeliveryRecipient, CreateRecipientInput } from '../contracts/resultDeliveryRecipientContracts';
import type { ResultDeliveryRecipientRepository } from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryAuditBridge } from './resultDeliveryAuditBridge';
import type { ResultDeliveryIdempotencyService } from './resultDeliveryIdempotencyService';
import { evaluateRecipientResolutionPolicy } from '../policies/resultDeliveryPolicyDefinitions';

export class ResultDeliveryRecipientResolver {
  constructor(
    private recipientRepo: ResultDeliveryRecipientRepository,
    private auditBridge: ResultDeliveryAuditBridge,
    private idempotencyService: ResultDeliveryIdempotencyService,
  ) {}

  private envelope(
    ctx: ResultDeliveryCommandContext,
    overrides: Partial<ResultDeliverySafeEnvelope>,
  ): ResultDeliverySafeEnvelope {
    return {
      ok: true,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
      nextAllowedActions: [],
      ...overrides,
    };
  }

  async resolveRecipientForDeliveryJob(
    ctx: ResultDeliveryCommandContext,
    input: CreateRecipientInput,
  ): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateRecipientResolutionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'resolveRecipientForDeliveryJob', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'resolveRecipientForDeliveryJob', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const recipient = await this.recipientRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordRecipientResolved(ctx, recipient);
      await this.idempotencyService.completeOperation(startIdem, recipient.resultDeliveryRecipientId, 'Recipient resolved');
      return this.envelope(ctx, {
        resourceId: recipient.resultDeliveryRecipientId,
        resourceVersion: recipient.createdAt,
        status: recipient.recipientStatus,
        safeMessage: 'Recipient resolved successfully',
        data: recipient,
        nextAllowedActions: ['verifyRecipientBoundary'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to resolve recipient', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async verifyRecipientBoundary(ctx: ResultDeliveryCommandContext, recipientId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(recipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (recipient.recipientStatus !== 'resolved') return this.envelope(ctx, { ok: false, safeMessage: 'Recipient must be resolved before verification', reasonCode: 'INVALID_STATUS_TRANSITION', status: 'error' });

    await this.recipientRepo.verify(recipientId);
    await this.auditBridge.recordRecipientBlocked(ctx, recipient, 'VERIFIED', 'Recipient boundary verified');
    return this.envelope(ctx, { resourceId: recipientId, status: 'verified', safeMessage: 'Recipient boundary verified', nextAllowedActions: ['createChannelEnvelope'] });
  }

  async blockRecipient(ctx: ResultDeliveryCommandContext, recipientId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(recipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.recipientStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided recipient', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.recipientRepo.block(recipientId);
    await this.auditBridge.recordRecipientBlocked(ctx, recipient, 'BLOCKED', 'Recipient blocked');
    return this.envelope(ctx, { resourceId: recipientId, status: 'blocked', safeMessage: 'Recipient blocked' });
  }

  async voidRecipient(ctx: ResultDeliveryCommandContext, recipientId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(recipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.recipientStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Recipient already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.recipientRepo.void(recipientId);
    await this.auditBridge.recordRecipientBlocked(ctx, recipient, 'VOIDED', 'Recipient voided');
    return this.envelope(ctx, { resourceId: recipientId, status: 'void', safeMessage: 'Recipient voided' });
  }

  async getRecipient(ctx: ResultDeliveryCommandContext, recipientId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const recipient = await this.recipientRepo.getById(recipientId);
    if (!recipient) return this.envelope(ctx, { ok: false, safeMessage: 'Recipient not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (recipient.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    return this.envelope(ctx, { resourceId: recipient.resultDeliveryRecipientId, status: recipient.recipientStatus, safeMessage: 'Recipient found', data: recipient });
  }

  async listRecipientsForJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!jobId) return this.envelope(ctx, { ok: false, safeMessage: 'Job ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const recipients = await this.recipientRepo.listByDeliveryJobId(ctx.schoolId, jobId);
    return this.envelope(ctx, { safeMessage: `Found ${recipients.length} recipients for job`, data: recipients });
  }

  async listRecipientsForStudent(ctx: ResultDeliveryCommandContext, studentRef: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const recipients = await this.recipientRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${recipients.length} recipients for student`, data: recipients });
  }
}
