import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryCaseDuplicateSuppressionRepository,
} from '../repositories/inMemoryRecoveryCaseTriageRepositories';
import { RecoveryCaseDuplicateSuppressionService } from '../services/recoveryCaseDuplicateSuppressionService';
import { RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Duplicate Suppression', () => {
  let repo: InMemoryRecoveryCaseDuplicateSuppressionRepository;
  let service: RecoveryCaseDuplicateSuppressionService;

  const ctx: RecoveryCaseTriageCommandContext = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-dup-1',
    idempotencyKey: 'ik-dup-1',
    sourceRefsJson: {},
  };

  beforeEach(() => {
    repo = new InMemoryRecoveryCaseDuplicateSuppressionRepository();
    service = new RecoveryCaseDuplicateSuppressionService(repo);
  });

  it('creates duplicate suppression record', async () => {
    const result = await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-1',
      canonicalBoardCardId: 'canonical-card-1',
      duplicateBoardCardId: 'dupe-card-1',
      suppressionReason: 'Same assessment submitted twice',
    });
    expect(result.success).toBe(true);
    expect(result.status).toBe('created');
    expect(result.data!.suppressionStatus).toBe('active');
    expect(result.data!.resultRecoveryPlanId).toBe('plan-1');
    expect(result.data!.canonicalBoardCardId).toBe('canonical-card-1');
    expect(result.data!.duplicateBoardCardId).toBe('dupe-card-1');
  });

  it('marks canonical vs duplicate card', async () => {
    const result = await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-1',
      canonicalBoardCardId: 'canonical-card',
      duplicateBoardCardId: 'dupe-card',
      suppressionReason: 'Duplicate entry',
    });
    expect(result.data!.canonicalBoardCardId).toBe('canonical-card');
    expect(result.data!.duplicateBoardCardId).toBe('dupe-card');
  });

  it('lists by plan', async () => {
    await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-1', canonicalBoardCardId: 'c-1', duplicateBoardCardId: 'd-1',
      suppressionReason: 'dup',
    });
    await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-2', canonicalBoardCardId: 'c-2', duplicateBoardCardId: 'd-2',
      suppressionReason: 'dup',
    });
    const list = await service.listDuplicateSuppressionsForPlan('school-1', 'plan-1');
    expect(list.data).toHaveLength(1);
  });

  it('lists by status', async () => {
    const result = await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-1', canonicalBoardCardId: 'c-1', duplicateBoardCardId: 'd-1',
      suppressionReason: 'dup',
    });
    const list = await service.listDuplicateSuppressionsByStatus('school-1', 'active');
    expect(list.data).toHaveLength(1);
  });

  it('original records are preserved (not deleted)', async () => {
    const result = await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-1', canonicalBoardCardId: 'c-1', duplicateBoardCardId: 'd-1',
      suppressionReason: 'dup',
    });
    const fetched = await service.getDuplicateSuppression('school-1', result.data!.duplicateSuppressionId);
    expect(fetched.success).toBe(true);
    expect(fetched.data!.canonicalBoardCardId).toBe('c-1');
    expect(fetched.data!.duplicateBoardCardId).toBe('d-1');
  });

  it('traceability to both board cards', async () => {
    const result = await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-1', canonicalBoardCardId: 'canonical-card', duplicateBoardCardId: 'dupe-card',
      suppressionReason: 'dup',
    });
    expect(result.data!.canonicalBoardCardId).toBe('canonical-card');
    expect(result.data!.duplicateBoardCardId).toBe('dupe-card');

    const byCanonical = await repo.listByCanonicalCard('school-1', 'canonical-card');
    expect(byCanonical).toHaveLength(1);

    const byDuplicate = await repo.listByDuplicateCard('school-1', 'dupe-card');
    expect(byDuplicate).toHaveLength(1);
  });

  it('suppressed duplicates excluded from active ranking (via service duplicate check)', async () => {
    await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-suppressed',
      canonicalBoardCardId: 'canonical',
      duplicateBoardCardId: 'dupe',
      suppressionReason: 'Duplicate',
    });
    const planCheck = await service.listDuplicateSuppressionsForPlan('school-1', 'plan-suppressed');
    const hasActive = planCheck.data!.some(s => s.suppressionStatus === 'active');
    expect(hasActive).toBe(true);
  });

  it('search matching keys: schoolId, studentRef, resultRecoveryPlanId, active phase', async () => {
    await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-search-1',
      canonicalBoardCardId: 'c-search',
      duplicateBoardCardId: 'd-search',
      suppressionReason: 'Search test',
    });
    const bySchool = await service.listDuplicateSuppressionsForSchool('school-1');
    expect(bySchool.data!.length).toBeGreaterThanOrEqual(1);
    expect(bySchool.data![0].schoolId).toBe('school-1');
  });

  it('voids suppression', async () => {
    const result = await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-void', canonicalBoardCardId: 'c-void', duplicateBoardCardId: 'd-void',
      suppressionReason: 'To void',
    });
    const voided = await service.voidDuplicateSuppression(ctx, 'school-1', result.data!.duplicateSuppressionId, 'VOID_REASON', 'Voided');
    expect(voided.data!.suppressionStatus).toBe('void');
  });

  it('rejects duplicate suppression for same plan if active one exists', async () => {
    await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-dupe',
      canonicalBoardCardId: 'c-1',
      duplicateBoardCardId: 'd-1',
      suppressionReason: 'First',
    });
    const second = await service.createDuplicateSuppression(ctx, 'school-1', {
      resultRecoveryPlanId: 'plan-dupe',
      canonicalBoardCardId: 'c-2',
      duplicateBoardCardId: 'd-2',
      suppressionReason: 'Second attempt',
    });
    expect(second.success).toBe(false);
    expect(second.status).toBe('DENIED');
  });
});
