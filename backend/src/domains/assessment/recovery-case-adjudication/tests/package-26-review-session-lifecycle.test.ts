import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryReviewSessionRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';

describe('Package 26 - Review Session Lifecycle', () => {
  let repo: InMemoryReviewSessionRepository;
  const schoolA = 'school-a';
  const schoolB = 'school-b';

  beforeEach(() => {
    repo = new InMemoryReviewSessionRepository();
  });

  it('create review session returns draft status', async () => {
    const session = await repo.create({
      schoolId: schoolA,
      queueItemId: 'queue-1',
      reviewerActorId: 'reviewer-1',
      reviewerRole: 'teacher',
      safeSessionSummary: 'Session created',
      sourceRefs: {},
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(session.sessionStatus).toBe('draft');
    expect(session.reviewSessionId).toBeTruthy();
  });

  it('get by ID works', async () => {
    const created = await repo.create({
      schoolId: schoolA,
      queueItemId: 'queue-1',
      reviewerActorId: 'reviewer-1',
      reviewerRole: 'teacher',
      safeSessionSummary: 'Test',
      sourceRefs: {},
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const found = await repo.getById(created.reviewSessionId);
    expect(found).not.toBeNull();
    expect(found!.reviewSessionId).toBe(created.reviewSessionId);
  });

  it('list by school filters correctly', async () => {
    await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', safeSessionSummary: 'A', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    await repo.create({ schoolId: schoolB, queueItemId: 'q2', reviewerActorId: 'r2', reviewerRole: 'teacher', safeSessionSummary: 'B', sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'teacher' });
    const listA = await repo.listBySchool(schoolA);
    const listB = await repo.listBySchool(schoolB);
    expect(listA).toHaveLength(1);
    expect(listB).toHaveLength(1);
  });

  it('list by queue item filters correctly', async () => {
    await repo.create({ schoolId: schoolA, queueItemId: 'qi-target', reviewerActorId: 'r1', reviewerRole: 'teacher', safeSessionSummary: 'Target', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    await repo.create({ schoolId: schoolA, queueItemId: 'qi-other', reviewerActorId: 'r2', reviewerRole: 'teacher', safeSessionSummary: 'Other', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const results = await repo.listByQueueItemId(schoolA, 'qi-target');
    expect(results).toHaveLength(1);
    expect(results[0].queueItemId).toBe('qi-target');
  });

  it('list by reviewer works', async () => {
    await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'rev-x', reviewerRole: 'teacher', safeSessionSummary: 'X', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const results = await repo.listByReviewer(schoolA, 'rev-x');
    expect(results).toHaveLength(1);
    expect(results[0].reviewerActorId).toBe('rev-x');
  });

  it('start session changes status to in_progress', async () => {
    const created = await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', safeSessionSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const updated = await repo.updateStatus(created.reviewSessionId, 'in_progress');
    expect(updated.sessionStatus).toBe('in_progress');
  });

  it('mark review ready', async () => {
    const created = await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', safeSessionSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const updated = await repo.updateStatus(created.reviewSessionId, 'review_ready');
    expect(updated.sessionStatus).toBe('review_ready');
  });

  it('mark needs second review', async () => {
    const created = await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', safeSessionSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const updated = await repo.updateStatus(created.reviewSessionId, 'needs_second_review');
    expect(updated.sessionStatus).toBe('needs_second_review');
  });

  it('mark needs more evidence', async () => {
    const created = await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', safeSessionSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const updated = await repo.updateStatus(created.reviewSessionId, 'needs_more_evidence');
    expect(updated.sessionStatus).toBe('needs_more_evidence');
  });

  it('block and void', async () => {
    const created = await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', safeSessionSummary: 'Test', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const blocked = await repo.updateStatus(created.reviewSessionId, 'blocked', ['policy_violation']);
    expect(blocked.sessionStatus).toBe('blocked');
    expect(blocked.blockedReasonCodes).toEqual(['policy_violation']);
    const voided = await repo.void(created.reviewSessionId);
    expect(voided.sessionStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('school isolation', async () => {
    const a = await repo.create({ schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', safeSessionSummary: 'A', sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher' });
    const b = await repo.create({ schoolId: schoolB, queueItemId: 'q2', reviewerActorId: 'r2', reviewerRole: 'teacher', safeSessionSummary: 'B', sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'teacher' });
    const listA = await repo.listBySchool(schoolA);
    const listB = await repo.listBySchool(schoolB);
    expect(listA).toHaveLength(1);
    expect(listB).toHaveLength(1);
    const foundA = await repo.getById(a.reviewSessionId);
    const foundB = await repo.getById(b.reviewSessionId);
    expect(foundA?.schoolId).toBe(schoolA);
    expect(foundB?.schoolId).toBe(schoolB);
  });
});
