import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionConsentBoundaryService } from '../services/recoveryExecutionConsentBoundaryService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Consent Boundary Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionConsentBoundaryService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionConsentBoundaryService(repos.consentBoundaryCheck, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('consent boundary checks are metadata-only and do NOT contact parents/students', async () => {
    const result = await service.createConsentBoundaryCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'consent_granted',
      safeConsentSummary: 'Metadata-only test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.decision).toBe('consent_granted');
    expect((result.data as any)?.parentNotificationSent).toBeUndefined();
    expect((result.data as any)?.studentNotified).toBeUndefined();
  });

  it('decision field records the boundary check outcome', async () => {
    const result = await service.createConsentBoundaryCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'consent_denied',
      safeConsentSummary: 'Denied test',
    });
    expect(result.data?.decision).toBe('consent_denied');
  });

  it('creates with pending decision', async () => {
    const result = await service.createConsentBoundaryCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'pending_review',
      safeConsentSummary: 'Pending test',
    });
    expect(result.data?.decision).toBe('pending_review');
  });

  it('can block consent boundary check', async () => {
    const created = await service.createConsentBoundaryCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'consent_granted',
      safeConsentSummary: 'Block test',
    });
    const blocked = await service.blockConsentBoundaryCheck(ctx, schoolId, created.data!.consentBoundaryCheckId, ['missing_consent']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('missing_consent');
  });

  it('can void consent boundary check', async () => {
    const created = await service.createConsentBoundaryCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'consent_granted',
      safeConsentSummary: 'Void test',
    });
    const voided = await service.voidConsentBoundaryCheck(ctx, schoolId, created.data!.consentBoundaryCheckId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can list by decision', async () => {
    await service.createConsentBoundaryCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'consent_granted',
      safeConsentSummary: 'List test',
    });
    const decisionList = await service.listConsentBoundaryChecksByDecision(schoolId, 'consent_granted');
    expect(decisionList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct consent boundary check', async () => {
    const created = await service.createConsentBoundaryCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'consent_granted',
      safeConsentSummary: 'Test get',
    });
    const found = await service.getConsentBoundaryCheck(schoolId, created.data!.consentBoundaryCheckId);
    expect(found.success).toBe(true);
    expect(found.data?.safeConsentSummary).toBe('Test get');
  });

  it('can mark review_ready', async () => {
    const created = await service.createConsentBoundaryCheck(ctx, schoolId, {
      studentRef: 'student-1',
      decision: 'consent_granted',
      safeConsentSummary: 'Review test',
    });
    const reviewReady = await service.markConsentBoundaryReviewReady(ctx, schoolId, created.data!.consentBoundaryCheckId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.reviewReadyAt).toBeDefined();
  });
});
