import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResultDeliveryJobService,
  ResultDeliveryAuditBridge,
  ResultDeliveryIdempotencyService,
} from '../services/index';
import {
  InMemoryResultDeliveryJobRepository,
  InMemoryResultDeliveryRecipientRepository,
  InMemoryResultDeliveryChannelEnvelopeRepository,
  InMemoryResultDeliverySuppressionRepository,
  InMemoryResultDeliveryAttemptRepository,
  InMemoryResultDeliveryAuditRepository,
  InMemoryResultDeliveryIdempotencyRepository,
  InMemoryResultDeliveryMockProviderRepository,
  InMemoryResultDeliveryReceiptRepository,
} from '../repositories/inMemoryResultDeliveryRepositories';
import type { ResultDeliveryCommandContext } from '../contracts/resultDeliveryContracts';
import type { ResultDeliveryChannel, ResultDeliveryJobMode } from '../contracts/resultDeliveryContracts';

function makeCtx(overrides?: Partial<ResultDeliveryCommandContext>): ResultDeliveryCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

function makeJobInput() {
  return {
    resultReleaseDeliveryIntentId: 'intent-1',
    resultReleasePacketId: 'packet-1',
    resultReleaseApprovalId: 'approval-1',
    resultAudienceProjectionId: 'projection-1',
    studentRef: 'student-1',
    audienceType: 'student' as const,
    deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
    jobMode: 'dry_run_only' as ResultDeliveryJobMode,
    safeJobSummary: 'Test delivery job',
  };
}

describe('Package 12 — Delivery Job Lifecycle', () => {
  let jobRepo: InMemoryResultDeliveryJobRepository;
  let recipientRepo: InMemoryResultDeliveryRecipientRepository;
  let envelopeRepo: InMemoryResultDeliveryChannelEnvelopeRepository;
  let suppressionRepo: InMemoryResultDeliverySuppressionRepository;
  let attemptRepo: InMemoryResultDeliveryAttemptRepository;
  let auditRepo: InMemoryResultDeliveryAuditRepository;
  let idempotencyRepo: InMemoryResultDeliveryIdempotencyRepository;
  let auditBridge: ResultDeliveryAuditBridge;
  let idempotencyService: ResultDeliveryIdempotencyService;
  let jobService: ResultDeliveryJobService;

  beforeEach(() => {
    jobRepo = new InMemoryResultDeliveryJobRepository();
    recipientRepo = new InMemoryResultDeliveryRecipientRepository();
    envelopeRepo = new InMemoryResultDeliveryChannelEnvelopeRepository();
    suppressionRepo = new InMemoryResultDeliverySuppressionRepository();
    attemptRepo = new InMemoryResultDeliveryAttemptRepository();
    auditRepo = new InMemoryResultDeliveryAuditRepository();
    idempotencyRepo = new InMemoryResultDeliveryIdempotencyRepository();
    auditBridge = new ResultDeliveryAuditBridge(auditRepo);
    idempotencyService = new ResultDeliveryIdempotencyService(idempotencyRepo);
    jobService = new ResultDeliveryJobService(
      jobRepo, recipientRepo, envelopeRepo, suppressionRepo, attemptRepo,
      auditBridge, idempotencyService,
    );
  });

  it('creates a delivery job from intent with draft status', async () => {
    const ctx = makeCtx();
    const result = await jobService.createDeliveryJobFromIntent(ctx, makeJobInput());
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.data).toBeTruthy();
    if (result.data) {
      const job = result.data as any;
      expect(job.jobStatus).toBe('draft');
      expect(job.schoolId).toBe('school-1');
    }
  });

  it('validates a job — status becomes validated', async () => {
    const ctx = makeCtx();
    const created = await jobService.createDeliveryJobFromIntent(ctx, makeJobInput());
    const jobId = created.resourceId!;
    const result = await jobService.validateDeliveryJob(ctx, jobId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('validated');
  });

  it('queues mock job — status becomes queued_mock', async () => {
    const ctx = makeCtx();
    const created = await jobService.createDeliveryJobFromIntent(ctx, makeJobInput());
    const jobId = created.resourceId!;
    await jobService.validateDeliveryJob(ctx, jobId);
    const result = await jobService.queueMockDeliveryJob(ctx, jobId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('queued_mock');
  });

  it('blocks a job — status becomes blocked', async () => {
    const ctx = makeCtx();
    const created = await jobService.createDeliveryJobFromIntent(ctx, makeJobInput());
    const jobId = created.resourceId!;
    const result = await jobService.blockDeliveryJob(ctx, jobId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('cancels a different job — status becomes cancelled', async () => {
    const ctx = makeCtx();
    const created = await jobService.createDeliveryJobFromIntent(ctx, makeJobInput());
    const jobId = created.resourceId!;
    const result = await jobService.cancelDeliveryJob(ctx, jobId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('cancelled');
  });

  it('voids a job — status becomes void', async () => {
    const ctx = makeCtx();
    const created = await jobService.createDeliveryJobFromIntent(ctx, makeJobInput());
    const jobId = created.resourceId!;
    const result = await jobService.voidDeliveryJob(ctx, jobId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('missing schoolId blocks creation', async () => {
    const ctx = makeCtx({ schoolId: '' });
    const result = await jobService.createDeliveryJobFromIntent(ctx, makeJobInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('live channel (non-mock) blocks creation', async () => {
    const ctx = makeCtx();
    const input = { ...makeJobInput(), deliveryChannel: 'student_portal_live' as ResultDeliveryChannel };
    const result = await jobService.createDeliveryJobFromIntent(ctx, input);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('LIVE_CHANNEL_BLOCKED');
  });

  it('wrong actor role blocks creation', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await jobService.createDeliveryJobFromIntent(ctx, makeJobInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('FORBIDDEN');
  });

  it('creates a job with all optional fields', async () => {
    const ctx = makeCtx();
    const result = await jobService.createDeliveryJobFromIntent(ctx, {
      ...makeJobInput(),
      sourceRefsJson: { src: 'test' },
      allowedFieldsJson: { grade: true },
      blockedFieldsJson: { answerKey: true },
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    if (result.data) {
      const job = result.data as any;
      expect(job.sourceRefsJson).toEqual({ src: 'test' });
    }
  });
});
