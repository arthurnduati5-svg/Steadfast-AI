import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResultDeliveryJobService,
  ResultDeliverySuppressionService,
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
} from '../repositories/inMemoryResultDeliveryRepositories';
import type { ResultDeliveryCommandContext, ResultDeliveryChannel, ResultDeliveryJobMode } from '../contracts/resultDeliveryContracts';

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

describe('Package 12 — Suppression and Policy', () => {
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
  let suppressionService: ResultDeliverySuppressionService;
  let jobId: string;

  beforeEach(async () => {
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
    suppressionService = new ResultDeliverySuppressionService(suppressionRepo, auditBridge, idempotencyService);

    const ctx = makeCtx();
    const result = await jobService.createDeliveryJobFromIntent(ctx, {
      resultReleaseDeliveryIntentId: 'intent-1',
      resultReleasePacketId: 'packet-1',
      resultReleaseApprovalId: 'approval-1',
      resultAudienceProjectionId: 'projection-1',
      studentRef: 'student-1',
      audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      jobMode: 'dry_run_only' as ResultDeliveryJobMode,
      safeJobSummary: 'Test job',
    });
    jobId = result.resourceId!;
  });

  it('creates suppression for a delivery job', async () => {
    const ctx = makeCtx();
    const result = await suppressionService.suppressDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      suppressionType: 'privacy_boundary',
      suppressionReasonCode: 'PRIVACY_BOUNDARY_ENFORCED',
      safeSuppressionSummary: 'Privacy boundary suppression',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
    expect(result.resourceId).toBeTruthy();
  });

  it('creates suppression of type missing_recipient', async () => {
    const ctx = makeCtx();
    const result = await suppressionService.suppressDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      suppressionType: 'missing_recipient',
      suppressionReasonCode: 'NO_RECIPIENT_FOUND',
      safeSuppressionSummary: 'Missing recipient suppression',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
  });

  it('creates suppression of type blocked_audience', async () => {
    const ctx = makeCtx();
    const result = await suppressionService.suppressDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      suppressionType: 'blocked_audience',
      suppressionReasonCode: 'AUDIENCE_NOT_ALLOWED',
      safeSuppressionSummary: 'Blocked audience suppression',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
  });

  it('clears suppression', async () => {
    const ctx = makeCtx();
    const created = await suppressionService.suppressDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      suppressionType: 'privacy_boundary',
      suppressionReasonCode: 'PRIVACY',
      safeSuppressionSummary: 'Test suppression',
    });
    const suppressionId = created.resourceId!;
    const cleared = await suppressionService.clearSuppression(ctx, suppressionId);
    expect(cleared.ok).toBe(true);
    expect(cleared.status).toBe('cleared');
  });

  it('voids suppression', async () => {
    const ctx = makeCtx();
    const created = await suppressionService.suppressDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      suppressionType: 'privacy_boundary',
      suppressionReasonCode: 'PRIVACY',
      safeSuppressionSummary: 'Test suppression',
    });
    const suppressionId = created.resourceId!;
    const voided = await suppressionService.voidSuppression(ctx, suppressionId);
    expect(voided.ok).toBe(true);
    expect(voided.status).toBe('void');
  });

  it('suppression does not delete the job record', async () => {
    const ctx = makeCtx();
    await suppressionService.suppressDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      suppressionType: 'privacy_boundary',
      suppressionReasonCode: 'PRIVACY',
      safeSuppressionSummary: 'Test suppression',
    });
    const job = await jobService.getDeliveryJob(ctx, jobId);
    expect(job.ok).toBe(true);
    expect(job.resourceId).toBe(jobId);
  });

  it('listSuppressionsForJob returns created suppressions', async () => {
    const ctx1 = makeCtx();
    await suppressionService.suppressDeliveryJob(ctx1, {
      resultDeliveryJobId: jobId,
      suppressionType: 'privacy_boundary',
      suppressionReasonCode: 'REASON',
      safeSuppressionSummary: 'S1',
    });
    const ctx2 = makeCtx();
    await suppressionService.suppressDeliveryJob(ctx2, {
      resultDeliveryJobId: jobId,
      suppressionType: 'missing_recipient',
      suppressionReasonCode: 'REASON2',
      safeSuppressionSummary: 'S2',
    });
    const list = await suppressionService.listSuppressionsForJob(ctx1, jobId);
    expect(list.ok).toBe(true);
    if (list.data) {
      expect((list.data as any[]).length).toBe(2);
    }
  });
});
