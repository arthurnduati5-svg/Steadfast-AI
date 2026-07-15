import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryFollowUpSummaryRepository,
} from '../repositories/inMemoryResultFollowUpRepositories';

function makeSummaryInput() {
  return {
    schoolId: 'school-1',
    studentRef: 'student-1',
    summaryScope: 'student' as const,
    safeSummary: 'Follow-up summary for student',
    caseCounts: { total: 3, open: 1 } as Record<string, unknown>,
    priorityCounts: { high: 1, medium: 2 } as Record<string, unknown>,
    statusCounts: { draft: 1, opened: 1, closed: 1 } as Record<string, unknown>,
  };
}

describe('Package 16 — Summary Read Model', () => {
  let summaryRepo: InMemoryFollowUpSummaryRepository;

  beforeEach(() => {
    summaryRepo = new InMemoryFollowUpSummaryRepository();
  });

  it('can create a follow-up summary', async () => {
    const s = await summaryRepo.create({
      ...makeSummaryInput(),
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(s).toBeDefined();
    expect(s.followUpSummaryId).toBeTruthy();
    expect(s.summaryStatus).toBe('active');
    expect(s.schoolId).toBe('school-1');
  });

  it('can list summaries by school', async () => {
    await summaryRepo.create({
      ...makeSummaryInput(),
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const summaries = await summaryRepo.listBySchool('school-1');
    expect(summaries.length).toBeGreaterThanOrEqual(1);
  });

  it('can list summaries by student', async () => {
    await summaryRepo.create({
      ...makeSummaryInput(),
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const summaries = await summaryRepo.listByStudentRef('school-1', 'student-1');
    expect(summaries.length).toBeGreaterThanOrEqual(1);
  });

  it('can refresh a summary', async () => {
    const s = await summaryRepo.create({
      ...makeSummaryInput(),
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const refreshed = await summaryRepo.refresh(s.followUpSummaryId);
    expect(refreshed.refreshedAt).toBeTruthy();
  });

  it('can mark summary stale', async () => {
    const s = await summaryRepo.create({
      ...makeSummaryInput(),
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const stale = await summaryRepo.markStale(s.followUpSummaryId);
    expect(stale.summaryStatus).toBe('stale');
  });

  it('can block a summary', async () => {
    const s = await summaryRepo.create({
      ...makeSummaryInput(),
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const blocked = await summaryRepo.block(s.followUpSummaryId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.summaryStatus).toBe('blocked');
  });

  it('can void a summary', async () => {
    const s = await summaryRepo.create({
      ...makeSummaryInput(),
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const voided = await summaryRepo.void(s.followUpSummaryId, 'USER_REQUEST', 'Voided');
    expect(voided.summaryStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('summary does not expose forbidden fields', async () => {
    const s = await summaryRepo.create({
      ...makeSummaryInput(),
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(s).not.toHaveProperty('accessToken');
    expect(s).not.toHaveProperty('portalUrl');
    expect(s).not.toHaveProperty('aiNarrative');
    expect(s).not.toHaveProperty('ocrText');
    expect(s).not.toHaveProperty('rawStudentAnswer');
    expect(s).not.toHaveProperty('hiddenReasoning');
  });
});
