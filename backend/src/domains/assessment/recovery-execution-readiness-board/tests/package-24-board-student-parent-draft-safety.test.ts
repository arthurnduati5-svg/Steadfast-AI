import { describe, it, expect } from 'vitest';
import {
  InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository,
  InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository,
} from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
import { CreateStudentSafeStatusDraftRequest, CreateParentSafeStatusDraftRequest } from '../contracts/index';

describe('Package 24 - Board Student/Parent Draft Safety', () => {
  it('createStudentSafeStatusDraft returns draft with boardStudentSafeDraftId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository();
    const body: CreateStudentSafeStatusDraftRequest = {
      schoolId: 'school-1',
      studentRef: 'student-1',
      safeStatusSummary: 'Student is on track',
    };
    const result = await repo.create(body as any);
    expect(result.boardStudentSafeDraftId).toBeDefined();
    expect(result.draftStatus).toBe('draft');
  });

  it('createParentSafeStatusDraft returns draft with boardParentSafeDraftId', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository();
    const body: CreateParentSafeStatusDraftRequest = {
      schoolId: 'school-1',
      studentRef: 'student-1',
      safeStatusSummary: 'Parent notified',
    };
    const result = await repo.create(body as any);
    expect(result.boardParentSafeDraftId).toBeDefined();
    expect(result.draftStatus).toBe('draft');
  });

  it('listStudentSafeStatusDraftsForPlan returns drafts', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository();
    await repo.create({ schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1', safeStatusSummary: 'S1' } as any);
    await repo.create({ schoolId: 'school-1', studentRef: 'student-2', resultRecoveryPlanId: 'plan-1', safeStatusSummary: 'S2' } as any);
    const results = await repo.listByPlanId('plan-1');
    expect(results.length).toBe(2);
  });

  it('listParentSafeStatusDraftsForPlan returns drafts', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository();
    await repo.create({ schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1', safeStatusSummary: 'P1' } as any);
    await repo.create({ schoolId: 'school-1', studentRef: 'student-2', resultRecoveryPlanId: 'plan-1', safeStatusSummary: 'P2' } as any);
    const results = await repo.listByPlanId('plan-1');
    expect(results.length).toBe(2);
  });

  it('markStudentSafeStatusDraftReviewReady changes draftStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository();
    const created = await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeStatusSummary: 'S1' } as any);
    const result = await repo.markReviewReady(created.boardStudentSafeDraftId);
    expect(result.draftStatus).toBe('review_ready');
  });

  it('markParentSafeStatusDraftReviewReady changes draftStatus', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository();
    const created = await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeStatusSummary: 'P1' } as any);
    const result = await repo.markReviewReady(created.boardParentSafeDraftId);
    expect(result.draftStatus).toBe('review_ready');
  });

  it('suppressStudentSafeStatusDraft works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository();
    const created = await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeStatusSummary: 'S1' } as any);
    const result = await repo.suppress(created.boardStudentSafeDraftId);
    expect(result.draftStatus).toBe('suppressed');
  });

  it('suppressParentSafeStatusDraft works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository();
    const created = await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeStatusSummary: 'P1' } as any);
    const result = await repo.suppress(created.boardParentSafeDraftId);
    expect(result.draftStatus).toBe('suppressed');
  });

  it('blockStudentSafeStatusDraft works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository();
    const created = await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeStatusSummary: 'S1' } as any);
    const result = await repo.block(created.boardStudentSafeDraftId);
    expect(result.draftStatus).toBe('blocked');
  });

  it('blockParentSafeStatusDraft works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository();
    const created = await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeStatusSummary: 'P1' } as any);
    const result = await repo.block(created.boardParentSafeDraftId);
    expect(result.draftStatus).toBe('blocked');
  });

  it('voidStudentSafeStatusDraft works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository();
    const created = await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeStatusSummary: 'S1' } as any);
    const result = await repo.void(created.boardStudentSafeDraftId);
    expect(result.draftStatus).toBe('voided');
    expect(result.voidedAt).toBeDefined();
  });

  it('voidParentSafeStatusDraft works', async () => {
    const repo = new InMemoryRecoveryExecutionReadinessBoardParentSafeStatusDraftRepository();
    const created = await repo.create({ schoolId: 'school-1', studentRef: 'student-1', safeStatusSummary: 'P1' } as any);
    const result = await repo.void(created.boardParentSafeDraftId);
    expect(result.draftStatus).toBe('voided');
    expect(result.voidedAt).toBeDefined();
  });
});
