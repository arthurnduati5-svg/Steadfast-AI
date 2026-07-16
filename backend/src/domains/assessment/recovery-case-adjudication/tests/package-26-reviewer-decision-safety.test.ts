import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryReviewerDecisionRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseReviewerDecisionService } from '../services/recoveryCaseReviewerDecisionService';
import { RecoveryCaseAdjudicationCommandContext, AdjudicationDecisionCodes, ForbiddenAdjudicationStatuses } from '../contracts';

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

describe('Package 26 - Reviewer Decision Safety', () => {
  let decisionRepo: InMemoryReviewerDecisionRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseReviewerDecisionService;
  const schoolA = 'school-a';
  const schoolB = 'school-b';

  beforeEach(() => {
    decisionRepo = new InMemoryReviewerDecisionRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseReviewerDecisionService(decisionRepo, auditRepo);
  });

  it('create reviewer decision with all allowed decision codes', async () => {
    for (const code of AdjudicationDecisionCodes) {
      const result = await service.createReviewerDecisionDraft(makeCtx(), {
        schoolId: schoolA,
        queueItemId: 'queue-1',
        reviewerActorId: 'reviewer-1',
        reviewerRole: 'teacher',
        reviewerPosition: 'primary',
        decisionCode: code,
        safeDecisionSummary: `Decision: ${code}`,
        reasonCodes: {},
        sourceRefs: {},
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      expect(result.success).toBe(true);
      expect(result.data!.decisionCode).toBe(code);
    }
  });

  it('decision starts as draft', async () => {
    const result = await service.createReviewerDecisionDraft(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'Test', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    expect(result.data!.decisionStatus).toBe('draft');
  });

  it('mark review ready', async () => {
    const result = await service.createReviewerDecisionDraft(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'Test', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const ready = await service.markReviewerDecisionReviewReady(result.data!.reviewerDecisionId);
    expect(ready.success).toBe(true);
    expect(ready.data!.decisionStatus).toBe('review_ready');
  });

  it('block decision', async () => {
    const result = await service.createReviewerDecisionDraft(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'Test', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const blocked = await service.blockReviewerDecision(result.data!.reviewerDecisionId, ['governance_violation']);
    expect(blocked.success).toBe(true);
    expect(blocked.data!.decisionStatus).toBe('blocked');
  });

  it('suppress decision', async () => {
    const result = await service.createReviewerDecisionDraft(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'Test', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const suppressed = await service.suppressReviewerDecision(result.data!.reviewerDecisionId);
    expect(suppressed.success).toBe(true);
    expect(suppressed.data!.decisionStatus).toBe('suppressed');
  });

  it('void decision', async () => {
    const result = await service.createReviewerDecisionDraft(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'Test', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const voided = await service.voidReviewerDecision(result.data!.reviewerDecisionId);
    expect(voided.success).toBe(true);
    expect(voided.data!.decisionStatus).toBe('void');
  });

  it('list by queue item', async () => {
    await service.createReviewerDecisionDraft(makeCtx(), {
      schoolId: schoolA, queueItemId: 'qi-target', reviewerActorId: 'r1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'T', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const list = await service.listReviewerDecisionsForQueueItem(schoolA, 'qi-target');
    expect(list.success).toBe(true);
    expect(list.data).toHaveLength(1);
  });

  it('list by reviewer', async () => {
    await service.createReviewerDecisionDraft(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'rev-x', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'X', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const list = await service.listReviewerDecisionsByReviewer(schoolA, 'rev-x');
    expect(list.success).toBe(true);
    expect(list.data).toHaveLength(1);
  });

  it('list by status', async () => {
    const result = await service.createReviewerDecisionDraft(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'Draft', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const list = await service.listReviewerDecisionsByStatus(schoolA, 'draft');
    expect(list.success).toBe(true);
    expect(list.data!.some(d => d.reviewerDecisionId === result.data!.reviewerDecisionId)).toBe(true);
  });

  it('school isolation', async () => {
    const a = await service.createReviewerDecisionDraft(makeCtx({ schoolId: schoolA }), {
      schoolId: schoolA, queueItemId: 'q1', reviewerActorId: 'r1', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'A', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const b = await service.createReviewerDecisionDraft(makeCtx({ schoolId: schoolB }), {
      schoolId: schoolB, queueItemId: 'q2', reviewerActorId: 'r2', reviewerRole: 'teacher', reviewerPosition: 'primary', decisionCode: 'confirm_priority', safeDecisionSummary: 'B', reasonCodes: {}, sourceRefs: {}, createdByActorId: 'a2', createdByRole: 'teacher',
    });
    const listA = await service.listReviewerDecisionsForSchool(schoolA);
    const listB = await service.listReviewerDecisionsForSchool(schoolB);
    expect(listA.data).toHaveLength(1);
    expect(listB.data).toHaveLength(1);
    const foundA = await decisionRepo.getById(a.data!.reviewerDecisionId);
    const foundB = await decisionRepo.getById(b.data!.reviewerDecisionId);
    expect(foundA?.schoolId).toBe(schoolA);
    expect(foundB?.schoolId).toBe(schoolB);
  });

  it('forbidden statuses like executed, assigned, sent are NOT in the allowed values', () => {
    const forbidden = ForbiddenAdjudicationStatuses;
    expect(forbidden).toContain('executed');
    expect(forbidden).toContain('assigned');
    expect(forbidden).toContain('sent');
    const allowedStatuses = ['draft', 'review_ready', 'needs_second_review', 'needs_more_evidence', 'blocked', 'suppressed', 'void', 'archived_ready'];
    for (const fs of ['executed', 'assigned', 'sent', 'published', 'authorized_live']) {
      expect(allowedStatuses).not.toContain(fs);
    }
  });
});
