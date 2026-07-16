import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseTriageSummaryRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseTriageSummaryService } from '../services/recoveryCaseTriageSummaryService';
import { RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Triage Summary Read Model', () => {
  let repo: InMemoryRecoveryCaseTriageSummaryRepository;
  let service: RecoveryCaseTriageSummaryService;

  const schoolA = 'school-alpha';
  const schoolB = 'school-beta';

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: schoolA,
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-sum-1',
    idempotencyKey: 'ik-sum-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseTriageSummaryRepository();
    service = new RecoveryCaseTriageSummaryService(repo);
  });

  it('creates triage summary', async () => {
    const result = await service.createTriageSummary(ctx, schoolA, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      totalScore: 85,
      priorityBand: 'critical_review',
      riskRank: 'high',
      readinessSummary: 'Ready for review',
      fairnessSummary: 'All checks passed',
      capacitySummary: 'Available slots: 5',
      queueSummary: 'Queue position: 1',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.triageSummaryStatus).toBe('draft');
    expect(result.data!.totalScore).toBe(85);
    expect(result.data!.priorityBand).toBe('critical_review');
  });

  it('lists by school', async () => {
    await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1', resultRecoveryPlanId: 'plan-1', totalScore: 50, priorityBand: 'normal', riskRank: 'medium',
    });
    await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-2', resultRecoveryPlanId: 'plan-2', totalScore: 80, priorityBand: 'critical_review', riskRank: 'high',
    });
    const list = await service.listTriageSummariesForSchool(schoolA);
    expect(list.data).toHaveLength(2);
  });

  it('lists by student', async () => {
    await service.createTriageSummary(ctx, schoolA, {
      studentRef: 'student-A', resultRecoveryPlanId: 'plan-1', totalScore: 50, priorityBand: 'normal', riskRank: 'medium',
    });
    const list = await service.listTriageSummariesForStudent(schoolA, 'student-A');
    expect(list.data).toHaveLength(1);
  });

  it('lists by plan', async () => {
    await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1', resultRecoveryPlanId: 'plan-search', totalScore: 60, priorityBand: 'high', riskRank: 'high',
    });
    const list = await service.listTriageSummariesForPlan(schoolA, 'plan-search');
    expect(list.data).toHaveLength(1);
  });

  it('refreshes summary', async () => {
    const created = await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1', resultRecoveryPlanId: 'plan-1', totalScore: 40, priorityBand: 'normal', riskRank: 'low',
    });
    const refreshed = await service.refreshTriageSummary(ctx, schoolA, created.data!.triageSummaryId);
    expect(refreshed.success).toBe(true);
    expect(refreshed.status).toBe('refreshed');
  });

  it('marks review ready', async () => {
    const created = await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1', resultRecoveryPlanId: 'plan-1', totalScore: 70, priorityBand: 'high', riskRank: 'high',
    });
    const updated = await service.markTriageSummaryReviewReady(ctx, schoolA, created.data!.triageSummaryId);
    expect(updated.data!.triageSummaryStatus).toBe('review_ready');
  });

  it('marks stale', async () => {
    const created = await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1', resultRecoveryPlanId: 'plan-1', totalScore: 30, priorityBand: 'low', riskRank: 'low',
    });
    const updated = await service.markTriageSummaryStale(ctx, schoolA, created.data!.triageSummaryId);
    expect(updated.data!.triageSummaryStatus).toBe('stale');
  });

  it('blocks summary', async () => {
    const created = await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1', resultRecoveryPlanId: 'plan-1', totalScore: 0, priorityBand: 'deferred', riskRank: 'none',
    });
    const updated = await service.blockTriageSummary(ctx, schoolA, created.data!.triageSummaryId, 'BLOCK_REASON', 'Blocked');
    expect(updated.data!.triageSummaryStatus).toBe('blocked');
  });

  it('voids summary', async () => {
    const created = await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1', resultRecoveryPlanId: 'plan-1', totalScore: 20, priorityBand: 'low', riskRank: 'low',
    });
    const updated = await service.voidTriageSummary(ctx, schoolA, created.data!.triageSummaryId, 'VOID_REASON', 'Voided');
    expect(updated.data!.triageSummaryStatus).toBe('void');
  });

  it('summary contains counts (priority bands, risks, blockers, capacity)', async () => {
    const result = await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1',
      resultRecoveryPlanId: 'plan-1',
      totalScore: 92,
      priorityBand: 'critical_review',
      riskRank: 'critical',
      readinessSummary: 'Ready | Priority: critical_review | Risk: critical',
      fairnessSummary: 'Status: allowed | Factors checked: 3',
      capacitySummary: 'Available: 10 | Total: 20 | Used: 10',
      queueSummary: 'Items queued: 1 | Exceeded: 0',
      summaryDetailsJson: {
        bandCounts: { critical_review: 1, high: 0, normal: 2, low: 1, deferred: 0 },
        riskCounts: { critical: 1, high: 1, medium: 1, low: 1, none: 0 },
        blockedItems: [],
        capacityUtilization: 0.5,
      },
    });
    expect(result.data!.readinessSummary).toContain('critical_review');
    expect(result.data!.fairnessSummary).toContain('allowed');
    expect(result.data!.capacitySummary).toContain('Available: 10');
    expect(result.data!.queueSummary).toContain('1');
  });

  it('enforces school isolation', async () => {
    await service.createTriageSummary(ctx, schoolA, {
      studentRef: 's-1', resultRecoveryPlanId: 'plan-1', totalScore: 50, priorityBand: 'normal', riskRank: 'medium',
    });
    const listB = await service.listTriageSummariesForSchool(schoolB);
    expect(listB.data).toHaveLength(0);
  });
});
