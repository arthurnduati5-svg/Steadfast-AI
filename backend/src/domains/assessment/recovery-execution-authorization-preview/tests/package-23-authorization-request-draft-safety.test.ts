import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionAuthorizationRequestService } from '../services/recoveryExecutionAuthorizationRequestService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Authorization Request Draft Safety', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionAuthorizationRequestService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionAuthorizationRequestService(repos.authorizationRequestDraft, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates authorization request draft in draft status', async () => {
    const result = await service.createAuthorizationRequestDraft(ctx, schoolId, {
      studentRef: 'student-1',
      safeRequestSummary: 'Request draft test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.requestStatus).toBe('draft');
  });

  it('cannot mark mock_authorized through request draft (only through dry run)', async () => {
    const created = await service.createAuthorizationRequestDraft(ctx, schoolId, {
      studentRef: 'student-1',
      safeRequestSummary: 'No mock authorization',
    });
    expect(created.data?.requestStatus).not.toMatch(/mock_authorized/);
    expect(created.data?.requestStatus).not.toMatch(/mock_denied/);
  });

  it('transitions from draft to review_ready to authorization_preview_ready', async () => {
    const created = await service.createAuthorizationRequestDraft(ctx, schoolId, {
      studentRef: 'student-1',
      safeRequestSummary: 'Lifecycle test',
    });
    expect(created.data?.requestStatus).toBe('draft');

    const reviewReady = await service.markAuthorizationRequestReviewReady(ctx, schoolId, created.data!.authorizationRequestDraftId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.requestStatus).toBe('review_ready');

    const previewReady = await service.markAuthorizationRequestPreviewReady(ctx, schoolId, created.data!.authorizationRequestDraftId);
    expect(previewReady.success).toBe(true);
    expect(previewReady.data?.requestStatus).toBe('authorization_preview_ready');
  });

  it('can block and void request', async () => {
    const created = await service.createAuthorizationRequestDraft(ctx, schoolId, {
      studentRef: 'student-1',
      safeRequestSummary: 'Block void test',
    });
    const blocked = await service.blockAuthorizationRequest(ctx, schoolId, created.data!.authorizationRequestDraftId, ['missing_data']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('missing_data');

    const voided = await service.voidAuthorizationRequest(ctx, schoolId, created.data!.authorizationRequestDraftId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('can suppress request', async () => {
    const created = await service.createAuthorizationRequestDraft(ctx, schoolId, {
      studentRef: 'student-1',
      safeRequestSummary: 'Suppress test',
    });
    const suppressed = await service.suppressAuthorizationRequest(ctx, schoolId, created.data!.authorizationRequestDraftId);
    expect(suppressed.data?.suppressedAt).toBeDefined();
  });

  it('can list by school, student, plan, and status', async () => {
    await service.createAuthorizationRequestDraft(ctx, schoolId, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeRequestSummary: 'List test',
    });
    const schoolList = await service.listAuthorizationRequestDraftsForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listAuthorizationRequestDraftsForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listAuthorizationRequestDraftsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const statusList = await service.listAuthorizationRequestDraftsByStatus(schoolId, 'draft');
    expect(statusList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('get returns the correct request draft', async () => {
    const created = await service.createAuthorizationRequestDraft(ctx, schoolId, {
      studentRef: 'student-1',
      safeRequestSummary: 'Test get',
    });
    const found = await service.getAuthorizationRequestDraft(schoolId, created.data!.authorizationRequestDraftId);
    expect(found.success).toBe(true);
    expect(found.data?.safeRequestSummary).toBe('Test get');
  });
});
