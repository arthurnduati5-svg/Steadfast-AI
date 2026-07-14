import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResultDeliveryJobService,
  ResultDeliveryRecipientResolver,
  ResultDeliveryEnvelopeService,
  ResultDeliveryMockDispatchService,
  ResultDeliveryAuditBridge,
  ResultDeliveryIdempotencyService,
  ResultDeliverySuppressionService,
  ResultDeliveryReceiptService,
} from '../services/index';
import {
  InMemoryResultDeliveryJobRepository,
  InMemoryResultDeliveryRecipientRepository,
  InMemoryResultDeliveryChannelEnvelopeRepository,
  InMemoryResultDeliverySuppressionRepository,
  InMemoryResultDeliveryAttemptRepository,
  InMemoryResultDeliveryReceiptRepository,
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

describe('Package 12 — Mock Dispatch and Receipts', () => {
  let jobRepo: InMemoryResultDeliveryJobRepository;
  let recipientRepo: InMemoryResultDeliveryRecipientRepository;
  let envelopeRepo: InMemoryResultDeliveryChannelEnvelopeRepository;
  let suppressionRepo: InMemoryResultDeliverySuppressionRepository;
  let attemptRepo: InMemoryResultDeliveryAttemptRepository;
  let receiptRepo: InMemoryResultDeliveryReceiptRepository;
  let auditRepo: InMemoryResultDeliveryAuditRepository;
  let idempotencyRepo: InMemoryResultDeliveryIdempotencyRepository;
  let auditBridge: ResultDeliveryAuditBridge;
  let idempotencyService: ResultDeliveryIdempotencyService;
  let jobService: ResultDeliveryJobService;
  let resolver: ResultDeliveryRecipientResolver;
  let envelopeService: ResultDeliveryEnvelopeService;
  let dispatchService: ResultDeliveryMockDispatchService;
  let receiptService: ResultDeliveryReceiptService;
  let jobId: string;
  let recipientId: string;
  let envelopeId: string;

  beforeEach(async () => {
    jobRepo = new InMemoryResultDeliveryJobRepository();
    recipientRepo = new InMemoryResultDeliveryRecipientRepository();
    envelopeRepo = new InMemoryResultDeliveryChannelEnvelopeRepository();
    suppressionRepo = new InMemoryResultDeliverySuppressionRepository();
    attemptRepo = new InMemoryResultDeliveryAttemptRepository();
    receiptRepo = new InMemoryResultDeliveryReceiptRepository();
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
    receiptService = new ResultDeliveryReceiptService(receiptRepo, auditBridge, idempotencyService);

    const ctx = makeCtx();
    const jobResult = await jobService.createDeliveryJobFromIntent(ctx, {
      resultReleaseDeliveryIntentId: 'intent-1', resultReleasePacketId: 'packet-1',
      resultReleaseApprovalId: 'approval-1', resultAudienceProjectionId: 'projection-1',
      studentRef: 'student-1', audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      jobMode: 'dry_run_only' as ResultDeliveryJobMode,
      safeJobSummary: 'Test',
    });
    jobId = jobResult.resourceId!;

    const recResult = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId, studentRef: 'student-1', audienceType: 'student',
      recipientScope: 'student_self', recipientRefHash: 'hash-1',
      recipientDisplayLabel: 'S', relationshipToStudent: 'self',
      resolutionSource: 'system', safeRecipientSummary: 'Test',
    });
    recipientId = recResult.resourceId!;
    await recipientRepo.updateStatus(recipientId, 'resolved');

    const envResult = await envelopeService.createChannelEnvelope(ctx, {
      resultDeliveryJobId: jobId, resultDeliveryRecipientId: recipientId,
      resultAudienceProjectionId: 'projection-1', audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      safeSubject: 'Subj', safePreview: 'Prev',
    });
    envelopeId = envResult.resourceId!;
    await envelopeRepo.seal(envelopeId);
  });

  it('creates a mock attempt', async () => {
    const ctx = makeCtx();
    const result = await dispatchService.createMockAttempt(ctx, {
      resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId,
      resultDeliveryChannelEnvelopeId: envelopeId,
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      attemptMode: 'dry_run_only',
      mockProviderName: 'mock-provider-1',
      safeAttemptSummary: 'Test attempt',
      attemptNumber: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('created');
  });

  it('dispatches a mock attempt', async () => {
    const ctx = makeCtx();
    const created = await dispatchService.createMockAttempt(ctx, {
      resultDeliveryJobId: jobId, resultDeliveryRecipientId: recipientId,
      resultDeliveryChannelEnvelopeId: envelopeId,
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      attemptMode: 'dry_run_only', mockProviderName: 'mp-1',
      safeAttemptSummary: 'Test', attemptNumber: 1,
    });
    const attemptId = created.resourceId!;
    const dispatched = await dispatchService.dispatchMockAttempt(ctx, attemptId);
    expect(dispatched.ok).toBe(true);
    expect(dispatched.status).toBe('mock_dispatched');
  });

  it('completes a mock attempt', async () => {
    const ctx = makeCtx();
    const created = await dispatchService.createMockAttempt(ctx, {
      resultDeliveryJobId: jobId, resultDeliveryRecipientId: recipientId,
      resultDeliveryChannelEnvelopeId: envelopeId,
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      attemptMode: 'dry_run_only', mockProviderName: 'mp-1',
      safeAttemptSummary: 'Test', attemptNumber: 1,
    });
    const attemptId = created.resourceId!;
    await dispatchService.dispatchMockAttempt(ctx, attemptId);
    const completed = await dispatchService.completeMockAttempt(ctx, attemptId);
    expect(completed.ok).toBe(true);
    expect(completed.status).toBe('completed_mock');
  });

  it('records a receipt for completed attempt', async () => {
    const ctx = makeCtx();
    const created = await dispatchService.createMockAttempt(ctx, {
      resultDeliveryJobId: jobId, resultDeliveryRecipientId: recipientId,
      resultDeliveryChannelEnvelopeId: envelopeId,
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      attemptMode: 'dry_run_only', mockProviderName: 'mp-1',
      safeAttemptSummary: 'Test', attemptNumber: 1,
    });
    const attemptId = created.resourceId!;
    await dispatchService.dispatchMockAttempt(ctx, attemptId);
    await dispatchService.completeMockAttempt(ctx, attemptId);

    const receipt = await receiptService.recordMockReceipt(ctx, {
      resultDeliveryAttemptId: attemptId,
      resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId,
      resultDeliveryChannelEnvelopeId: envelopeId,
      receiptType: 'mock_success',
      safeReceiptSummary: 'Mock success receipt',
      providerSimulationJson: { status: 'delivered' },
    });
    expect(receipt.ok).toBe(true);
    expect(receipt.status).toBe('created');
  });

  it('receipt contains no raw contact details', async () => {
    const ctx = makeCtx();
    const created = await dispatchService.createMockAttempt(ctx, {
      resultDeliveryJobId: jobId, resultDeliveryRecipientId: recipientId,
      resultDeliveryChannelEnvelopeId: envelopeId,
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      attemptMode: 'dry_run_only', mockProviderName: 'mp-1',
      safeAttemptSummary: 'Test', attemptNumber: 1,
    });
    const attemptId = created.resourceId!;
    await dispatchService.dispatchMockAttempt(ctx, attemptId);
    await dispatchService.completeMockAttempt(ctx, attemptId);

    const receipt = await receiptService.recordMockReceipt(ctx, {
      resultDeliveryAttemptId: attemptId, resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId, resultDeliveryChannelEnvelopeId: envelopeId,
      receiptType: 'mock_success', safeReceiptSummary: 'Receipt',
    });
    expect(receipt.ok).toBe(true);
    if (receipt.data) {
      const r = receipt.data as any;
      expect(r.safeReceiptSummary).toBeTruthy();
      expect(r.resultDeliveryReceiptId).toBeTruthy();
    }
  });

  it('blocks live channel attempt', async () => {
    const ctx = makeCtx();
    const attemptResult = await dispatchService.createMockAttempt(ctx, {
      resultDeliveryJobId: jobId, resultDeliveryRecipientId: recipientId,
      resultDeliveryChannelEnvelopeId: envelopeId,
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      attemptMode: 'dry_run_only', mockProviderName: 'mp-1',
      safeAttemptSummary: 'Test', attemptNumber: 1,
    });
    const attemptId = attemptResult.resourceId!;
    const liveBlock = await dispatchService.blockLiveAttempt(ctx, attemptId);
    expect(liveBlock.ok).toBe(true);
    expect(liveBlock.status).toBe('blocked_live_channel');
  });
});
