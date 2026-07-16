import { describe, it, expect } from 'vitest';
import { InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { CreateRefreshJobRequest } from '../contracts/index';

describe('Package 24 - Board Refresh Job Safety', () => {
  it('createRefreshJob returns job with boardRefreshJobId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
    const body: CreateRefreshJobRequest = {
      schoolId: 'school-1',
      jobType: 'full',
      jobSummary: 'Full board refresh',
    };
    const result = await repo.create(body as any);
    expect(result.boardRefreshJobId).toBeDefined();
    expect(result.jobStatus).toBe('pending');
  });

  it('listRefreshJobsForSchool returns jobs', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
    await repo.create({ schoolId: 'school-1', jobType: 'full', jobSummary: 'J1' } as any);
    await repo.create({ schoolId: 'school-1', jobType: 'partial', jobSummary: 'J2' } as any);
    const results = await repo.listBySchool('school-1');
    expect(results.length).toBe(2);
  });

  it('listRefreshJobsByStatus filters by jobStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
    await repo.create({ schoolId: 'school-1', jobType: 'full', jobSummary: 'J1', jobStatus: 'pending' } as any);
    await repo.create({ schoolId: 'school-1', jobType: 'full', jobSummary: 'J2', jobStatus: 'completed' } as any);
    const results = await repo.listByStatus('completed');
    expect(results.length).toBe(1);
    expect(results[0].jobSummary).toBe('J2');
  });

  it('markRefreshJobRunning changes jobStatus to running', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
    const created = await repo.create({ schoolId: 'school-1', jobType: 'full', jobSummary: 'J1' } as any);
    const result = await repo.markRunning(created.boardRefreshJobId);
    expect(result.jobStatus).toBe('running');
  });

  it('markRefreshJobCompleted changes jobStatus to completed', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
    const created = await repo.create({ schoolId: 'school-1', jobType: 'full', jobSummary: 'J1' } as any);
    const result = await repo.markCompleted(created.boardRefreshJobId);
    expect(result.jobStatus).toBe('completed');
    expect(result.completedAt).toBeDefined();
  });

  it('markRefreshJobFailed changes jobStatus to failed', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
    const created = await repo.create({ schoolId: 'school-1', jobType: 'full', jobSummary: 'J1' } as any);
    const result = await repo.markFailed(created.boardRefreshJobId);
    expect(result.jobStatus).toBe('failed');
  });

  it('voidRefreshJob works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
    const created = await repo.create({ schoolId: 'school-1', jobType: 'full', jobSummary: 'J1' } as any);
    const result = await repo.void(created.boardRefreshJobId);
    expect(result.jobStatus).toBe('voided');
    expect(result.voidedAt).toBeDefined();
  });
});
