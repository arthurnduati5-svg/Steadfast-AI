import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryStudentReflectionTaskDraftRepository,
} from '../repositories/inMemoryResultFollowUpRepositories';
import { ResultFollowUpSafetyService } from '../services/resultFollowUpSafetyService';

function makeDraftInput() {
  return {
    resultFollowUpCaseId: 'case-1',
    resultFollowUpActionPlanId: 'plan-1',
    studentRef: 'student-1',
    draftMode: 'mock_only',
    safeReflectionPrompt: 'What did you learn from this topic?',
    reflectionObjectiveRefs: { objectiveId: 'obj-1' } as Record<string, unknown>,
    scaffoldSteps: { step1: 'Reflect' } as Record<string, unknown>,
  };
}

describe('Package 16 — Student Reflection Safety', () => {
  let draftRepo: InMemoryStudentReflectionTaskDraftRepository;
  let safety: ResultFollowUpSafetyService;

  beforeEach(() => {
    draftRepo = new InMemoryStudentReflectionTaskDraftRepository();
    safety = new ResultFollowUpSafetyService();
  });

  it('can create a student reflection task draft', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(d).toBeDefined();
    expect(d.studentReflectionTaskDraftId).toBeTruthy();
    expect(d.draftStatus).toBe('draft');
  });

  it('can mark student reflection draft review_ready', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const ready = await draftRepo.markReviewReady(d.studentReflectionTaskDraftId);
    expect(ready.draftStatus).toBe('review_ready');
  });

  it('can approve student reflection draft for future use', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    await draftRepo.markReviewReady(d.studentReflectionTaskDraftId);
    const approved = await draftRepo.approveForFutureUse(d.studentReflectionTaskDraftId);
    expect(approved.draftStatus).toBe('approved_for_future_use');
    expect(approved.approvedForFutureUseAt).toBeTruthy();
  });

  it('can suppress student reflection draft', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const suppressed = await draftRepo.suppress(d.studentReflectionTaskDraftId, 'POLICY_SUPPRESSED', 'Suppressed');
    expect(suppressed.draftStatus).toBe('suppressed');
    expect(suppressed.suppressedAt).toBeTruthy();
  });

  it('can block student reflection draft', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const blocked = await draftRepo.block(d.studentReflectionTaskDraftId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.draftStatus).toBe('blocked');
  });

  it('can void student reflection draft', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const voided = await draftRepo.void(d.studentReflectionTaskDraftId, 'USER_REQUEST', 'Voided');
    expect(voided.draftStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('answer leakage is blocked (safety check on payload with correctAnswer)', () => {
    const result = safety.assertStudentReflectionSafe({ correctAnswer: '42' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_LEAKAGE');
  });

  it('answer leakage is blocked (safety check on payload with finalAnswer)', () => {
    const result = safety.assertStudentReflectionSafe({ finalAnswer: 'B' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_LEAKAGE');
  });

  it('hidden reasoning leakage is blocked', () => {
    const result = safety.assertStudentReflectionSafe({ hiddenReasoning: 'step-by-step' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('HIDDEN_REASONING_LEAKAGE');
  });

  it('student notification payload is blocked', () => {
    const result = safety.assertStudentReflectionSafe({ studentNotificationPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('NOTIFICATION_PAYLOAD');
  });

  it('reflection draft is not assigned live', () => {
    const methods = Object.getOwnPropertyNames(InMemoryStudentReflectionTaskDraftRepository.prototype);
    expect(methods).not.toContain('assignLive');
    expect(methods).not.toContain('publishToStudent');
  });
});
