import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionAuthorizationSummaryService } from '../services/recoveryExecutionAuthorizationSummaryService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Authorization Summary Read Model', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionAuthorizationSummaryService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionAuthorizationSummaryService(repos.authorizationSummary, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('authorization summary is a read model only (cannot execute actions)', async () => {
    const result = await service.createAuthorizationSummary(ctx, schoolId, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Read model test',
      authorizationOverviewJson: { phases: ['readiness', 'eligibility'] },
      readinessSummaryJson: { status: 'draft' },
      dryRunSummaryJson: { decision: 'mock_authorized' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.summaryStatus).toBe('draft');
    expect(result.data?.authorizationOverviewJson).toBeDefined();
    expect(result.data?.readinessSummaryJson).toBeDefined();
  });

  it('can create and get summary', async () => {
    const created = await service.createAuthorizationSummary(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Create and get test',
    });
    const found = await service.getAuthorizationSummary(schoolId, created.data!.authorizationSummaryId);
    expect(found.success).toBe(true);
    expect(found.data?.safeSummary).toBe('Create and get test');
  });

  it('can list by school, student, plan', async () => {
    await service.createAuthorizationSummary(ctx, schoolId, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'List test',
    });
    const schoolList = await service.listAuthorizationSummariesForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listAuthorizationSummariesForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listAuthorizationSummariesForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('can refresh', async () => {
    const created = await service.createAuthorizationSummary(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Refresh test',
    });
    const refreshed = await service.refreshAuthorizationSummary(ctx, schoolId, created.data!.authorizationSummaryId);
    expect(refreshed.success).toBe(true);
    expect(refreshed.data?.refreshedAt).toBeDefined();
  });

  it('can mark stale', async () => {
    const created = await service.createAuthorizationSummary(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Stale test',
    });
    const stale = await service.markAuthorizationSummaryStale(ctx, schoolId, created.data!.authorizationSummaryId);
    expect(stale.success).toBe(true);
    expect(stale.data?.staleAt).toBeDefined();
  });

  it('can mark review_ready', async () => {
    const created = await service.createAuthorizationSummary(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Review test',
    });
    const reviewReady = await service.markAuthorizationSummaryReviewReady(ctx, schoolId, created.data!.authorizationSummaryId);
    expect(reviewReady.data?.summaryStatus).toBe('review_ready');
  });

  it('can block and void summary', async () => {
    const created = await service.createAuthorizationSummary(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Block void test',
    });
    const blocked = await service.blockAuthorizationSummary(ctx, schoolId, created.data!.authorizationSummaryId, ['outdated']);
    expect(blocked.success).toBe(true);
    expect(blocked.data?.blockedReasonCodesJson).toContain('outdated');

    const voided = await service.voidAuthorizationSummary(ctx, schoolId, created.data!.authorizationSummaryId);
    expect(voided.data?.voidedAt).toBeDefined();
  });

  it('summary does not reference live execution state', async () => {
    const result = await service.createAuthorizationSummary(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'No live ref test',
      authorizationOverviewJson: { type: 'preview' },
    });
    expect(result.success).toBe(true);
    const serialized = JSON.stringify(result.data);
    expect(serialized).not.toContain('liveExecution');
    expect(serialized).not.toContain('liveClosure');
  });
});
