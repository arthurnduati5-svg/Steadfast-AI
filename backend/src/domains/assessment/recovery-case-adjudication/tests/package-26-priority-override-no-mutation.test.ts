import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPriorityOverrideRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import { RecoveryCasePriorityOverrideService } from '../services/recoveryCasePriorityOverrideService';
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

describe('Package 26 - Priority Override No Mutation', () => {
  let overrideRepo: InMemoryPriorityOverrideRepository;
  let auditRepo: InMemoryAdjudicationAuditRepository;
  let service: RecoveryCasePriorityOverrideService;
  const schoolA = 'school-a';
  const schoolB = 'school-b';

  beforeEach(() => {
    overrideRepo = new InMemoryPriorityOverrideRepository();
    auditRepo = new InMemoryAdjudicationAuditRepository();
    service = new RecoveryCasePriorityOverrideService(overrideRepo, auditRepo);
  });

  it('create priority override request stores current score and band WITHOUT mutating Package 25', async () => {
    const result = await service.createPriorityOverrideRequest(makeCtx(), {
      schoolId: schoolA,
      queueItemId: 'queue-1',
      priorityAssessmentId: 'pa-1',
      currentPriorityScore: 75,
      currentPriorityBand: 'normal',
      requestedPriorityBand: 'high',
      safeOverrideRationale: 'Student needs urgent attention',
      reasonCodes: { rationale: 'recent_performance_drop' },
      supportingDecisionIds: ['dec-1'],
      supportingEvidenceBundleIds: ['eb-1'],
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data!.currentPriorityScore).toBe(75);
    expect(result.data!.currentPriorityBand).toBe('normal');
    expect(result.data!.requestedPriorityBand).toBe('high');
  });

  it('the service does NOT have applyPriorityOverride method', () => {
    expect(typeof (service as any).applyPriorityOverride).toBe('undefined');
  });

  it('override request defaults to draft status', async () => {
    const result = await service.createPriorityOverrideRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', priorityAssessmentId: 'pa-1', requestedPriorityBand: 'high', safeOverrideRationale: 'Test', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a1', createdByRole: 'teacher',
    });
    expect(result.data!.overrideStatus).toBe('draft');
  });

  it('mark review ready works', async () => {
    const result = await service.createPriorityOverrideRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', priorityAssessmentId: 'pa-1', requestedPriorityBand: 'high', safeOverrideRationale: 'Test', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const ready = await service.markPriorityOverrideReviewReady(result.data!.priorityOverrideRequestId);
    expect(ready.success).toBe(true);
    expect(ready.data!.overrideStatus).toBe('review_ready');
  });

  it('mark needs second review', async () => {
    const result = await service.createPriorityOverrideRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', priorityAssessmentId: 'pa-1', requestedPriorityBand: 'high', safeOverrideRationale: 'Test', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const needsSecond = await service.markPriorityOverrideNeedsSecondReview(result.data!.priorityOverrideRequestId);
    expect(needsSecond.success).toBe(true);
    expect(needsSecond.data!.overrideStatus).toBe('needs_second_review');
  });

  it('approve for future use sets status to approved_for_future_use (not applied)', async () => {
    const result = await service.createPriorityOverrideRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', priorityAssessmentId: 'pa-1', requestedPriorityBand: 'high', safeOverrideRationale: 'Test', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const approved = await service.approvePriorityOverrideForFutureUse(result.data!.priorityOverrideRequestId);
    expect(approved.success).toBe(true);
    expect(approved.data!.overrideStatus).toBe('approved_for_future_use');
    expect(approved.data!.overrideStatus).not.toBe('applied');
  });

  it('reject sets status to rejected', async () => {
    const result = await service.createPriorityOverrideRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', priorityAssessmentId: 'pa-1', requestedPriorityBand: 'high', safeOverrideRationale: 'Test', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const rejected = await service.rejectPriorityOverride(result.data!.priorityOverrideRequestId);
    expect(rejected.success).toBe(true);
    expect(rejected.data!.overrideStatus).toBe('rejected');
  });

  it('block adds reason codes', async () => {
    const result = await service.createPriorityOverrideRequest(makeCtx(), {
      schoolId: schoolA, queueItemId: 'q1', priorityAssessmentId: 'pa-1', requestedPriorityBand: 'high', safeOverrideRationale: 'Test', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const blocked = await service.blockPriorityOverride(result.data!.priorityOverrideRequestId, ['insufficient_evidence']);
    expect(blocked.success).toBe(true);
    expect(blocked.data!.overrideStatus).toBe('blocked');
    expect(blocked.data!.blockedReasonCodes).toEqual(['insufficient_evidence']);
  });

  it('school isolation', async () => {
    const a = await service.createPriorityOverrideRequest(makeCtx({ schoolId: schoolA }), {
      schoolId: schoolA, queueItemId: 'q1', priorityAssessmentId: 'pa-1', requestedPriorityBand: 'high', safeOverrideRationale: 'A', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a1', createdByRole: 'teacher',
    });
    const b = await service.createPriorityOverrideRequest(makeCtx({ schoolId: schoolB }), {
      schoolId: schoolB, queueItemId: 'q2', priorityAssessmentId: 'pa-2', requestedPriorityBand: 'low', safeOverrideRationale: 'B', reasonCodes: {}, supportingDecisionIds: [], supportingEvidenceBundleIds: [], createdByActorId: 'a2', createdByRole: 'teacher',
    });
    const listA = await service.listPriorityOverridesForSchool(schoolA);
    const listB = await service.listPriorityOverridesForSchool(schoolB);
    expect(listA.data).toHaveLength(1);
    expect(listB.data).toHaveLength(1);
    const foundA = await overrideRepo.getById(a.data!.priorityOverrideRequestId);
    const foundB = await overrideRepo.getById(b.data!.priorityOverrideRequestId);
    expect(foundA?.schoolId).toBe(schoolA);
    expect(foundB?.schoolId).toBe(schoolB);
  });
});
