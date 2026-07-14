import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResultDeliveryJobService,
  ResultDeliveryRecipientResolver,
  ResultDeliveryEnvelopeService,
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

describe('Package 12 — Envelope Safety', () => {
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
  let resolver: ResultDeliveryRecipientResolver;
  let envelopeService: ResultDeliveryEnvelopeService;
  let jobId: string;
  let recipientId: string;

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
    resolver = new ResultDeliveryRecipientResolver(recipientRepo, auditBridge, idempotencyService);
    envelopeService = new ResultDeliveryEnvelopeService(envelopeRepo, auditBridge, idempotencyService);

    const ctx = makeCtx();
    const jobResult = await jobService.createDeliveryJobFromIntent(ctx, {
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
    jobId = jobResult.resourceId!;

    const recResult = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      studentRef: 'student-1',
      audienceType: 'student',
      recipientScope: 'student_self',
      recipientRefHash: 'hash-1',
      recipientDisplayLabel: 'Student',
      relationshipToStudent: 'self',
      resolutionSource: 'system',
      safeRecipientSummary: 'Test recipient',
    });
    recipientId = recResult.resourceId!;
    await recipientRepo.updateStatus(recipientId, 'resolved');
  });

  it('creates envelope with draft status', async () => {
    const ctx = makeCtx();
    const result = await envelopeService.createChannelEnvelope(ctx, {
      resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId,
      resultAudienceProjectionId: 'projection-1',
      audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      safeSubject: 'Your Result',
      safePreview: 'Preview text',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('seals envelope — status becomes sealed', async () => {
    const ctx = makeCtx();
    const created = await envelopeService.createChannelEnvelope(ctx, {
      resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId,
      resultAudienceProjectionId: 'projection-1',
      audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      safeSubject: 'Your Result',
      safePreview: 'Preview text',
    });
    const envelopeId = created.resourceId!;
    const sealed = await envelopeService.sealChannelEnvelope(ctx, envelopeId);
    expect(sealed.ok).toBe(true);
    expect(sealed.status).toBe('sealed');
  });

  it('assertEnvelopeIsSafe checks forbidden fields', async () => {
    const ctx = makeCtx();
    const created = await envelopeService.createChannelEnvelope(ctx, {
      resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId,
      resultAudienceProjectionId: 'projection-1',
      audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      safeSubject: 'Your Result',
      safePreview: 'Preview text',
      safeBodyJson: { grade: 'A', comment: 'Good' },
    });
    const envelopeId = created.resourceId!;
    const safeResult = await envelopeService.assertEnvelopeIsSafe(ctx, envelopeId);
    expect(safeResult.ok).toBe(true);
    expect(safeResult.status).toBe('safe');
  });

  it('assertEnvelopeIsSafe detects unsafe fields', async () => {
    const ctx = makeCtx();
    const unsafeResult = await envelopeService.createChannelEnvelope(ctx, {
      resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId,
      resultAudienceProjectionId: 'projection-1',
      audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      safeSubject: 'Your Result',
      safePreview: 'Preview',
      safeBodyJson: { answerKeySafeRef: 'ak-1', grade: 'A' },
    });
    expect(unsafeResult.ok).toBe(false);
    expect(unsafeResult.reasonCode).toBe('FORBIDDEN_FIELDS_IN_BODY');
  });

  it('blocks envelope', async () => {
    const ctx = makeCtx();
    const created = await envelopeService.createChannelEnvelope(ctx, {
      resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId,
      resultAudienceProjectionId: 'projection-1',
      audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      safeSubject: 'Result',
      safePreview: 'Preview',
    });
    const envelopeId = created.resourceId!;
    const blocked = await envelopeService.blockChannelEnvelope(ctx, envelopeId);
    expect(blocked.ok).toBe(true);
    expect(blocked.status).toBe('blocked');
  });

  it('voids envelope', async () => {
    const ctx = makeCtx();
    const created = await envelopeService.createChannelEnvelope(ctx, {
      resultDeliveryJobId: jobId,
      resultDeliveryRecipientId: recipientId,
      resultAudienceProjectionId: 'projection-1',
      audienceType: 'student',
      deliveryChannel: 'student_portal_mock' as ResultDeliveryChannel,
      safeSubject: 'Result',
      safePreview: 'Preview',
    });
    const envelopeId = created.resourceId!;
    const voided = await envelopeService.voidChannelEnvelope(ctx, envelopeId);
    expect(voided.ok).toBe(true);
    expect(voided.status).toBe('void');
  });
});
