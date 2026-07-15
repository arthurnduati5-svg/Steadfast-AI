import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryParentGuidanceDraftRepository,
} from '../repositories/inMemoryResultFollowUpRepositories';
import { ResultFollowUpSafetyService } from '../services/resultFollowUpSafetyService';

function makeDraftInput() {
  return {
    resultFollowUpCaseId: 'case-1',
    resultFollowUpActionPlanId: 'plan-1',
    studentRef: 'student-1',
    audienceType: 'parent',
    draftMode: 'mock_only',
    safeGuidanceSummary: 'Parent guidance for academic support',
    safeGuidanceBody: { tips: ['Encourage daily practice'] } as Record<string, unknown>,
    allowedFieldNames: { safeSummary: true } as Record<string, unknown>,
    blockedFieldNames: {} as Record<string, unknown>,
  };
}

describe('Package 16 — Parent Guidance Safety', () => {
  let draftRepo: InMemoryParentGuidanceDraftRepository;
  let safety: ResultFollowUpSafetyService;

  beforeEach(() => {
    draftRepo = new InMemoryParentGuidanceDraftRepository();
    safety = new ResultFollowUpSafetyService();
  });

  it('can create a parent guidance draft', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(d).toBeDefined();
    expect(d.parentGuidanceDraftId).toBeTruthy();
    expect(d.draftStatus).toBe('draft');
  });

  it('can mark parent guidance draft review_ready', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const ready = await draftRepo.markReviewReady(d.parentGuidanceDraftId);
    expect(ready.draftStatus).toBe('review_ready');
  });

  it('can approve parent guidance draft for future use', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    await draftRepo.markReviewReady(d.parentGuidanceDraftId);
    const approved = await draftRepo.approveForFutureUse(d.parentGuidanceDraftId);
    expect(approved.draftStatus).toBe('approved_for_future_use');
    expect(approved.approvedForFutureUseAt).toBeTruthy();
  });

  it('can suppress parent guidance draft', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const suppressed = await draftRepo.suppress(d.parentGuidanceDraftId, 'POLICY_SUPPRESSED', 'Suppressed');
    expect(suppressed.draftStatus).toBe('suppressed');
    expect(suppressed.suppressedAt).toBeTruthy();
  });

  it('can block parent guidance draft', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const blocked = await draftRepo.block(d.parentGuidanceDraftId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.draftStatus).toBe('blocked');
  });

  it('can void parent guidance draft', async () => {
    const d = await draftRepo.create({
      ...makeDraftInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const voided = await draftRepo.void(d.parentGuidanceDraftId, 'USER_REQUEST', 'Voided');
    expect(voided.draftStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('answer key leakage is blocked (safety service assertNoAnswerKeyLeakage)', () => {
    const result = safety.assertNoAnswerKeyLeakage({ answerKeyText: 'secret' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('ANSWER_KEY_LEAKAGE');
  });

  it('raw rubric leakage is blocked (assertNoRubricLeakage)', () => {
    const result = safety.assertNoRubricLeakage({ rubricInternal: 'internal rubric' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RUBRIC_LEAKAGE');
  });

  it('raw student answer leakage is blocked (assertNoRawStudentAnswerLeakage)', () => {
    const result = safety.assertNoRawStudentAnswerLeakage({ rawStudentAnswer: 'student answer' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('RAW_STUDENT_ANSWER_LEAKAGE');
  });

  it('teacher-only leakage is blocked (assertNoTeacherOnlyLeakage)', () => {
    const result = safety.assertNoTeacherOnlyLeakage({ markingNotesTeacherOnly: 'notes' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('TEACHER_ONLY_LEAKAGE');
  });

  it('hidden reasoning leakage is blocked (assertNoHiddenReasoningLeakage)', () => {
    const result = safety.assertNoHiddenReasoningLeakage({ hiddenReasoning: 'reasoning' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('HIDDEN_REASONING_LEAKAGE');
  });

  it('unsafe diagnosis is blocked (assertNoUnsafeDiagnosis)', () => {
    const result = safety.assertNoUnsafeDiagnosis({ diagnosis: 'medical diagnosis' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('UNSAFE_DIAGNOSIS');
  });

  it('notification payload is blocked (assertNoNotificationPayload)', () => {
    const result = safety.assertNoNotificationPayload({ parentNotificationPayload: {} });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('NOTIFICATION_PAYLOAD');
  });

  it('parent guidance draft is not sent', () => {
    const methods = Object.getOwnPropertyNames(InMemoryParentGuidanceDraftRepository.prototype);
    expect(methods).not.toContain('sendGuidance');
    expect(methods).not.toContain('sendToParent');
  });
});
