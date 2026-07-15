import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultFollowUpCaseRepository,
  InMemoryFollowUpAuditRepository,
  InMemoryFollowUpIdempotencyRepository,
} from '../repositories/inMemoryResultFollowUpRepositories';

function makeCreateInput() {
  return {
    studentRef: 'student-1',
    resultFinalizationDecisionId: 'finalization-1',
    resultReleaseReadinessId: 'readiness-1',
    resultReleasePacketId: 'packet-1',
    resultReportCardAssemblyId: 'assembly-1',
    resultReportCardAudienceProjectionId: 'projection-1',
    resultReportCardAccessGrantId: 'grant-1',
    resultReportCardAccessSummaryId: 'summary-1',
    caseType: 'academic_support' as const,
    casePriority: 'medium' as const,
    caseMode: 'mock_action_only' as const,
    safeCaseSummary: 'Follow-up for academic support',
    sourceRefs: { finalizationId: 'finalization-1', readinessId: 'readiness-1' } as Record<string, unknown>,
    triggerReasons: { dropDetected: true } as Record<string, unknown>,
    allowedActions: { createSignal: true } as Record<string, unknown>,
    blockedActions: {} as Record<string, unknown>,
    blockedReasonCodes: {} as Record<string, unknown>,
  };
}

describe('Package 16 — Follow-Up Case Lifecycle', () => {
  let caseRepo: InMemoryResultFollowUpCaseRepository;

  beforeEach(() => {
    caseRepo = new InMemoryResultFollowUpCaseRepository();
  });

  it('can create follow-up case from valid previous-package references', async () => {
    const c = await caseRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(c).toBeDefined();
    expect(c.resultFollowUpCaseId).toBeTruthy();
    expect(c.caseStatus).toBe('draft');
    expect(c.schoolId).toBe('school-1');
    expect(c.studentRef).toBe('student-1');
    expect(c.resultFinalizationDecisionId).toBe('finalization-1');
    expect(c.resultReleaseReadinessId).toBe('readiness-1');
    expect(c.resultReleasePacketId).toBe('packet-1');
    expect(c.resultReportCardAssemblyId).toBe('assembly-1');
    expect(c.resultReportCardAudienceProjectionId).toBe('projection-1');
    expect(c.resultReportCardAccessGrantId).toBe('grant-1');
    expect(c.resultReportCardAccessSummaryId).toBe('summary-1');
  });

  it('creation without source references is NOT blocked at repository level (service-level validation)', async () => {
    const input = { ...makeCreateInput(), sourceRefs: {} as Record<string, unknown> };
    const c = await caseRepo.create({
      ...input,
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(c).toBeDefined();
    expect(c.sourceRefsJson).toEqual({});
  });

  it('wrong school scope is blocked by filtering (list-only)', async () => {
    await caseRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const wrongSchool = await caseRepo.listBySchool('school-99');
    expect(wrongSchool).toHaveLength(0);
    const sameSchool = await caseRepo.listBySchool('school-1');
    expect(sameSchool.length).toBeGreaterThanOrEqual(1);
  });

  it('lifecycle: draft -> opened -> triaged -> planned -> under_review -> closed', async () => {
    const c = await caseRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(c.caseStatus).toBe('draft');

    const opened = await caseRepo.open(c.resultFollowUpCaseId, 'POLICY_ALLOWED', 'Opened');
    expect(opened.caseStatus).toBe('opened');
    expect(opened.openedAt).toBeTruthy();

    const triaged = await caseRepo.triage(opened.resultFollowUpCaseId, 'POLICY_ALLOWED', 'Triaged');
    expect(triaged.caseStatus).toBe('triaged');
    expect(triaged.triagedAt).toBeTruthy();

    const planned = await caseRepo.markPlanned(triaged.resultFollowUpCaseId, 'POLICY_ALLOWED', 'Planned');
    expect(planned.caseStatus).toBe('planned');
    expect(planned.plannedAt).toBeTruthy();

    const reviewed = await caseRepo.markUnderReview(planned.resultFollowUpCaseId, 'POLICY_ALLOWED', 'Under review');
    expect(reviewed.caseStatus).toBe('under_review');
    expect(reviewed.reviewedAt).toBeTruthy();

    const closed = await caseRepo.close(reviewed.resultFollowUpCaseId, 'POLICY_ALLOWED', 'Closed');
    expect(closed.caseStatus).toBe('closed');
    expect(closed.closedAt).toBeTruthy();
  });

  it('case can be blocked', async () => {
    const c = await caseRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const blocked = await caseRepo.block(c.resultFollowUpCaseId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.caseStatus).toBe('blocked');
    expect(blocked.blockedAt).toBeTruthy();
  });

  it('case can be voided', async () => {
    const c = await caseRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const voided = await caseRepo.void(c.resultFollowUpCaseId, 'USER_REQUEST', 'Voided');
    expect(voided.caseStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('case does not send notification', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultFollowUpCaseRepository.prototype);
    expect(methods).not.toContain('sendNotification');
    expect(methods).not.toContain('sendEmail');
    expect(methods).not.toContain('notify');
  });

  it('case does not create live teacher task', () => {
    const methods = Object.getOwnPropertyNames(InMemoryResultFollowUpCaseRepository.prototype);
    expect(methods).not.toContain('createLiveTask');
    expect(methods).not.toContain('assignLiveTask');
  });

  it('case does not change scores', async () => {
    const c = await caseRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const updated = await caseRepo.update(c.resultFollowUpCaseId, { safeCaseSummary: 'Updated summary' });
    expect(updated.safeCaseSummary).toBe('Updated summary');
    expect(updated).not.toHaveProperty('score');
    expect(updated).not.toHaveProperty('grade');
  });

  it('case does not mutate Package 15 access records', async () => {
    const c = await caseRepo.create({
      ...makeCreateInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(c).not.toHaveProperty('grantStatus');
    expect(c).not.toHaveProperty('portalUrl');
    expect(c).not.toHaveProperty('accessToken');
  });
});
