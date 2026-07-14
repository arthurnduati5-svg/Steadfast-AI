import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResultDeliveryJobService,
  ResultDeliveryRecipientResolver,
  ResultDeliveryEnvelopeService,
  ResultDeliveryMockDispatchService,
  ResultDeliveryRetryPlanService,
  ResultDeliveryAuditBridge,
  ResultDeliveryIdempotencyService,
} from '../services/index';
import {
  InMemoryResultDeliveryJobRepository,
  InMemoryResultDeliveryRecipientRepository,
  InMemoryResultDeliveryChannelEnvelopeRepository,
  InMemoryResultDeliverySuppressionRepository,
  InMemoryResultDeliveryAttemptRepository,
  InMemoryResultDeliveryRetryPlanRepository,
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

describe('Package 12 — Retry Plan Deferral', () => {
  let jobRepo: InMemoryResultDeliveryJobRepository;
  let recipientRepo: InMemoryResultDeliveryRecipientRepository;
  let envelopeRepo: InMemoryResultDeliveryChannelEnvelopeRepository;
  let suppressionRepo: InMemoryResultDeliverySuppressionRepository;
  let attemptRepo: InMemoryResultDeliveryAttemptRepository;
  let retryPlanRepo: InMemoryResultDeliveryRetryPlanRepository;
  let auditRepo: InMemoryResultDeliveryAuditRepository;
  let idempotencyRepo: InMemoryResultDeliveryIdempotencyRepository;
  let auditBridge: ResultDeliveryAuditBridge;
  let idempotencyService: ResultDeliveryIdempotencyService;
  let jobService: ResultDeliveryJobService;
  let resolver: ResultDeliveryRecipientResolver;
  let envelopeService: ResultDeliveryEnvelopeService;
  let dispatchService: ResultDeliveryMockDispatchService;
  let retryPlanService: ResultDeliveryRetryPlanService;
  let attemptId: string;

  beforeEach(async () => {
    jobRepo = new InMemoryResultDeliveryJobRepository();
    recipientRepo = new InMemoryResultDeliveryRecipientRepository();
    envelopeRepo = new InMemoryResultDeliveryChannelEnvelopeRepository();
    suppressionRepo = new InMemoryResultDeliverySuppressionRepository();
    attemptRepo = new InMemoryResultDeliveryAttemptRepository();
    retryPlanRepo = new InMemoryResultDeliveryRetryPlanRepository();
    auditRepo = new InMemoryResultDeliveryAuditRepository();
    idempotencyRepo = new InMemoryResultDeliveryIdempotencyRepository();
    auditBridge = new ResultDeliveryAuditBridge(auditRepo);
    idempotencyService = new ResultDeliveryIdempotencyService(idempotencyRepo);
    jobService = new ResultDeliveryJobService(
      jobRepo, recipientRepo, envelopeRepo, suppressionRepo, attemptRepo,
      auditBridge, idempotencyService,
    );
    resolver = new ResultDeliveryRecipientResolver(recipientRepo, auditBridge, idempotencyService);
    envelopeService = new ResultDeliveryEnvelopeService(envelopeRepo, auditBridge, idempotencyService);
    dispatchService = new ResultDeliveryMockDispatchService(
      attemptRepo, envelopeRepo, suppressionRepo, auditBridge, idempotencyService,
    );
    retryPlanService = new ResultDeliveryRetryPlanService(retryPlanRepo, auditBridge, idempotencyService);

    const ctx = makeCtx();
    const jobResult = await jobService.createDeliveryJobFromIntent(ctx, {
      resultReleaseDeliveryIntentId: 'intent-1', resultReleasePacketId: 'packet-1',
      resultReleaseApprovalId: 'approval-1', resultAudienceProjectionId: 'projection-1',
      studentRef: 'student-1', audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      jobMode: 'dry_run_only' as ResultDeliveryJobMode, safeJobSummary: 'Test',
    });
    const jobId = jobResult.resourceId!;

    const recResult = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId, studentRef: 'student-1', audienceType: 'student',
      recipientScope: 'student_self', recipientRefHash: 'hash-1',
      recipientDisplayLabel: 'S', relationshipToStudent: 'self',
      resolutionSource: 'system', safeRecipientSummary: 'Test',
    });
    const recipientId = recResult.resourceId!;
    await recipientRepo.updateStatus(recipientId, 'resolved');

    const envResult = await envelopeService.createChannelEnvelope(ctx, {
      resultDeliveryJobId: jobId, resultDeliveryRecipientId: recipientId,
      resultAudienceProjectionId: 'projection-1', audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      safeSubject: 'Subj', safePreview: 'Prev',
    });
    const envelopeId = envResult.resourceId!;
    await envelopeRepo.seal(envelopeId);

    const attemptResult = await dispatchService.createMockAttempt(ctx, {
      resultDeliveryJobId: jobId, resultDeliveryRecipientId: recipientId,
      resultDeliveryChannelEnvelopeId: envelopeId,
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      attemptMode: 'dry_run_only', mockProviderName: 'mp-1',
      safeAttemptSummary: 'Test', attemptNumber: 1,
    });
    attemptId = attemptResult.resourceId!;
    await dispatchService.dispatchMockAttempt(ctx, attemptId);
    await dispatchService.completeMockAttempt(ctx, attemptId);
  });

  it('creates a retry plan with draft status', async () => {
    const ctx = makeCtx();
    const result = await retryPlanService.createRetryPlanForMockFailure(ctx, {
      resultDeliveryJobId: 'job-id',
      resultDeliveryAttemptId: attemptId,
      retryPolicy: 'linear_backoff',
      maxMockAttempts: 3,
      attemptsUsed: 1,
      safeRetrySummary: 'Retry after mock failure',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('retry plan is non-executing (no background job references)', async () => {
    const ctx = makeCtx();
    const result = await retryPlanService.createRetryPlanForMockFailure(ctx, {
      resultDeliveryJobId: 'job-id',
      resultDeliveryAttemptId: attemptId,
      retryPolicy: 'linear_backoff',
      maxMockAttempts: 3,
      attemptsUsed: 1,
      safeRetrySummary: 'Retry plan',
    });
    expect(result.ok).toBe(true);
    if (result.data) {
      const plan = result.data as any;
      expect(plan.nextMockRetryAt).toBeNull();
      expect(plan.retryPolicy).toBe('linear_backoff');
      expect(plan.maxMockAttempts).toBe(3);
      expect(plan.attemptsUsed).toBe(1);
    }
  });

  it('cancels a retry plan', async () => {
    const ctx = makeCtx();
    const created = await retryPlanService.createRetryPlanForMockFailure(ctx, {
      resultDeliveryJobId: 'job-id',
      resultDeliveryAttemptId: attemptId,
      retryPolicy: 'linear_backoff',
      maxMockAttempts: 3,
      attemptsUsed: 1,
      safeRetrySummary: 'Retry',
    });
    const planId = created.resourceId!;
    const cancelled = await retryPlanService.cancelRetryPlan(ctx, planId);
    expect(cancelled.ok).toBe(true);
    expect(cancelled.status).toBe('cancelled');
  });

  it('voids a retry plan', async () => {
    const ctx = makeCtx();
    const created = await retryPlanService.createRetryPlanForMockFailure(ctx, {
      resultDeliveryJobId: 'job-id',
      resultDeliveryAttemptId: attemptId,
      retryPolicy: 'linear_backoff',
      maxMockAttempts: 3,
      attemptsUsed: 1,
      safeRetrySummary: 'Retry',
    });
    const planId = created.resourceId!;
    const voided = await retryPlanService.voidRetryPlan(ctx, planId);
    expect(voided.ok).toBe(true);
    expect(voided.status).toBe('void');
  });

  it('listRetryPlansForJob returns plans', async () => {
    const ctx = makeCtx();
    await retryPlanService.createRetryPlanForMockFailure(ctx, {
      resultDeliveryJobId: 'job-id',
      resultDeliveryAttemptId: attemptId,
      retryPolicy: 'linear_backoff',
      maxMockAttempts: 3,
      attemptsUsed: 1,
      safeRetrySummary: 'Plan 1',
    });
    const list = await retryPlanService.listRetryPlansForJob(ctx, 'job-id');
    expect(list.ok).toBe(true);
    if (list.data) {
      expect(Array.isArray(list.data)).toBe(true);
      expect((list.data as any[]).length).toBeGreaterThanOrEqual(1);
    }
  });
});
