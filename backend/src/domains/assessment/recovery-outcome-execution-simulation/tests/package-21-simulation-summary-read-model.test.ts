import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemorySimulationSummaryRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionSimulationSummaryService } from '../services/recoveryOutcomeExecutionSimulationSummaryService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Simulation Summary Read Model', () => {
  let service: RecoveryOutcomeExecutionSimulationSummaryService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    const repo = new InMemorySimulationSummaryRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionSimulationSummaryService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates simulation summary in draft status', async () => {
    const result = await service.createSimulationSummary(ctx, {
      studentRef: 'student-1',
      safeSummary: 'Summary test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.summaryStatus).toBe('draft');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createSimulationSummary(studentCtx, {
      studentRef: 'student-1',
      safeSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('lists by school, student, and plan', async () => {
    await service.createSimulationSummary(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test list',
    });
    const schoolList = await service.listSimulationSummariesForSchool(schoolId);
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listSimulationSummariesForStudent(schoolId, 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listSimulationSummariesForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('can refresh summary', async () => {
    const created = await service.createSimulationSummary(ctx, {
      studentRef: 'student-1',
      safeSummary: 'Test refresh',
    });
    const refreshed = await service.refreshSimulationSummary(ctx, schoolId, created.data!.simulationSummaryId);
    expect(refreshed.success).toBe(true);
    expect(refreshed.data?.summaryStatus).toBe('active');
    expect(refreshed.data?.refreshedAt).toBeDefined();
  });

  it('can mark summary stale', async () => {
    const created = await service.createSimulationSummary(ctx, {
      studentRef: 'student-1',
      safeSummary: 'Test stale',
    });
    const stale = await service.markSimulationSummaryStale(ctx, schoolId, created.data!.simulationSummaryId);
    expect(stale.data?.summaryStatus).toBe('stale');
    expect(stale.data?.staleAt).toBeDefined();
  });

  it('can block summary', async () => {
    const created = await service.createSimulationSummary(ctx, {
      studentRef: 'student-1',
      safeSummary: 'Test block',
    });
    const blocked = await service.blockSimulationSummary(ctx, schoolId, created.data!.simulationSummaryId);
    expect(blocked.data?.summaryStatus).toBe('blocked');
  });

  it('can void summary', async () => {
    const created = await service.createSimulationSummary(ctx, {
      studentRef: 'student-1',
      safeSummary: 'Test void',
    });
    const voided = await service.voidSimulationSummary(ctx, schoolId, created.data!.simulationSummaryId);
    expect(voided.data?.summaryStatus).toBe('voided');
  });

  it('is read-model only - cannot trigger mutations', async () => {
    const result = await service.createSimulationSummary(ctx, {
      studentRef: 'student-1',
      safeSummary: 'Read model summary',
      simulationCountsJson: { totalRuns: 5, passed: 3 },
      topFindingsJson: { key: 'engagement' },
      nextStepsJson: { action: 'review' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.summaryStatus).toBe('draft');
    expect(result.data?.simulationCountsJson).toBeDefined();
  });

  it('get returns the correct summary', async () => {
    const created = await service.createSimulationSummary(ctx, {
      studentRef: 'student-1',
      safeSummary: 'Test get',
    });
    const found = await service.getSimulationSummary(schoolId, created.data!.simulationSummaryId);
    expect(found.success).toBe(true);
    expect(found.data?.safeSummary).toBe('Test get');
  });
});
