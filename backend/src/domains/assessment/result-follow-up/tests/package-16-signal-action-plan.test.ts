import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultFollowUpSignalRepository,
  InMemoryResultFollowUpActionPlanRepository,
} from '../repositories/inMemoryResultFollowUpRepositories';

function makeSignalInput() {
  return {
    resultFollowUpCaseId: 'case-1',
    studentRef: 'student-1',
    signalType: 'result_drop_pattern' as const,
    signalSeverity: 'high' as const,
    signalSource: 'system_detection',
    safeSignalSummary: 'Detected result drop pattern',
    evidenceRefs: { patternId: 'pattern-1' } as Record<string, unknown>,
    reasonCodes: { trigger: 'drop_detected' } as Record<string, unknown>,
  };
}

function makeActionPlanInput() {
  return {
    resultFollowUpCaseId: 'case-1',
    studentRef: 'student-1',
    planMode: 'mock_action_only',
    safePlanSummary: 'Action plan for academic support',
    recommendedActions: { tutoring: true } as Record<string, unknown>,
    teacherReviewNotes: {} as Record<string, unknown>,
  };
}

describe('Package 16 — Signal & Action Plan', () => {
  let signalRepo: InMemoryResultFollowUpSignalRepository;
  let planRepo: InMemoryResultFollowUpActionPlanRepository;

  beforeEach(() => {
    signalRepo = new InMemoryResultFollowUpSignalRepository();
    planRepo = new InMemoryResultFollowUpActionPlanRepository();
  });

  describe('Signal lifecycle', () => {
    it('can create a signal for a case', async () => {
      const s = await signalRepo.create({
        ...makeSignalInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      expect(s).toBeDefined();
      expect(s.resultFollowUpSignalId).toBeTruthy();
      expect(s.signalStatus).toBe('active');
      expect(s.resultFollowUpCaseId).toBe('case-1');
    });

    it('can list signals by case', async () => {
      await signalRepo.create({
        ...makeSignalInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const signals = await signalRepo.listByCaseId('case-1');
      expect(signals.length).toBeGreaterThanOrEqual(1);
      expect(signals[0].resultFollowUpCaseId).toBe('case-1');
    });

    it('can list signals by student', async () => {
      await signalRepo.create({
        ...makeSignalInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const signals = await signalRepo.listByStudentRef('school-1', 'student-1');
      expect(signals.length).toBeGreaterThanOrEqual(1);
    });

    it('can suppress a signal', async () => {
      const s = await signalRepo.create({
        ...makeSignalInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const suppressed = await signalRepo.suppress(s.resultFollowUpSignalId, 'POLICY_SUPPRESSED', 'Suppressed');
      expect(suppressed.signalStatus).toBe('suppressed');
      expect(suppressed.suppressedAt).toBeTruthy();
    });

    it('can void a signal', async () => {
      const s = await signalRepo.create({
        ...makeSignalInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const voided = await signalRepo.void(s.resultFollowUpSignalId, 'USER_REQUEST', 'Voided');
      expect(voided.signalStatus).toBe('void');
      expect(voided.voidedAt).toBeTruthy();
    });
  });

  describe('Action plan lifecycle', () => {
    it('can create an action plan for a case', async () => {
      const p = await planRepo.create({
        ...makeActionPlanInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      expect(p).toBeDefined();
      expect(p.resultFollowUpActionPlanId).toBeTruthy();
      expect(p.planStatus).toBe('draft');
    });

    it('can mark action plan teacher_review_ready', async () => {
      const p = await planRepo.create({
        ...makeActionPlanInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const ready = await planRepo.markReviewReady(p.resultFollowUpActionPlanId);
      expect(ready.planStatus).toBe('teacher_review_ready');
    });

    it('can approve action plan for future use', async () => {
      const p = await planRepo.create({
        ...makeActionPlanInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      await planRepo.markReviewReady(p.resultFollowUpActionPlanId);
      const approved = await planRepo.approveForFutureUse(p.resultFollowUpActionPlanId);
      expect(approved.planStatus).toBe('approved_for_future_use');
      expect(approved.approvedForFutureUseAt).toBeTruthy();
    });

    it('can suppress action plan', async () => {
      const p = await planRepo.create({
        ...makeActionPlanInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const suppressed = await planRepo.suppress(p.resultFollowUpActionPlanId, 'POLICY_SUPPRESSED', 'Suppressed');
      expect(suppressed.planStatus).toBe('suppressed');
      expect(suppressed.suppressedAt).toBeTruthy();
    });

    it('can block action plan', async () => {
      const p = await planRepo.create({
        ...makeActionPlanInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const blocked = await planRepo.block(p.resultFollowUpActionPlanId, 'POLICY_BLOCKED', 'Blocked');
      expect(blocked.planStatus).toBe('blocked');
    });

    it('can void action plan', async () => {
      const p = await planRepo.create({
        ...makeActionPlanInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const voided = await planRepo.void(p.resultFollowUpActionPlanId, 'USER_REQUEST', 'Voided');
      expect(voided.planStatus).toBe('void');
      expect(voided.voidedAt).toBeTruthy();
    });

    it('action plan does not execute actions', () => {
      const methods = Object.getOwnPropertyNames(InMemoryResultFollowUpActionPlanRepository.prototype);
      expect(methods).not.toContain('executeAction');
      expect(methods).not.toContain('runAction');
    });

    it('action plan does not call AI', () => {
      const methods = Object.getOwnPropertyNames(InMemoryResultFollowUpActionPlanRepository.prototype);
      expect(methods).not.toContain('callAi');
      expect(methods).not.toContain('generateAiNarrative');
      expect(methods).not.toContain('invokeModel');
    });
  });
});
