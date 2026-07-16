import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardProjectionService } from '../services/recoveryExecutionReadinessBoardProjectionService';
import { InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Role Projection Safety', () => {
  it('createRoleProjection returns projection with boardRoleProjectionId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository();
    const service = new RecoveryExecutionReadinessBoardProjectionService(repo);
    const result = await service.createRoleProjection(ctx, 'school-1', {
      schoolId: 'school-1',
      targetRole: 'teacher',
      projectionSummary: 'Teacher view',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardRoleProjectionId).toBeDefined();
  });

  it('listRoleProjectionsByRole filters by targetRole', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository();
    const service = new RecoveryExecutionReadinessBoardProjectionService(repo);
    await service.createRoleProjection(ctx, 'school-1', { schoolId: 'school-1', targetRole: 'teacher', projectionSummary: 'T1' });
    await service.createRoleProjection(ctx, 'school-1', { schoolId: 'school-1', targetRole: 'admin', projectionSummary: 'A1' });
    const result = await service.listRoleProjectionsByRole('teacher');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
    expect(result.data?.[0].targetRole).toBe('teacher');
  });

  it('listRoleProjectionsByActor filters by actorRef', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository();
    const service = new RecoveryExecutionReadinessBoardProjectionService(repo);
    await service.createRoleProjection(ctx, 'school-1', { schoolId: 'school-1', targetRole: 'teacher', projectionSummary: 'T1', actorId: 'actor-1' });
    const result = await service.listRoleProjectionsByActor('actor-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
  });

  it('markRoleProjectionReviewReady changes projectionStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository();
    const service = new RecoveryExecutionReadinessBoardProjectionService(repo);
    const created = await service.createRoleProjection(ctx, 'school-1', { schoolId: 'school-1', targetRole: 'teacher', projectionSummary: 'T1' });
    const id = created.data!.boardRoleProjectionId;
    const result = await service.markRoleProjectionReviewReady(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.projectionStatus).toBe('review_ready');
  });

  it('suppressRoleProjection works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository();
    const service = new RecoveryExecutionReadinessBoardProjectionService(repo);
    const created = await service.createRoleProjection(ctx, 'school-1', { schoolId: 'school-1', targetRole: 'teacher', projectionSummary: 'T1' });
    const id = created.data!.boardRoleProjectionId;
    const result = await service.suppressRoleProjection(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('suppressed');
  });

  it('blockRoleProjection works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository();
    const service = new RecoveryExecutionReadinessBoardProjectionService(repo);
    const created = await service.createRoleProjection(ctx, 'school-1', { schoolId: 'school-1', targetRole: 'teacher', projectionSummary: 'T1' });
    const id = created.data!.boardRoleProjectionId;
    const result = await service.blockRoleProjection(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('voidRoleProjection works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRoleProjectionRepository();
    const service = new RecoveryExecutionReadinessBoardProjectionService(repo);
    const created = await service.createRoleProjection(ctx, 'school-1', { schoolId: 'school-1', targetRole: 'teacher', projectionSummary: 'T1' });
    const id = created.data!.boardRoleProjectionId;
    const result = await service.voidRoleProjection(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('voided');
  });
});
