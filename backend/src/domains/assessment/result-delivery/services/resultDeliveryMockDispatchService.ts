import type {
  ResultDeliverySafeEnvelope,
  ResultDeliveryCommandContext,
} from '../contracts/resultDeliveryContracts';
import type { ResultDeliveryAttempt, CreateMockAttemptInput } from '../contracts/resultDeliveryAttemptContracts';
import type {
  ResultDeliveryAttemptRepository,
  ResultDeliveryChannelEnvelopeRepository,
  ResultDeliverySuppressionRepository,
} from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryAuditBridge } from './resultDeliveryAuditBridge';
import type { ResultDeliveryIdempotencyService } from './resultDeliveryIdempotencyService';
import { evaluateMockDispatchPolicy } from '../policies/resultDeliveryPolicyDefinitions';

export class ResultDeliveryMockDispatchService {
  constructor(
    private attemptRepo: ResultDeliveryAttemptRepository,
    private envelopeRepo: ResultDeliveryChannelEnvelopeRepository,
    private suppressionRepo: ResultDeliverySuppressionRepository,
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

  async createMockAttempt(
    ctx: ResultDeliveryCommandContext,
    input: CreateMockAttemptInput,
  ): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateMockDispatchPolicy({ schoolId: ctx.schoolId, deliveryChannel: input.deliveryChannel });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const envelope = await this.envelopeRepo.getById(input.resultDeliveryChannelEnvelopeId);
    if (!envelope) return this.envelope(ctx, { ok: false, safeMessage: 'Channel envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (envelope.envelopeStatus !== 'sealed') return this.envelope(ctx, { ok: false, safeMessage: 'Envelope must be sealed before creating attempt', reasonCode: 'INVALID_STATUS', status: 'error' });

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'createMockAttempt', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'createMockAttempt', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const attempt = await this.attemptRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordMockAttemptCreated(ctx, attempt);
      await this.idempotencyService.completeOperation(startIdem, attempt.resultDeliveryAttemptId, 'Mock attempt created');
      return this.envelope(ctx, {
        resourceId: attempt.resultDeliveryAttemptId,
        resourceVersion: attempt.createdAt,
        status: attempt.attemptStatus,
        safeMessage: 'Mock attempt created successfully',
        data: attempt,
        nextAllowedActions: ['dispatchMockAttempt'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create mock attempt', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async dispatchMockAttempt(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const policyCheck = evaluateMockDispatchPolicy({ schoolId: ctx.schoolId, deliveryChannel: attempt.deliveryChannel });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    await this.attemptRepo.dispatch(attemptId);
    await this.auditBridge.recordMockAttemptDispatched(ctx, attempt);
    return this.envelope(ctx, { resourceId: attemptId, status: 'mock_dispatched', safeMessage: 'Mock attempt dispatched', nextAllowedActions: ['completeMockAttempt', 'failMockAttempt'] });
  }

  async failMockAttempt(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    await this.attemptRepo.fail(attemptId);
    await this.auditBridge.recordMockAttemptFailed(ctx, attempt);
    return this.envelope(ctx, { resourceId: attemptId, status: 'mock_failed', safeMessage: 'Mock attempt failed', nextAllowedActions: ['createRetryPlanForMockFailure'] });
  }

  async completeMockAttempt(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    await this.attemptRepo.complete(attemptId);
    await this.auditBridge.recordMockAttemptCompleted(ctx, attempt);
    return this.envelope(ctx, { resourceId: attemptId, status: 'completed_mock', safeMessage: 'Mock attempt completed', nextAllowedActions: ['recordMockReceipt'] });
  }

  async blockLiveAttempt(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (attempt.attemptStatus === 'void' || attempt.attemptStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Attempt already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.attemptRepo.blockLive(attemptId);
    await this.suppressionRepo.create({
      schoolId: ctx.schoolId,
      resultDeliveryJobId: attempt.resultDeliveryJobId,
      suppressionType: 'live_channel_disabled',
      suppressionReasonCode: 'LIVE_CHANNEL_BLOCKED_BY_POLICY',
      safeSuppressionSummary: 'Live delivery blocked - Package 12 mock-only restriction',
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });
    await this.auditBridge.recordLiveAttemptBlocked(ctx, attempt);
    return this.envelope(ctx, { resourceId: attemptId, status: 'blocked_live_channel', safeMessage: 'Live attempt blocked' });
  }

  async cancelMockAttempt(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (attempt.attemptStatus === 'void' || attempt.attemptStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Attempt already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.attemptRepo.cancel(attemptId);
    return this.envelope(ctx, { resourceId: attemptId, status: 'cancelled', safeMessage: 'Mock attempt cancelled' });
  }

  async voidMockAttempt(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (attempt.attemptStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Attempt already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.attemptRepo.void(attemptId);
    return this.envelope(ctx, { resourceId: attemptId, status: 'void', safeMessage: 'Mock attempt voided' });
  }

  async getMockAttempt(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const attempt = await this.attemptRepo.getById(attemptId);
    if (!attempt) return this.envelope(ctx, { ok: false, safeMessage: 'Mock attempt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: attempt.resultDeliveryAttemptId, status: attempt.attemptStatus, safeMessage: 'Mock attempt found', data: attempt });
  }

  async listAttemptsForJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!jobId) return this.envelope(ctx, { ok: false, safeMessage: 'Job ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const attempts = await this.attemptRepo.listByDeliveryJobId(ctx.schoolId, jobId);
    return this.envelope(ctx, { safeMessage: `Found ${attempts.length} attempts for job`, data: attempts });
  }
}
