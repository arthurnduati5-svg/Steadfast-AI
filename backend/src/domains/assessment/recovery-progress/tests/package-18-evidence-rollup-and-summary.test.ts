import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryProgressSafetyService } from '../services/recoveryProgressSafetyService';
import { RecoveryProgressIdempotencyService } from '../services/recoveryProgressIdempotencyService';
import { RecoveryProgressAuditBridge } from '../services/recoveryProgressAuditBridge';
import { RecoveryEvidenceRollupService } from '../services/recoveryEvidenceRollupService';
import { RecoveryProgressSummaryService } from '../services/recoveryProgressSummaryService';
import {
  InMemoryRecoveryEvidenceRollupRepository,
  InMemoryRecoveryProgressSummaryRepository,
} from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressAuditRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import { InMemoryRecoveryProgressIdempotencyRepository } from '../repositories/inMemoryRecoveryProgressRepositories';
import type { RecoveryProgressCommandContext } from '../contracts/recoveryProgressContracts';

function makeCtx(overrides?: Partial<RecoveryProgressCommandContext>): RecoveryProgressCommandContext {
  return { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'idem-1', ...overrides };
}

describe('Package 18 — Evidence Rollup Lifecycle', () => {
  let rollupRepo: InMemoryRecoveryEvidenceRollupRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryEvidenceRollupService;

  beforeEach(() => {
    rollupRepo = new InMemoryRecoveryEvidenceRollupRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryEvidenceRollupService(rollupRepo, safetyService, auditBridge, idempotencyService);
  });

  const makeInput = () => ({
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    rollupScope: 'student',
    safeRollupSummary: 'Evidence summary for student',
    observationCountsJson: { total: 5 },
    evaluationCountsJson: { total: 3 },
    evidenceCountsJson: { total: 2 },
    adjustmentCountsJson: { total: 1 },
    sourceRefsJson: { obsRefs: ['obs-1'] },
    blockedReasonCodesJson: [],
  });

  it('creates rollup with draft status', async () => {
    const result = await service.createRollup(makeCtx(), makeInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('ROLLUP_CREATED');
  });

  it('getRollup returns created rollup', async () => {
    const created = await service.createRollup(makeCtx(), makeInput() as any);
    const fetched = await service.getRollup(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getRollup returns not_found for missing id', async () => {
    const result = await service.getRollup(makeCtx(), 'missing');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listRollupsForSchool returns filtered', async () => {
    await service.createRollup(makeCtx(), makeInput() as any);
    const result = await service.listRollupsForSchool(makeCtx());
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listRollupsForStudent returns filtered', async () => {
    await service.createRollup(makeCtx(), makeInput() as any);
    const result = await service.listRollupsForStudent(makeCtx(), 'student-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listRollupsForPlan returns filtered', async () => {
    await service.createRollup(makeCtx(), makeInput() as any);
    const result = await service.listRollupsForPlan(makeCtx(), 'plan-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listRollupsByScope returns filtered', async () => {
    await service.createRollup(makeCtx(), makeInput() as any);
    const result = await service.listRollupsByScope(makeCtx(), 'student');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('rollup can be refreshed', async () => {
    const created = await service.createRollup(makeCtx(), makeInput() as any);
    const result = await service.refreshRollup(makeCtx(), created.resourceId!, 'ROLLUP_REFRESHED', 'Refreshed');
    expect(result.ok).toBe(true);
    expect(result.reasonCode).toBe('ROLLUP_REFRESHED');
  });

  it('rollup can be suppressed', async () => {
    const created = await service.createRollup(makeCtx(), makeInput() as any);
    const result = await service.suppressRollup(makeCtx(), created.resourceId!, 'ROLLUP_SUPPRESSED', 'Suppressed');
    expect(result.status).toBe('suppressed');
  });

  it('rollup can be blocked', async () => {
    const created = await service.createRollup(makeCtx(), makeInput() as any);
    const result = await service.blockRollup(makeCtx(), created.resourceId!, 'ROLLUP_BLOCKED', 'Blocked');
    expect(result.status).toBe('blocked');
  });

  it('rollup can be voided', async () => {
    const created = await service.createRollup(makeCtx(), makeInput() as any);
    const result = await service.voidRollup(makeCtx(), created.resourceId!, 'ROLLUP_VOIDED', 'Voided');
    expect(result.status).toBe('void');
  });

  it('blocks student role from creating rollup', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await service.createRollup(ctx, makeInput() as any);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('does not contain score mutation fields', async () => {
    const result = await service.createRollup(makeCtx(), makeInput() as any);
    const data = result.data as any;
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('masteryLevel');
  });
});

describe('Package 18 — Progress Summary Lifecycle', () => {
  let summaryRepo: InMemoryRecoveryProgressSummaryRepository;
  let safetyService: RecoveryProgressSafetyService;
  let auditRepo: InMemoryRecoveryProgressAuditRepository;
  let auditBridge: RecoveryProgressAuditBridge;
  let idempotencyRepo: InMemoryRecoveryProgressIdempotencyRepository;
  let idempotencyService: RecoveryProgressIdempotencyService;
  let service: RecoveryProgressSummaryService;

  beforeEach(() => {
    summaryRepo = new InMemoryRecoveryProgressSummaryRepository();
    safetyService = new RecoveryProgressSafetyService();
    auditRepo = new InMemoryRecoveryProgressAuditRepository();
    auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
    idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();
    idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
    service = new RecoveryProgressSummaryService(summaryRepo, safetyService, auditBridge, idempotencyService);
  });

  const makeInput = () => ({
    studentRef: 'student-1',
    teacherRef: 'teacher-1',
    resultRecoveryPlanId: 'plan-1',
    summaryScope: 'student',
    safeSummary: 'Student progress summary',
    progressStateJson: { state: 'on_track' },
    observationCountsJson: { total: 5 },
    checkpointEvaluationCountsJson: { total: 3 },
    rollupRefsJson: { rollupRef: 'rollup-1' },
    blockedReasonCodesJson: [],
  });

  it('creates summary with active status', async () => {
    const result = await service.createSummary(makeCtx(), makeInput() as any);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
    expect(result.resourceId).toBeTruthy();
    expect(result.reasonCode).toBe('SUMMARY_CREATED');
  });

  it('getSummary returns created summary', async () => {
    const created = await service.createSummary(makeCtx(), makeInput() as any);
    const fetched = await service.getSummary(makeCtx(), created.resourceId!);
    expect(fetched.ok).toBe(true);
    expect(fetched.resourceId).toBe(created.resourceId);
  });

  it('getSummary returns not_found for missing id', async () => {
    const result = await service.getSummary(makeCtx(), 'missing');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('NOT_FOUND');
  });

  it('listSummariesForSchool returns filtered', async () => {
    await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.listSummariesForSchool(makeCtx());
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listSummariesForStudent returns filtered', async () => {
    await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.listSummariesForStudent(makeCtx(), 'student-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listSummariesForTeacher returns filtered', async () => {
    await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.listSummariesForTeacher(makeCtx(), 'teacher-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listSummariesForPlan returns filtered', async () => {
    await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.listSummariesForPlan(makeCtx(), 'plan-1');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('listSummariesByScope returns filtered', async () => {
    await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.listSummariesByScope(makeCtx(), 'student');
    const data = result.data as any[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it('summary can be refreshed', async () => {
    const created = await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.refreshSummary(makeCtx(), created.resourceId!, 'SUMMARY_REFRESHED', 'Refreshed');
    expect(result.ok).toBe(true);
    expect(result.reasonCode).toBe('SUMMARY_REFRESHED');
  });

  it('summary can be marked stale', async () => {
    const created = await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.markSummaryStale(makeCtx(), created.resourceId!, 'SUMMARY_STALE', 'Stale');
    expect(result.status).toBe('stale');
  });

  it('summary can be blocked', async () => {
    const created = await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.blockSummary(makeCtx(), created.resourceId!, 'SUMMARY_BLOCKED', 'Blocked');
    expect(result.status).toBe('blocked');
  });

  it('summary can be voided', async () => {
    const created = await service.createSummary(makeCtx(), makeInput() as any);
    const result = await service.voidSummary(makeCtx(), created.resourceId!, 'SUMMARY_VOIDED', 'Voided');
    expect(result.status).toBe('void');
  });

  it('blocks student role from creating summary', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const result = await service.createSummary(ctx, makeInput() as any);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('blocked');
  });

  it('does not contain score mutation fields', async () => {
    const result = await service.createSummary(makeCtx(), makeInput() as any);
    const data = result.data as any;
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('grade');
    expect(data).not.toHaveProperty('masteryScore');
  });
});
