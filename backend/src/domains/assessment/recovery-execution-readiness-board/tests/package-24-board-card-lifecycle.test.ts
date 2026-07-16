import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardCardService } from '../services/recoveryExecutionReadinessBoardCardService';
import { InMemoryRecoveryExecutionReadinessBoardCardRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Card Lifecycle', () => {
  it('createBoardCard returns card with boardCardId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    const result = await service.createBoardCard(ctx, 'school-1', {
      boardSnapshotId: 'snap-1',
      schoolId: 'school-1',
      laneKey: 'planning',
      cardKey: 'card-1',
      cardSummary: 'Test card',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardCardId).toBeDefined();
  });

  it('listBoardCardsForSnapshot returns cards', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1' });
    await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c2', cardSummary: 'C2' });
    const result = await service.listBoardCardsForSnapshot('snap-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('listBoardCardsByStatus filters cards', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1', cardStatus: 'draft' });
    await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c2', cardSummary: 'C2', cardStatus: 'ready' });
    const result = await service.listBoardCardsByStatus('ready');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
    expect(result.data?.[0].cardKey).toBe('c2');
  });

  it('listBoardCardsByPriority filters cards', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1', cardPriority: 'normal' });
    await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c2', cardSummary: 'C2', cardPriority: 'high' });
    const result = await service.listBoardCardsByPriority('high');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
    expect(result.data?.[0].cardKey).toBe('c2');
  });

  it('markBoardCardReady changes cardStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    const created = await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1' });
    const result = await service.markBoardCardReady(ctx, 'school-1', created.data!.boardCardId);
    expect(result.success).toBe(true);
    expect(result.data?.cardStatus).toBe('ready');
  });

  it('markBoardCardNeedsTeacherReview changes cardStatus to needs_teacher_review', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    const created = await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1' });
    const result = await service.markBoardCardNeedsTeacherReview(ctx, 'school-1', created.data!.boardCardId);
    expect(result.success).toBe(true);
    expect(result.data?.cardStatus).toBe('needs_teacher_review');
  });

  it('markBoardCardNeedsAdminReview changes cardStatus to needs_admin_review', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    const created = await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1' });
    const result = await service.markBoardCardNeedsAdminReview(ctx, 'school-1', created.data!.boardCardId);
    expect(result.success).toBe(true);
    expect(result.data?.cardStatus).toBe('needs_admin_review');
  });

  it('markBoardCardRiskFlagged changes cardStatus to risk_flagged', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    const created = await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1' });
    const result = await service.markBoardCardRiskFlagged(ctx, 'school-1', created.data!.boardCardId);
    expect(result.success).toBe(true);
    expect(result.data?.cardStatus).toBe('risk_flagged');
  });

  it('blockBoardCard works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    const created = await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1' });
    const result = await service.blockBoardCard(ctx, 'school-1', created.data!.boardCardId);
    expect(result.success).toBe(true);
    expect(result.data?.cardStatus).toBe('blocked');
  });

  it('voidBoardCard works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardCardRepository();
    const service = new RecoveryExecutionReadinessBoardCardService(repo);
    const created = await service.createBoardCard(ctx, 'school-1', { boardSnapshotId: 'snap-1', schoolId: 'school-1', laneKey: 'planning', cardKey: 'c1', cardSummary: 'C1' });
    const result = await service.voidBoardCard(ctx, 'school-1', created.data!.boardCardId);
    expect(result.success).toBe(true);
    expect(result.data?.cardStatus).toBe('voided');
  });
});
