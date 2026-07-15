import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryOutcomeDecisionSummaryService } from '../services/recoveryOutcomeDecisionSummaryService';
import { RecoveryOutcomeSafetyService } from '../services/recoveryOutcomeSafetyService';
import { RecoveryOutcomeAuditBridge } from '../services/recoveryOutcomeAuditBridge';
import { RecoveryOutcomeIdempotencyService } from '../services/recoveryOutcomeIdempotencyService';
import { InMemoryRecoveryOutcomeDecisionSummaryRepository, InMemoryRecoveryOutcomeAuditRepository, InMemoryRecoveryOutcomeIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeRepositories';
import type { RecoveryOutcomeCommandContext } from '../contracts/recoveryOutcomeContracts';

function makeCtx(overrides?: Partial<RecoveryOutcomeCommandContext>): RecoveryOutcomeCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    ...overrides,
  };
}

function makeSummaryInput() {
  return {
    schoolId: 'school-1',
    studentRef: 'student-1',
    teacherRef: 'teacher-1',
    resultRecoveryPlanId: 'plan-1',
    safeSummary: 'Outcome decision summary for student-1',
    decisionCountsJson: { total: 3, continuation: 1, closure: 1, pause: 1 },
    topDecisionsJson: { primary: 'continuation' },
    sourceRefsJson: { progressSummaryId: 'psum-1', evidenceRollupId: 'eroll-1' },
  };
}

describe('Package 19 — Outcome Decision Summary Read Model', () => {
  let summaryRepo: InMemoryRecoveryOutcomeDecisionSummaryRepository;
  let safetyService: RecoveryOutcomeSafetyService;
  let auditRepo: InMemoryRecoveryOutcomeAuditRepository;
  let auditBridge: RecoveryOutcomeAuditBridge;
  let idempotencyRepo: InMemoryRecoveryOutcomeIdempotencyRepository;
  let idempotencyService: RecoveryOutcomeIdempotencyService;
  let service: RecoveryOutcomeDecisionSummaryService;

  beforeEach(() => {
    summaryRepo = new InMemoryRecoveryOutcomeDecisionSummaryRepository();
    safetyService = new RecoveryOutcomeSafetyService();
    auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
    auditBridge = new RecoveryOutcomeAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();
    idempotencyService = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
    service = new RecoveryOutcomeDecisionSummaryService(summaryRepo, safetyService, auditBridge, idempotencyService);
  });

  it('creates summary via service', async () => {
    const result = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('SUMMARY_CREATED');
  });

  it('get summary by ID', async () => {
    const created = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    const fetched = await service.getOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('get returns not_found for missing summary', async () => {
    const result = await service.getOutcomeDecisionSummary(makeCtx(), 'missing-id');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('list by school', async () => {
    await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    const list = await service.listSummariesForSchool(makeCtx());
    expect(list.ok).toBe(true);
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by student', async () => {
    await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    const list = await service.listSummariesForStudent(makeCtx(), 'student-1');
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by plan', async () => {
    await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    const list = await service.listSummariesForPlan(makeCtx(), 'plan-1');
    expect((list.data as any[]).length).toBe(1);
  });

  it('list by student returns empty for non-matching', async () => {
    await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    const list = await service.listSummariesForStudent(makeCtx(), 'other-student');
    expect((list.data as any[]).length).toBe(0);
  });

  it('mark as stale', async () => {
    const created = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    const result = await service.markOutcomeDecisionSummaryStale(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('stale');
  });

  it('refresh from stale', async () => {
    const created = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    await service.markOutcomeDecisionSummaryStale(makeCtx(), created.resourceId!);
    const result = await service.refreshOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
  });

  it('block summary', async () => {
    const created = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    const result = await service.blockOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('void summary', async () => {
    const created = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    const result = await service.voidOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('cannot refresh voided summary', async () => {
    const created = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    await service.voidOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    const result = await service.refreshOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('cannot mark stale voided summary', async () => {
    const created = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    await service.voidOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    const result = await service.markOutcomeDecisionSummaryStale(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('cannot void already voided summary', async () => {
    const created = await service.createOutcomeDecisionSummary(makeCtx(), makeSummaryInput());
    await service.voidOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    const result = await service.voidOutcomeDecisionSummary(makeCtx(), created.resourceId!);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_STATUS');
  });

  it('summary is read-only (does not mutate other records)', async () => {
    const beforeAuditCount = (await auditRepo.listBySchool('school-1')).length;
    const result = await service.createOutcomeDecisionSummary(makeCtx({ idempotencyKey: 'idem-readonly' }), makeSummaryInput());
    expect(result.ok).toBe(true);
    const afterAuditCount = (await auditRepo.listBySchool('school-1')).length;
    expect(afterAuditCount).toBe(beforeAuditCount + 1);
  });

  it('student role blocked from creating summary', async () => {
    const result = await service.createOutcomeDecisionSummary(makeCtx({ actorRole: 'student' }), makeSummaryInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('ROLE_BLOCKED');
  });

  it('missing schoolId blocks summary creation', async () => {
    const result = await service.createOutcomeDecisionSummary(makeCtx({ schoolId: '' } as any), makeSummaryInput());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('summary data includes decision counts', async () => {
    const result = await service.createOutcomeDecisionSummary(makeCtx({ idempotencyKey: 'idem-counts' }), makeSummaryInput());
    const data = result.data as any;
    expect(data.decisionCountsJson).toEqual({ total: 3, continuation: 1, closure: 1, pause: 1 });
    expect(data.topDecisionsJson).toEqual({ primary: 'continuation' });
  });

  it('missing sourceRefs blocks summary creation', async () => {
    const input = { ...makeSummaryInput(), sourceRefsJson: {} };
    const result = await service.createOutcomeDecisionSummary(makeCtx(), input);
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SOURCE_REFS_MISSING');
  });
});
