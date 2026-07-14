import type {
  ResultDeliverySafeEnvelope,
  ResultDeliveryCommandContext,
} from '../contracts/resultDeliveryContracts';
import type { ResultDeliveryJob, CreateDeliveryJobInput } from '../contracts/resultDeliveryJobContracts';
import type {
  ResultDeliveryJobRepository,
  ResultDeliveryRecipientRepository,
  ResultDeliveryChannelEnvelopeRepository,
  ResultDeliverySuppressionRepository,
  ResultDeliveryAttemptRepository,
} from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryAuditBridge } from './resultDeliveryAuditBridge';
import type { ResultDeliveryIdempotencyService } from './resultDeliveryIdempotencyService';
import {
  evaluateDeliveryJobCreationPolicy,
  evaluateLiveSendBlockPolicy,
} from '../policies/resultDeliveryPolicyDefinitions';

export class ResultDeliveryJobService {
  constructor(
    private jobRepo: ResultDeliveryJobRepository,
    private recipientRepo: ResultDeliveryRecipientRepository,
    private envelopeRepo: ResultDeliveryChannelEnvelopeRepository,
    private suppressionRepo: ResultDeliverySuppressionRepository,
    private attemptRepo: ResultDeliveryAttemptRepository,
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

  async createDeliveryJobFromIntent(
    ctx: ResultDeliveryCommandContext,
    input: CreateDeliveryJobInput,
  ): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateDeliveryJobCreationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    if (!input.deliveryChannel.endsWith('_mock')) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_DELIVERY_JOB_CREATION', reasonCode: 'LIVE_CHANNEL_BLOCKED', safeSummary: 'Only mock channels are allowed in Package 12' });
      return this.envelope(ctx, { ok: false, safeMessage: 'Only mock delivery channels are supported', reasonCode: 'LIVE_CHANNEL_BLOCKED', status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'createDeliveryJobFromIntent', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'createDeliveryJobFromIntent', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const job = await this.jobRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordDeliveryJobCreated(ctx, job);
      await this.idempotencyService.completeOperation(startIdem, job.resultDeliveryJobId, 'Delivery job created');
      return this.envelope(ctx, {
        resourceId: job.resultDeliveryJobId,
        resourceVersion: job.createdAt,
        status: job.jobStatus,
        safeMessage: 'Delivery job created successfully',
        data: job,
        nextAllowedActions: ['validateDeliveryJob'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create delivery job', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getDeliveryJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    return this.envelope(ctx, { resourceId: job.resultDeliveryJobId, status: job.jobStatus, safeMessage: 'Delivery job found', data: job });
  }

  async listDeliveryJobsForSchool(ctx: ResultDeliveryCommandContext): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const jobs = await this.jobRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${jobs.length} delivery jobs`, data: jobs });
  }

  async listDeliveryJobsForStudent(ctx: ResultDeliveryCommandContext, studentRef: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const jobs = await this.jobRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${jobs.length} delivery jobs for student`, data: jobs });
  }

  async listDeliveryJobsForReleaseIntent(ctx: ResultDeliveryCommandContext, intentId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!intentId) return this.envelope(ctx, { ok: false, safeMessage: 'Intent ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const jobs = await this.jobRepo.listByReleaseIntentId(ctx.schoolId, intentId);
    return this.envelope(ctx, { safeMessage: `Found ${jobs.length} delivery jobs for intent`, data: jobs });
  }

  async validateDeliveryJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (job.jobStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Job must be in draft status to validate', reasonCode: 'INVALID_STATUS_TRANSITION', status: 'error' });

    const liveCheck = evaluateLiveSendBlockPolicy({ schoolId: ctx.schoolId, deliveryChannel: job.deliveryChannel });
    if (!liveCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: liveCheck.policyFamily, reasonCode: liveCheck.reasonCode, safeSummary: liveCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: liveCheck.safeMessage, reasonCode: liveCheck.reasonCode, policyDecision: liveCheck, status: 'blocked' });
    }

    await this.jobRepo.updateStatus(jobId, 'validated');
    await this.auditBridge.recordDeliveryJobValidated(ctx, job);
    return this.envelope(ctx, { resourceId: jobId, status: 'validated', safeMessage: 'Delivery job validated', nextAllowedActions: ['queueMockDeliveryJob'] });
  }

  async queueMockDeliveryJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (job.jobStatus !== 'validated') return this.envelope(ctx, { ok: false, safeMessage: 'Job must be validated before queuing mock', reasonCode: 'INVALID_STATUS_TRANSITION', status: 'error' });

    await this.jobRepo.updateStatus(jobId, 'queued_mock');
    await this.auditBridge.recordDeliveryJobQueuedMock(ctx, job);
    return this.envelope(ctx, { resourceId: jobId, status: 'queued_mock', safeMessage: 'Delivery job queued for mock dispatch', nextAllowedActions: ['createMockAttempt'] });
  }

  async blockDeliveryJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.jobStatus === 'void' || job.jobStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Job already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.block(jobId);
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_DELIVERY_JOB_CREATION', reasonCode: 'MANUALLY_BLOCKED', safeSummary: 'Delivery job manually blocked' });
    return this.envelope(ctx, { resourceId: jobId, status: 'blocked', safeMessage: 'Delivery job blocked' });
  }

  async cancelDeliveryJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.jobStatus === 'void' || job.jobStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Job already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.cancel(jobId);
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_DELIVERY_JOB_CREATION', reasonCode: 'CANCELLED', safeSummary: 'Delivery job cancelled' });
    return this.envelope(ctx, { resourceId: jobId, status: 'cancelled', safeMessage: 'Delivery job cancelled' });
  }

  async voidDeliveryJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const job = await this.jobRepo.getById(jobId);
    if (!job) return this.envelope(ctx, { ok: false, safeMessage: 'Delivery job not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (job.jobStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Job already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.jobRepo.void(jobId);
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_DELIVERY_JOB_CREATION', reasonCode: 'VOIDED', safeSummary: 'Delivery job voided' });
    return this.envelope(ctx, { resourceId: jobId, status: 'void', safeMessage: 'Delivery job voided' });
  }
}
