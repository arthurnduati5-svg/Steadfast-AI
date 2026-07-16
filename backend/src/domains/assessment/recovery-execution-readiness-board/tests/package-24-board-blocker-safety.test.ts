import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardBlockerService } from '../services/recoveryExecutionReadinessBoardBlockerService';
import { InMemoryRecoveryExecutionReadinessBoardBlockerRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Blocker Safety', () => {
  it('createBoardBlocker returns blocker with boardBlockerId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardBlockerRepository();
    const service = new RecoveryExecutionReadinessBoardBlockerService(repo);
    const result = await service.createBoardBlocker(ctx, 'school-1', {
      schoolId: 'school-1',
      blockerCategory: 'scheduling',
      blockerSummary: 'No time slot',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardBlockerId).toBeDefined();
  });

  it('listBoardBlockersForSnapshot returns blockers', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardBlockerRepository();
    const service = new RecoveryExecutionReadinessBoardBlockerService(repo);
    await service.createBoardBlocker(ctx, 'school-1', { schoolId: 'school-1', boardSnapshotId: 'snap-1', blockerCategory: 'scheduling', blockerSummary: 'B1' });
    await service.createBoardBlocker(ctx, 'school-1', { schoolId: 'school-1', boardSnapshotId: 'snap-1', blockerCategory: 'resources', blockerSummary: 'B2' });
    const result = await service.listBoardBlockersForSnapshot('snap-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('listBoardBlockersByStatus filters by blockerStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardBlockerRepository();
    const service = new RecoveryExecutionReadinessBoardBlockerService(repo);
    await service.createBoardBlocker(ctx, 'school-1', { schoolId: 'school-1', blockerCategory: 'cat1', blockerSummary: 'B1', blockerStatus: 'open' });
    await service.createBoardBlocker(ctx, 'school-1', { schoolId: 'school-1', blockerCategory: 'cat2', blockerSummary: 'B2', blockerStatus: 'resolved' });
    const result = await service.listBoardBlockersByStatus('open');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
    expect(result.data?.[0].blockerSummary).toBe('B1');
  });

  it('markBoardBlockerReviewReady changes blockerStatus to review_ready', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardBlockerRepository();
    const service = new RecoveryExecutionReadinessBoardBlockerService(repo);
    const created = await service.createBoardBlocker(ctx, 'school-1', { schoolId: 'school-1', blockerCategory: 'cat1', blockerSummary: 'B1' });
    const id = created.data!.boardBlockerId;
    const result = await service.markBoardBlockerReviewReady(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.blockerStatus).toBe('review_ready');
  });

  it('resolveBoardBlockerForFutureReviewOnly sets resolvedAt', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardBlockerRepository();
    const service = new RecoveryExecutionReadinessBoardBlockerService(repo);
    const created = await service.createBoardBlocker(ctx, 'school-1', { schoolId: 'school-1', blockerCategory: 'cat1', blockerSummary: 'B1' });
    const id = created.data!.boardBlockerId;
    const result = await service.resolveBoardBlockerForFutureReviewOnly(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.resolvedAt).toBeDefined();
  });

  it('suppressBoardBlocker works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardBlockerRepository();
    const service = new RecoveryExecutionReadinessBoardBlockerService(repo);
    const created = await service.createBoardBlocker(ctx, 'school-1', { schoolId: 'school-1', blockerCategory: 'cat1', blockerSummary: 'B1' });
    const id = created.data!.boardBlockerId;
    const result = await service.suppressBoardBlocker(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('suppressed');
  });

  it('voidBoardBlocker works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardBlockerRepository();
    const service = new RecoveryExecutionReadinessBoardBlockerService(repo);
    const created = await service.createBoardBlocker(ctx, 'school-1', { schoolId: 'school-1', blockerCategory: 'cat1', blockerSummary: 'B1' });
    const id = created.data!.boardBlockerId;
    const result = await service.voidBoardBlocker(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('voided');
  });
});
