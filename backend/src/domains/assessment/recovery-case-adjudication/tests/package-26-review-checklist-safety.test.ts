import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryReviewChecklistRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseReviewChecklistService } from '../services/recoveryCaseReviewChecklistService';
import { RecoveryCaseAdjudicationCommandContext } from '../contracts';

function makeCtx(overrides?: Partial<RecoveryCaseAdjudicationCommandContext>): RecoveryCaseAdjudicationCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: 'ik-1',
    sourceRefsJson: {},
    ...overrides,
  };
}

describe('Package 26 - Review Checklist Safety', () => {
  let checklistRepo: InMemoryReviewChecklistRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseReviewChecklistService;

  beforeEach(() => {
    checklistRepo = new InMemoryReviewChecklistRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseReviewChecklistService(checklistRepo, auditRepo);
  });

  it('create review checklist', async () => {
    const result = await service.createReviewChecklist(makeCtx(), {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      checklistResults: { evidenceComplete: true, rubricApplied: true },
      safeChecklistSummary: 'Checklist created',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data!.reviewChecklistId).toBeTruthy();
    expect(result.data!.checklistOutcome).toBe('pending');
  });

  it('evaluate checklist - when all checks pass, outcome is ready', async () => {
    const result = await service.createReviewChecklist(makeCtx(), {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      checklistResults: { evidenceCheck: 'complete', rubricCheck: 'complete' },
      safeChecklistSummary: 'All good',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const evaluated = await service.evaluateReviewChecklist(result.data!.reviewChecklistId);
    expect(evaluated.success).toBe(true);
    expect(evaluated.data!.checklistOutcome).toBe('ready');
  });

  it('evaluate checklist - when insufficient evidence found, outcome is needs_more_evidence', async () => {
    const result = await service.createReviewChecklist(makeCtx(), {
      schoolId: 'school-1',
      queueItemId: 'queue-1',
      checklistResults: { evidenceCheck: 'insufficient_evidence', rubricCheck: 'complete' },
      safeChecklistSummary: 'Missing evidence',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const evaluated = await service.evaluateReviewChecklist(result.data!.reviewChecklistId);
    expect(evaluated.success).toBe(true);
    expect(evaluated.data!.checklistOutcome).toBe('needs_more_evidence');
  });

  it('list by queue item', async () => {
    await service.createReviewChecklist(makeCtx(), {
      schoolId: 'school-1', queueItemId: 'qi-target', checklistResults: {}, safeChecklistSummary: 'T', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const list = await service.listReviewChecklistsForQueueItem('school-1', 'qi-target');
    expect(list.success).toBe(true);
    expect(list.data).toHaveLength(1);
    expect(list.data![0].queueItemId).toBe('qi-target');
  });

  it('list by outcome', async () => {
    const result = await service.createReviewChecklist(makeCtx(), {
      schoolId: 'school-1', queueItemId: 'q1', checklistResults: {}, safeChecklistSummary: 'Test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    await service.evaluateReviewChecklist(result.data!.reviewChecklistId);
    const list = await service.listReviewChecklistsByOutcome('school-1', 'ready');
    expect(list.success).toBe(true);
  });

  it('block checklist', async () => {
    const result = await service.createReviewChecklist(makeCtx(), {
      schoolId: 'school-1', queueItemId: 'q1', checklistResults: {}, safeChecklistSummary: 'Test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const blocked = await service.blockChecklist(result.data!.reviewChecklistId, ['governance_block']);
    expect(blocked.success).toBe(true);
    expect(blocked.data!.checklistOutcome).toBe('blocked');
  });

  it('void checklist', async () => {
    const result = await service.createReviewChecklist(makeCtx(), {
      schoolId: 'school-1', queueItemId: 'q1', checklistResults: {}, safeChecklistSummary: 'Test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const voided = await service.voidChecklist(result.data!.reviewChecklistId);
    expect(voided.success).toBe(true);
    expect(voided.data!.checklistOutcome).toBe('blocked');
    expect(voided.data!.voidedAt).toBeTruthy();
  });
});
