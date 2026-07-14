import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResultDeliveryJobService,
  ResultDeliveryRecipientResolver,
  ResultDeliveryAuditBridge,
  ResultDeliveryIdempotencyService,
  ResultDeliveryEnvelopeService,
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

describe('Package 12 — Recipient Boundary Resolution', () => {
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

  async function createJob(ctx: ResultDeliveryCommandContext): Promise<string> {
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
    return result.resourceId!;
  }

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
    resolver = new ResultDeliveryRecipientResolver(recipientRepo, auditBridge, idempotencyService);
  });

  it('creates a delivery job and resolves recipient for student_self', async () => {
    const ctx = makeCtx();
    const jobId = await createJob(ctx);
    const result = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      studentRef: 'student-1',
      audienceType: 'student',
      recipientScope: 'student_self',
      recipientRefHash: 'hash-student-email',
      recipientDisplayLabel: 'Student Self',
      relationshipToStudent: 'self',
      resolutionSource: 'system',
      safeRecipientSummary: 'Student self recipient',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('recipient stores hash not raw email — checks recipientRefHash exists', async () => {
    const ctx = makeCtx();
    const jobId = await createJob(ctx);
    const result = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      studentRef: 'student-1',
      audienceType: 'student',
      recipientScope: 'student_self',
      recipientRefHash: 'sha256-abc123',
      recipientDisplayLabel: 'Student',
      relationshipToStudent: 'self',
      resolutionSource: 'system',
      safeRecipientSummary: 'Test',
    });
    expect(result.ok).toBe(true);
    if (result.data) {
      const rec = result.data as any;
      expect(rec.recipientRefHash).toBe('sha256-abc123');
      expect(rec.recipientRefHash).not.toContain('@');
    }
  });

  it('verifies recipient boundary with verify()', async () => {
    const ctx = makeCtx();
    const jobId = await createJob(ctx);
    const resolved = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      studentRef: 'student-1',
      audienceType: 'student',
      recipientScope: 'student_self',
      recipientRefHash: 'hash-1',
      recipientDisplayLabel: 'Student',
      relationshipToStudent: 'self',
      resolutionSource: 'system',
      safeRecipientSummary: 'Test',
    });
    const recipientId = resolved.resourceId!;

    const repoRec = await recipientRepo.getById(recipientId);
    expect(repoRec!.recipientStatus).toBe('draft');

    await recipientRepo.updateStatus(recipientId, 'resolved');
    const verified = await resolver.verifyRecipientBoundary(ctx, recipientId);
    expect(verified.ok).toBe(true);
    expect(verified.status).toBe('verified');
  });

  it('blocks recipient', async () => {
    const ctx = makeCtx();
    const jobId = await createJob(ctx);
    const resolved = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      studentRef: 'student-1',
      audienceType: 'student',
      recipientScope: 'student_self',
      recipientRefHash: 'hash-1',
      recipientDisplayLabel: 'Student',
      relationshipToStudent: 'self',
      resolutionSource: 'system',
      safeRecipientSummary: 'Test',
    });
    const recipientId = resolved.resourceId!;
    const blocked = await resolver.blockRecipient(ctx, recipientId);
    expect(blocked.ok).toBe(true);
    expect(blocked.status).toBe('blocked');
  });

  it('voids recipient', async () => {
    const ctx = makeCtx();
    const jobId = await createJob(ctx);
    const resolved = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      studentRef: 'student-1',
      audienceType: 'student',
      recipientScope: 'student_self',
      recipientRefHash: 'hash-1',
      recipientDisplayLabel: 'Student',
      relationshipToStudent: 'self',
      resolutionSource: 'system',
      safeRecipientSummary: 'Test',
    });
    const recipientId = resolved.resourceId!;
    const voided = await resolver.voidRecipient(ctx, recipientId);
    expect(voided.ok).toBe(true);
    expect(voided.status).toBe('void');
  });

  it('missing schoolId blocks recipient resolution', async () => {
    const ctx = makeCtx({ schoolId: '' });
    const result = await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: 'job-1',
      studentRef: 'student-1',
      audienceType: 'student',
      recipientScope: 'student_self',
      recipientRefHash: 'hash-1',
      recipientDisplayLabel: 'Student',
      relationshipToStudent: 'self',
      resolutionSource: 'system',
      safeRecipientSummary: 'Test',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('listRecipientsForJob returns recipients', async () => {
    const ctx = makeCtx();
    const jobId = await createJob(ctx);
    await resolver.resolveRecipientForDeliveryJob(ctx, {
      resultDeliveryJobId: jobId,
      studentRef: 'student-1',
      audienceType: 'student',
      recipientScope: 'student_self',
      recipientRefHash: 'hash-1',
      recipientDisplayLabel: 'Student',
      relationshipToStudent: 'self',
      resolutionSource: 'system',
      safeRecipientSummary: 'Test',
    });
    const list = await resolver.listRecipientsForJob(ctx, jobId);
    expect(list.ok).toBe(true);
    if (list.data) {
      expect(Array.isArray(list.data)).toBe(true);
      expect((list.data as any[]).length).toBe(1);
    }
  });
});
