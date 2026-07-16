import { describe, it, expect } from 'vitest';
import { RecoveryExecutionReadinessBoardGovernanceService } from '../services/recoveryExecutionReadinessBoardGovernanceService';
import { InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';

const ctx = {
  schoolId: 'school-1',
  actorId: 'actor-1',
  actorRole: 'admin',
  correlationId: 'corr-1',
  idempotencyKey: 'ik-1',
};

describe('Package 24 - Board Governance Note Safety', () => {
  it('createGovernanceNote returns note with boardGovernanceNoteId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository();
    const service = new RecoveryExecutionReadinessBoardGovernanceService(repo);
    const result = await service.createGovernanceNote(ctx, 'school-1', {
      schoolId: 'school-1',
      noteCategory: 'policy',
      noteSummary: 'Policy compliance note',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data?.boardGovernanceNoteId).toBeDefined();
  });

  it('listGovernanceNotesForSnapshot returns notes', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository();
    const service = new RecoveryExecutionReadinessBoardGovernanceService(repo);
    await service.createGovernanceNote(ctx, 'school-1', { schoolId: 'school-1', boardSnapshotId: 'snap-1', noteCategory: 'policy', noteSummary: 'N1' });
    await service.createGovernanceNote(ctx, 'school-1', { schoolId: 'school-1', boardSnapshotId: 'snap-1', noteCategory: 'compliance', noteSummary: 'N2' });
    const result = await service.listGovernanceNotesForSnapshot('snap-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(2);
  });

  it('listGovernanceNotesByActor filters by actor', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository();
    const service = new RecoveryExecutionReadinessBoardGovernanceService(repo);
    await service.createGovernanceNote(ctx, 'school-1', { schoolId: 'school-1', noteCategory: 'policy', noteSummary: 'N1' });
    const result = await service.listGovernanceNotesByActor('actor-1');
    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(1);
  });

  it('markGovernanceNoteReviewReady changes noteStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository();
    const service = new RecoveryExecutionReadinessBoardGovernanceService(repo);
    const created = await service.createGovernanceNote(ctx, 'school-1', { schoolId: 'school-1', noteCategory: 'policy', noteSummary: 'N1' });
    const id = created.data!.boardGovernanceNoteId;
    const result = await service.markGovernanceNoteReviewReady(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.data?.noteStatus).toBe('review_ready');
  });

  it('suppressGovernanceNote works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository();
    const service = new RecoveryExecutionReadinessBoardGovernanceService(repo);
    const created = await service.createGovernanceNote(ctx, 'school-1', { schoolId: 'school-1', noteCategory: 'policy', noteSummary: 'N1' });
    const id = created.data!.boardGovernanceNoteId;
    const result = await service.suppressGovernanceNote(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('suppressed');
  });

  it('voidGovernanceNote works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardGovernanceNoteRepository();
    const service = new RecoveryExecutionReadinessBoardGovernanceService(repo);
    const created = await service.createGovernanceNote(ctx, 'school-1', { schoolId: 'school-1', noteCategory: 'policy', noteSummary: 'N1' });
    const id = created.data!.boardGovernanceNoteId;
    const result = await service.voidGovernanceNote(ctx, 'school-1', id);
    expect(result.success).toBe(true);
    expect(result.status).toBe('voided');
  });
});
