import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardRiskService } from '../services/recoveryExecutionReadinessBoardRiskService';
import { InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Risk Signal Safety', () => {
  it('createRiskSignal returns signal with boardRiskSignalId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository();
    const service = new RecoveryExecutionReadinessBoardRiskService(repo);
    const result = await service.createRiskSignal(ctx, 'school-1', {
      schoolId: 'school-1',
      riskCategory: 'academic',
      riskSummary: 'Low performance',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardRiskSignalId).toBeDefined();
  });

  it('listRiskSignalsForSnapshot returns signals', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository();
    const service = new RecoveryExecutionReadinessBoardRiskService(repo);
    await service.createRiskSignal(ctx, 'school-1', { schoolId: 'school-1', boardSnapshotId: 'snap-1', riskCategory: 'academic', riskSummary: 'R1' });
    await service.createRiskSignal(ctx, 'school-1', { schoolId: 'school-1', boardSnapshotId: 'snap-1', riskCategory: 'behavioral', riskSummary: 'R2' });
    const result = await service.listRiskSignalsForSnapshot('snap-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('listRiskSignalsByRiskLevel filters by riskLevel', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository();
    const service = new RecoveryExecutionReadinessBoardRiskService(repo);
    await service.createRiskSignal(ctx, 'school-1', { schoolId: 'school-1', riskCategory: 'academic', riskSummary: 'Low', riskLevel: 'low' });
    await service.createRiskSignal(ctx, 'school-1', { schoolId: 'school-1', riskCategory: 'academic', riskSummary: 'High', riskLevel: 'high' });
    const result = await service.listRiskSignalsByRiskLevel('high');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
    expect(result.data?.[0].riskSummary).toBe('High');
  });

  it('markRiskSignalReviewReady changes riskStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository();
    const service = new RecoveryExecutionReadinessBoardRiskService(repo);
    const created = await service.createRiskSignal(ctx, 'school-1', { schoolId: 'school-1', riskCategory: 'academic', riskSummary: 'Test' });
    const id = created.data!.boardRiskSignalId;
    const result = await service.markRiskSignalReviewReady(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.riskStatus).toBe('review_ready');
  });

  it('suppressRiskSignal works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository();
    const service = new RecoveryExecutionReadinessBoardRiskService(repo);
    const created = await service.createRiskSignal(ctx, 'school-1', { schoolId: 'school-1', riskCategory: 'academic', riskSummary: 'Test' });
    const id = created.data!.boardRiskSignalId;
    const result = await service.suppressRiskSignal(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('suppressed');
  });

  it('blockRiskSignal works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardRiskSignalRepository();
    const service = new RecoveryExecutionReadinessBoardRiskService(repo);
    const created = await service.createRiskSignal(ctx, 'school-1', { schoolId: 'school-1', riskCategory: 'academic', riskSummary: 'Test' });
    const id = created.data!.boardRiskSignalId;
    const result = await service.blockRiskSignal(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('blocked');
  });
});
