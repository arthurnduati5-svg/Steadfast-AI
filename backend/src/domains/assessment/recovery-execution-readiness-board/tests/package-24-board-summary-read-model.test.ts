import { describe, it, expect } from 'vitest';
import { InMemoryRecoveryExecutionReadinessBoardSummaryRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { CreateBoardSummaryRequest } from '../contracts/index';

describe('Package 24 - Board Summary Read Model', () => {
  it('createBoardSummary returns summary with boardSummaryId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    const body: CreateBoardSummaryRequest = {
      schoolId: 'school-1',
      safeSummary: 'All systems nominal',
    };
    const result = await repo.create(body as any);
    expect(result.boardSummaryId).toBeDefined();
    expect(result.summaryStatus).toBe('draft');
  });

  it('getBoardSummary returns created summary', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    const created = await repo.create({ schoolId: 'school-1', safeSummary: 'Summary' } as any);
    const result = await repo.getById(created.boardSummaryId);
    expect(result).not.toBeNull();
    expect(result!.safeSummary).toBe('Summary');
  });

  it('listBoardSummariesForSchool returns summaries', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    await repo.create({ schoolId: 'school-1', safeSummary: 'S1' } as any);
    await repo.create({ schoolId: 'school-1', safeSummary: 'S2' } as any);
    const results = await repo.listBySchool('school-1');
    expect(results.length).toBe(2);
  });

  it('listBoardSummariesForStudent returns summaries for student', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeSummary: 'S1' } as any);
    await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeSummary: 'S2' } as any);
    const results = await repo.listByStudentRef('school-1', 'student-1');
    expect(results.length).toBe(2);
  });

  it('listBoardSummariesForPlan returns summaries for plan', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    await repo.create({ schoolId: 'school-1', resultRecoveryPlanId: 'plan-1', safeSummary: 'S1' } as any);
    await repo.create({ schoolId: 'school-1', resultRecoveryPlanId: 'plan-1', safeSummary: 'S2' } as any);
    const results = await repo.listByPlanId('plan-1');
    expect(results.length).toBe(2);
  });

  it('refreshBoardSummary works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    const created = await repo.create({ schoolId: 'school-1', safeSummary: 'S1' } as any);
    const result = await repo.update(created.boardSummaryId, { summaryStatus: 'active' } as any);
    expect(result.summaryStatus).toBe('active');
  });

  it('markBoardSummaryStale changes summaryStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    const created = await repo.create({ schoolId: 'school-1', safeSummary: 'S1' } as any);
    const result = await repo.markStale(created.boardSummaryId);
    expect(result.summaryStatus).toBe('stale');
  });

  it('markBoardSummaryReviewReady changes summaryStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    const created = await repo.create({ schoolId: 'school-1', safeSummary: 'S1' } as any);
    const result = await repo.markReviewReady(created.boardSummaryId);
    expect(result.summaryStatus).toBe('review_ready');
  });

  it('blockBoardSummary works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    const created = await repo.create({ schoolId: 'school-1', safeSummary: 'S1' } as any);
    const result = await repo.block(created.boardSummaryId);
    expect(result.summaryStatus).toBe('blocked');
  });

  it('voidBoardSummary works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
    const created = await repo.create({ schoolId: 'school-1', safeSummary: 'S1' } as any);
    const result = await repo.void(created.boardSummaryId);
    expect(result.summaryStatus).toBe('voided');
    expect(result.voidedAt).toBeDefined();
  });
});
