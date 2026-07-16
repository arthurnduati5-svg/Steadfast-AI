import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryAdjudicationSummaryRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseAdjudicationSummaryService } from '../services/recoveryCaseAdjudicationSummaryService';
import type { RecoveryCaseAdjudicationCommandContext } from '../contracts';

describe('Package 26 - Adjudication Summary Read Model', () => {
  let repo: InMemoryAdjudicationSummaryRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseAdjudicationSummaryService;
  const schoolA = 'school-a';
  const schoolB = 'school-b';
  const ctx: RecoveryCaseAdjudicationCommandContext = {
    schoolId: schoolA,
    actorId: 'actor-1',
    actorRole: 'admin',
    correlationId: 'corr-1',
    idempotencyKey: 'ik-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryAdjudicationSummaryRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseAdjudicationSummaryService(repo, auditRepo);
  });

  it('create adjudication summary returns record with draft status', async () => {
    const result = await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA,
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      queueItemId: 'queue-1',
      safeSummary: 'Adjudication complete',
      adjudicationCounts: { total: 5, completed: 3 },
      consensusCounts: { reached: 2, partial: 1 },
      disagreementCounts: { open: 1 },
      dispositionCounts: { retain: 1 },
      sourceRefs: {},
      createdByActorId: 'actor-1',
      createdByRole: 'admin',
    });
    expect(result.success).toBe(true);
    expect(result.data!.summaryStatus).toBe('draft');
    expect(result.data!.adjudicationSummaryId).toBeTruthy();
  });

  it('get by ID returns the correct record', async () => {
    const created = await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'Get test', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const found = await service.getAdjudicationSummary(created.data!.adjudicationSummaryId);
    expect(found.success).toBe(true);
    expect(found.data!.adjudicationSummaryId).toBe(created.data!.adjudicationSummaryId);
  });

  it('list by school returns school-scoped records', async () => {
    await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'A1', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'A2', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    await service.createAdjudicationSummary({ ...ctx, schoolId: schoolB }, {
      schoolId: schoolB, safeSummary: 'B1', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'admin',
    });
    const listA = await service.listAdjudicationSummariesForSchool(schoolA);
    const listB = await service.listAdjudicationSummariesForSchool(schoolB);
    expect(listA.data!).toHaveLength(2);
    expect(listB.data!).toHaveLength(1);
  });

  it('list by student returns filtered records', async () => {
    await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, studentRef: 'student-x', safeSummary: 'X', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, studentRef: 'student-y', safeSummary: 'Y', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const results = await service.listAdjudicationSummariesForStudent(schoolA, 'student-x');
    expect(results.data!).toHaveLength(1);
    expect(results.data![0].studentRef).toBe('student-x');
  });

  it('list by plan returns filtered records', async () => {
    await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, resultRecoveryPlanId: 'plan-alpha', safeSummary: 'Alpha', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const results = await service.listAdjudicationSummariesForPlan(schoolA, 'plan-alpha');
    expect(results.data!).toHaveLength(1);
    expect(results.data![0].resultRecoveryPlanId).toBe('plan-alpha');
  });

  it('list by queue item returns filtered records', async () => {
    await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, queueItemId: 'qi-42', safeSummary: 'QI', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const results = await service.listAdjudicationSummariesForQueueItem(schoolA, 'qi-42');
    expect(results.data!).toHaveLength(1);
    expect(results.data![0].queueItemId).toBe('qi-42');
  });

  it('mark review ready changes status', async () => {
    const created = await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'RR', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const updated = await service.markAdjudicationSummaryReviewReady(created.data!.adjudicationSummaryId);
    expect(updated.data!.summaryStatus).toBe('review_ready');
  });

  it('mark stale changes status', async () => {
    const created = await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'Stale', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const updated = await service.markAdjudicationSummaryStale(created.data!.adjudicationSummaryId);
    expect(updated.data!.summaryStatus).toBe('stale');
  });

  it('block changes status', async () => {
    const created = await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'Block', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const blocked = await service.blockAdjudicationSummary(created.data!.adjudicationSummaryId, ['data_quality_issue']);
    expect(blocked.data!.summaryStatus).toBe('blocked');
  });

  it('void sets status to void', async () => {
    const created = await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'Void', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const voided = await service.voidAdjudicationSummary(created.data!.adjudicationSummaryId);
    expect(voided.data!.summaryStatus).toBe('void');
  });

  it('refresh updates fields', async () => {
    const created = await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'Original', adjudicationCounts: { total: 1 }, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    const refreshed = await service.refreshAdjudicationSummary(created.data!.adjudicationSummaryId, {
      safeSummary: 'Refreshed',
      adjudicationCounts: { total: 5, updated: 3 },
      consensusCounts: { reached: 2 },
    });
    expect(refreshed.data!.safeSummary).toBe('Refreshed');
    expect(refreshed.data!.adjudicationCounts).toEqual({ total: 5, updated: 3 });
    expect(refreshed.data!.consensusCounts).toEqual({ reached: 2 });
  });

  it('school isolation', async () => {
    await service.createAdjudicationSummary(ctx, {
      schoolId: schoolA, safeSummary: 'A', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'admin',
    });
    await service.createAdjudicationSummary({ ...ctx, schoolId: schoolB }, {
      schoolId: schoolB, safeSummary: 'B', adjudicationCounts: {}, consensusCounts: {}, disagreementCounts: {}, dispositionCounts: {}, sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'admin',
    });
    const listA = await service.listAdjudicationSummariesForSchool(schoolA);
    const listB = await service.listAdjudicationSummariesForSchool(schoolB);
    expect(listA.data!).toHaveLength(1);
    expect(listA.data![0].schoolId).toBe(schoolA);
    expect(listB.data!).toHaveLength(1);
    expect(listB.data![0].schoolId).toBe(schoolB);
  });
});
