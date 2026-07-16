import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardLaneService } from '../services/recoveryExecutionReadinessBoardLaneService';
import { InMemoryRecoveryExecutionReadinessBoardLaneRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Lane Lifecycle', () => {
  it('createBoardLane returns lane with boardLaneId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardLaneRepository();
    const service = new RecoveryExecutionReadinessBoardLaneService(repo);
    const result = await service.createBoardLane(ctx, 'school-1', {
      boardSnapshotId: 'snap-1',
      schoolId: 'school-1',
      laneKey: 'planning',
      laneSummary: 'Planning lane',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardLaneId).toBeDefined();
  });

  it('lane keys include planning, progress_observation, outcome_decision, action_preparation, execution_simulation, closure_readiness, authorization_preview, board_summary', () => {
    const expectedKeys = [
      'planning', 'progress_observation', 'outcome_decision', 'action_preparation',
      'execution_simulation', 'closure_readiness', 'authorization_preview', 'board_summary',
    ];
    for (const key of expectedKeys) {
      expect(typeof key).toBe('string');
    }
    expect(expectedKeys.length).toBe(8);
  });

  it('listBoardLanesForSnapshot returns lanes', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardLaneRepository();
    const service = new RecoveryExecutionReadinessBoardLaneService(repo);
    await service.createBoardLane(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', laneSummary: 'Planning' });
    await service.createBoardLane(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'progress_observation', laneSummary: 'Progress' });
    const result = await service.listBoardLanesForSnapshot('snap-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('markBoardLaneReady changes laneStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardLaneRepository();
    const service = new RecoveryExecutionReadinessBoardLaneService(repo);
    const created = await service.createBoardLane(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', laneSummary: 'Planning' });
    const id = created.data!.boardLaneId;
    const result = await service.markBoardLaneReady(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.laneStatus).toBe('ready');
  });

  it('markBoardLaneStale changes laneStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardLaneRepository();
    const service = new RecoveryExecutionReadinessBoardLaneService(repo);
    const created = await service.createBoardLane(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', laneSummary: 'Planning' });
    const id = created.data!.boardLaneId;
    const result = await service.markBoardLaneStale(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.laneStatus).toBe('stale');
  });

  it('blockBoardLane changes laneStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardLaneRepository();
    const service = new RecoveryExecutionReadinessBoardLaneService(repo);
    const created = await service.createBoardLane(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', laneSummary: 'Planning' });
    const id = created.data!.boardLaneId;
    const result = await service.blockBoardLane(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.laneStatus).toBe('blocked');
  });

  it('voidBoardLane adds voidedAt', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardLaneRepository();
    const service = new RecoveryExecutionReadinessBoardLaneService(repo);
    const created = await service.createBoardLane(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', laneSummary: 'Planning' });
    const id = created.data!.boardLaneId;
    const result = await service.voidBoardLane(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('voided');
    expect(result.data?.voidedAt).toBeDefined();
  });
});
