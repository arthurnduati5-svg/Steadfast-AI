import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAdjudicationReadinessRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';

describe('Package 26 - Adjudication Readiness Lifecycle', () => {
  let repo: InMemoryAdjudicationReadinessRepository;
  const schoolA = 'school-a';
  const schoolB = 'school-b';

  beforeEach(() => {
    repo = new InMemoryAdjudicationReadinessRepository();
  });

  it('create adjudication readiness returns record with draft status', async () => {
    const record = await repo.create({
      schoolId: schoolA,
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      queueItemId: 'queue-1',
      safeReadinessSummary: 'Readiness check complete',
      sourceRefs: {},
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(record.readinessStatus).toBe('draft');
    expect(record.adjudicationReadinessId).toBeTruthy();
    expect(record.schoolId).toBe(schoolA);
  });

  it('get by ID returns the correct record', async () => {
    const created = await repo.create({
      schoolId: schoolA,
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      queueItemId: 'queue-1',
      safeReadinessSummary: 'Test',
      sourceRefs: {},
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const found = await repo.getById(created.adjudicationReadinessId);
    expect(found).not.toBeNull();
    expect(found!.adjudicationReadinessId).toBe(created.adjudicationReadinessId);
  });

  it('list by school returns school-scoped records', async () => {
    await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'A', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    await repo.create({ schoolId: schoolA, studentRef: 's2', resultRecoveryPlanId: 'p2', queueItemId: 'q2', safeReadinessSummary: 'A2', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    await repo.create({ schoolId: schoolB, studentRef: 's3', resultRecoveryPlanId: 'p3', queueItemId: 'q3', safeReadinessSummary: 'B', sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'teacher' });
    const listA = await repo.listBySchool(schoolA);
    const listB = await repo.listBySchool(schoolB);
    expect(listA).toHaveLength(2);
    expect(listB).toHaveLength(1);
  });

  it('list by student ref returns filtered records', async () => {
    await repo.create({ schoolId: schoolA, studentRef: 'student-x', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'X', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    await repo.create({ schoolId: schoolA, studentRef: 'student-y', resultRecoveryPlanId: 'p2', queueItemId: 'q2', safeReadinessSummary: 'Y', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const results = await repo.listByStudentRef(schoolA, 'student-x');
    expect(results).toHaveLength(1);
    expect(results[0].studentRef).toBe('student-x');
  });

  it('list by plan returns filtered records', async () => {
    await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'plan-alpha', queueItemId: 'q1', safeReadinessSummary: 'Alpha', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    await repo.create({ schoolId: schoolA, studentRef: 's2', resultRecoveryPlanId: 'plan-beta', queueItemId: 'q2', safeReadinessSummary: 'Beta', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const results = await repo.listByPlanId(schoolA, 'plan-alpha');
    expect(results).toHaveLength(1);
    expect(results[0].resultRecoveryPlanId).toBe('plan-alpha');
  });

  it('list by queue item returns filtered records', async () => {
    await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'qi-42', safeReadinessSummary: 'Item', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const results = await repo.listByQueueItemId(schoolA, 'qi-42');
    expect(results).toHaveLength(1);
    expect(results[0].queueItemId).toBe('qi-42');
  });

  it('mark ready changes status to ready', async () => {
    const created = await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const updated = await repo.updateStatus(created.adjudicationReadinessId, 'ready');
    expect(updated.readinessStatus).toBe('ready');
  });

  it('mark review ready changes status to review_ready', async () => {
    const created = await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const updated = await repo.updateStatus(created.adjudicationReadinessId, 'review_ready');
    expect(updated.readinessStatus).toBe('review_ready');
  });

  it('mark stale changes status to stale', async () => {
    const created = await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const updated = await repo.updateStatus(created.adjudicationReadinessId, 'stale');
    expect(updated.readinessStatus).toBe('stale');
  });

  it('block adds reason codes', async () => {
    const created = await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const blocked = await repo.updateStatus(created.adjudicationReadinessId, 'blocked', ['missing_data', 'incomplete_check']);
    expect(blocked.readinessStatus).toBe('blocked');
    expect(blocked.blockedReasonCodes).toEqual(['missing_data', 'incomplete_check']);
  });

  it('void sets voidedAt and status to void', async () => {
    const created = await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const voided = await repo.void(created.adjudicationReadinessId);
    expect(voided.readinessStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('different schools are isolated', async () => {
    const a = await repo.create({ schoolId: schoolA, studentRef: 's1', resultRecoveryPlanId: 'p1', queueItemId: 'q1', safeReadinessSummary: 'A', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const b = await repo.create({ schoolId: schoolB, studentRef: 's2', resultRecoveryPlanId: 'p2', queueItemId: 'q2', safeReadinessSummary: 'B', sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'teacher' });
    const listA = await repo.listBySchool(schoolA);
    const listB = await repo.listBySchool(schoolB);
    expect(listA).toHaveLength(1);
    expect(listA[0].schoolId).toBe(schoolA);
    expect(listB).toHaveLength(1);
    expect(listB[0].schoolId).toBe(schoolB);
    const fromA = await repo.getById(a.adjudicationReadinessId);
    const fromB = await repo.getById(b.adjudicationReadinessId);
    expect(fromA?.schoolId).toBe(schoolA);
    expect(fromB?.schoolId).toBe(schoolB);
  });
});
