import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseTriageReadinessRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseTriageReadinessService } from '../services/recoveryCaseTriageReadinessService';
import { RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';
import type { CreateTriageReadinessRequest } from '../contracts/recoveryCaseTriageReadinessContracts';

describe('Package 25 - Triage Readiness Lifecycle', () => {
  let repo: InMemoryRecoveryCaseTriageReadinessRepository;
  let service: RecoveryCaseTriageReadinessService;

  const schoolA = 'school-alpha';
  const schoolB = 'school-beta';

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: schoolA,
    actorId: 'teacher-1',
    actorRole: 'teacher',
    correlationId: 'corr-test-1',
    idempotencyKey: 'ik-test-1',
    sourceRefsJson: {},
  };

  const ctxB: RecoveryCaseTriageCommandContext = {
    schoolId: schoolB,
    actorId: 'teacher-2',
    actorRole: 'teacher',
    correlationId: 'corr-test-2',
    idempotencyKey: 'ik-test-2',
    sourceRefsJson: {},
  };

  const baseRequest: CreateTriageReadinessRequest = {
    studentRef: 'student-1',
    resultRecoveryPlanId: 'plan-1',
    boardSnapshotId: 'snap-1',
    boardCardId: 'card-1',
    safeReadinessSummary: 'Initial readiness check',
    readinessChecksJson: { checkVersion: 1 },
    sourceRefsJson: { origin: 'test' },
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseTriageReadinessRepository();
    service = new RecoveryCaseTriageReadinessService(repo);
  });

  it('creates triage readiness record with draft status', async () => {
    const result = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data).toBeDefined();
    expect(result.data!.triageStatus).toBe('draft');
    expect(result.data!.studentRef).toBe('student-1');
    expect(result.data!.schoolId).toBe(schoolA);
    expect(result.data!.createdByActorId).toBe('teacher-1');
  });

  it('lists triage readiness by school', async () => {
    await service.createTriageReadiness(ctx, schoolA, baseRequest);
    await service.createTriageReadiness(ctx, schoolA, { ...baseRequest, studentRef: 'student-2' });
    const result = await service.listTriageReadinessForSchool(schoolA);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('lists triage readiness by student ref', async () => {
    await service.createTriageReadiness(ctx, schoolA, baseRequest);
    await service.createTriageReadiness(ctx, schoolA, { ...baseRequest, studentRef: 'student-2' });
    const result = await service.listTriageReadinessForStudent(schoolA, 'student-1');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].studentRef).toBe('student-1');
  });

  it('lists triage readiness by status', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    await service.markTriageReadinessReady(ctx, schoolA, created.data!.triageReadinessId);
    const result = await service.listTriageReadinessByStatus(schoolA, 'ready');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].triageStatus).toBe('ready');
  });

  it('marks triage readiness as ready', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const updated = await service.markTriageReadinessReady(ctx, schoolA, created.data!.triageReadinessId);
    expect(updated.success).toBe(true);
    expect(updated.data!.triageStatus).toBe('ready');
  });

  it('marks triage readiness as review ready', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const updated = await service.markTriageReadinessReviewReady(ctx, schoolA, created.data!.triageReadinessId);
    expect(updated.success).toBe(true);
    expect(updated.data!.triageStatus).toBe('review_ready');
  });

  it('marks triage readiness as stale', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const updated = await service.markTriageReadinessStale(ctx, schoolA, created.data!.triageReadinessId);
    expect(updated.success).toBe(true);
    expect(updated.data!.triageStatus).toBe('stale');
  });

  it('blocks triage readiness', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const updated = await service.blockTriageReadiness(ctx, schoolA, created.data!.triageReadinessId, 'BLOCK_REASON', 'Blocked for testing');
    expect(updated.success).toBe(true);
    expect(updated.data!.triageStatus).toBe('blocked');
  });

  it('suppresses triage readiness', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const updated = await service.suppressTriageReadiness(ctx, schoolA, created.data!.triageReadinessId, 'SUPPRESS_REASON', 'Suppressed for testing');
    expect(updated.success).toBe(true);
    expect(updated.data!.triageStatus).toBe('suppressed');
  });

  it('voids triage readiness', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const updated = await service.voidTriageReadiness(ctx, schoolA, created.data!.triageReadinessId, 'VOID_REASON', 'Voided for testing');
    expect(updated.success).toBe(true);
    expect(updated.data!.triageStatus).toBe('void');
  });

  it('enforces cross-school isolation', async () => {
    await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const listB = await service.listTriageReadinessForSchool(schoolB);
    expect(listB.data).toHaveLength(0);
  });

  it('different schools cannot see each others records', async () => {
    const createdA = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const createdB = await service.createTriageReadiness(ctxB, schoolB, { ...baseRequest, studentRef: 'student-B' });
    const listA = await service.listTriageReadinessForSchool(schoolA);
    const listB = await service.listTriageReadinessForSchool(schoolB);
    expect(listA.data).toHaveLength(1);
    expect(listB.data).toHaveLength(1);
    expect(listA.data![0].schoolId).toBe(schoolA);
    expect(listB.data![0].schoolId).toBe(schoolB);
    expect(listA.data![0].triageReadinessId).not.toBe(listB.data![0].triageReadinessId);
  });

  it('rejects invalid status transitions when school mismatches', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const wrongSchoolCtx: RecoveryCaseTriageCommandContext = { ...ctx, schoolId: 'school-other' };
    const result = await service.markTriageReadinessReady(wrongSchoolCtx, schoolA, created.data!.triageReadinessId);
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('returns NOT_FOUND for non-existent readiness', async () => {
    const result = await service.getTriageReadiness(schoolA, 'non-existent-id');
    expect(result.success).toBe(false);
    expect(result.status).toBe('NOT_FOUND');
  });

  it('lists triage readiness by plan id', async () => {
    const created = await service.createTriageReadiness(ctx, schoolA, baseRequest);
    const result = await service.listTriageReadinessForPlan(schoolA, 'plan-1');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].resultRecoveryPlanId).toBe('plan-1');
  });
});
