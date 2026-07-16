import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardSnapshotService } from '../services/recoveryExecutionReadinessBoardSnapshotService';
import { InMemoryRecoveryExecutionReadinessBoardSnapshotRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Snapshot Lifecycle', () => {
  it('createBoardSnapshot returns snapshot with boardSnapshotId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const result = await service.createBoardSnapshot(ctx, 'school-1', {
      schoolId: 'school-1',
      snapshotSummary: 'test snapshot',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardSnapshotId).toBeDefined();
    expect(typeof result.data?.boardSnapshotId).toBe('string');
  });

  it('createBoardSnapshot requires schoolId (returns error without it)', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const result = await service.createBoardSnapshot(ctx, 'school-2', {
      schoolId: 'school-2',
      snapshotSummary: 'test',
    });
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED');
  });

  it('getBoardSnapshot returns the created snapshot', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const created = await service.createBoardSnapshot(ctx, 'school-1', {
      schoolId: 'school-1',
      snapshotSummary: 'test snapshot',
    });
    const id = created.data!.boardSnapshotId;
    const result = await service.getBoardSnapshot('school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.boardSnapshotId).toBe(id);
  });

  it('listBoardSnapshotsForSchool returns snapshots for the school', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    await service.createBoardSnapshot(ctx, 'school-1', { schoolId: 'school-1', snapshotSummary: 's1' });
    await service.createBoardSnapshot(ctx, 'school-1', { schoolId: 'school-1', snapshotSummary: 's2' });
    const result = await service.listBoardSnapshotsForSchool('school-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('markBoardSnapshotReady changes boardStatus to ready', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const created = await service.createBoardSnapshot(ctx, 'school-1', { schoolId: 'school-1', snapshotSummary: 'test' });
    const id = created.data!.boardSnapshotId;
    const result = await service.markBoardSnapshotReady(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.boardStatus).toBe('ready');
  });

  it('markBoardSnapshotStale changes boardStatus to stale', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const created = await service.createBoardSnapshot(ctx, 'school-1', { schoolId: 'school-1', snapshotSummary: 'test' });
    const id = created.data!.boardSnapshotId;
    const result = await service.markBoardSnapshotStale(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.boardStatus).toBe('stale');
  });

  it('suppressBoardSnapshot works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const created = await service.createBoardSnapshot(ctx, 'school-1', { schoolId: 'school-1', snapshotSummary: 'test' });
    const id = created.data!.boardSnapshotId;
    const result = await service.suppressBoardSnapshot(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('suppressed');
  });

  it('blockBoardSnapshot works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const created = await service.createBoardSnapshot(ctx, 'school-1', { schoolId: 'school-1', snapshotSummary: 'test' });
    const id = created.data!.boardSnapshotId;
    const result = await service.blockBoardSnapshot(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('voidBoardSnapshot works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const created = await service.createBoardSnapshot(ctx, 'school-1', { schoolId: 'school-1', snapshotSummary: 'test' });
    const id = created.data!.boardSnapshotId;
    const result = await service.voidBoardSnapshot(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('voided');
    expect(result.data?.voidedAt).toBeDefined();
  });

  it('boardStatus defaults to draft', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardSnapshotRepository();
    const service = new RecoveryExecutionReadinessBoardSnapshotService(repo);
    const result = await service.createBoardSnapshot(ctx, 'school-1', { schoolId: 'school-1', snapshotSummary: 'test' });
    expect(result.data?.boardStatus).toBe('draft');
  });
});
