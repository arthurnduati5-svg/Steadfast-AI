import { describe, it, expect, beforeEach } from 'vitest';
import { InMemorySecondReviewRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCaseSecondReviewService } from '../services/recoveryCaseSecondReviewService';
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

describe('Package 26 - Second Review Governance', () => {
  let secondReviewRepo: InMemorySecondReviewRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCaseSecondReviewService;
  const schoolA = 'school-a';
  const schoolB = 'school-b';

  beforeEach(() => {
    secondReviewRepo = new InMemorySecondReviewRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCaseSecondReviewService(secondReviewRepo, auditRepo);
  });

  it('create second review request with draft status', async () => {
    const result = await service.createSecondReviewRequest(makeCtx(), {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      primaryDecisionId: 'decision-1',
      requestedReviewerRole: 'department_head',
      requestReasonCodes: { reason: 'needs_senior_review' },
      safeRequestSummary: 'Second review needed',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data!.secondReviewRequestId).toBeTruthy();
    expect(result.data!.requestStatus).toBe('draft');
  });

  it('primary decision is tracked', async () => {
    const result = await service.createSecondReviewRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'pd-42', requestedReviewerRole: 'department_head', requestReasonCodes: {}, safeRequestSummary: 'Track primary', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    expect(result.data!.primaryDecisionId).toBe('pd-42');
  });

  it('request starts as draft', async () => {
    const result = await service.createSecondReviewRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'pd-1', requestedReviewerRole: 'department_head', requestReasonCodes: {}, safeRequestSummary: 'Draft test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    expect(result.data!.requestStatus).toBe('draft');
  });

  it('mark review ready', async () => {
    const result = await service.createSecondReviewRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'pd-1', requestedReviewerRole: 'department_head', requestReasonCodes: {}, safeRequestSummary: 'Ready', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const ready = await service.markSecondReviewReviewReady(result.data!.secondReviewRequestId);
    expect(ready.success).toBe(true);
    expect(ready.data!.requestStatus).toBe('review_ready');
  });

  it('mark awaiting distinct reviewer', async () => {
    const result = await service.createSecondReviewRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'pd-1', requestedReviewerRole: 'department_head', requestReasonCodes: {}, safeRequestSummary: 'Awaiting', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const awaiting = await service.markAwaitingDistinctReviewer(result.data!.secondReviewRequestId);
    expect(awaiting.success).toBe(true);
    expect(awaiting.data!.requestStatus).toBe('awaiting_distinct_reviewer');
  });

  it('mark review received', async () => {
    const result = await service.createSecondReviewRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'pd-1', requestedReviewerRole: 'department_head', requestReasonCodes: {}, safeRequestSummary: 'Received', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const received = await service.markSecondReviewReceived(result.data!.secondReviewRequestId);
    expect(received.success).toBe(true);
    expect(received.data!.requestStatus).toBe('review_received');
  });

  it('block and suppress', async () => {
    const result = await service.createSecondReviewRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'pd-1', requestedReviewerRole: 'department_head', requestReasonCodes: {}, safeRequestSummary: 'Block/suppress', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const blocked = await service.blockSecondReviewRequest(result.data!.secondReviewRequestId, ['duplicate_request']);
    expect(blocked.success).toBe(true);
    expect(blocked.data!.requestStatus).toBe('blocked');
    const suppressed = await service.suppressSecondReviewRequest(result.data!.secondReviewRequestId);
    expect(suppressed.success).toBe(true);
    expect(suppressed.data!.requestStatus).toBe('suppressed');
  });

  it('void', async () => {
    const result = await service.createSecondReviewRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'pd-1', requestedReviewerRole: 'department_head', requestReasonCodes: {}, safeRequestSummary: 'Void test', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const voided = await service.voidSecondReviewRequest(result.data!.secondReviewRequestId);
    expect(voided.success).toBe(true);
    expect(voided.data!.requestStatus).toBe('void');
    expect(voided.data!.voidedAt).toBeTruthy();
  });

  it('school isolation', async () => {
    const a = await service.createSecondReviewRequest(makeCtx({ schoolId: schoolA }), {
      schoolId: schoolA, queueItemId: 'q1', primaryDecisionId: 'pd-1', requestedReviewerRole: 'department_head', requestReasonCodes: {}, safeRequestSummary: 'A', createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const b = await service.createSecondReviewRequest(makeCtx({ schoolId: schoolB }), {
      schoolId: schoolB, queueItemId: 'q2', primaryDecisionId: 'pd-2', requestedReviewerRole: 'lead_teacher', requestReasonCodes: {}, safeRequestSummary: 'B', createdByActorId: 'a2', createdByRole: 'teacher',
    });
    const listA = await service.listSecondReviewRequestsForSchool(schoolA);
    const listB = await service.listSecondReviewRequestsForSchool(schoolB);
    expect(listA.data).toHaveLength(1);
    expect(listB.data).toHaveLength(1);
    const foundA = await secondReviewRepo.getById(a.data!.secondReviewRequestId);
    const foundB = await secondReviewRepo.getById(b.data!.secondReviewRequestId);
    expect(foundA?.schoolId).toBe(schoolA);
    expect(foundB?.schoolId).toBe(schoolB);
  });

  it('the service does NOT have a dispatch or assign method', () => {
    expect(typeof (service as any).dispatchSecondReview).toBe('undefined');
    expect(typeof (service as any).assignSecondReview).toBe('undefined');
  });
});
