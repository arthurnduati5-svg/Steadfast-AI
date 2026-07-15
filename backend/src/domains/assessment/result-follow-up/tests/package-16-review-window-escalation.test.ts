import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryFollowUpReviewWindowRepository,
  InMemoryFollowUpEscalationPlanRepository,
} from '../repositories/inMemoryResultFollowUpRepositories';

function makeWindowInput() {
  return {
    resultFollowUpCaseId: 'case-1',
    studentRef: 'student-1',
    windowMode: 'mock_only',
    safeWindowSummary: 'Review window for follow-up case',
    reviewWindowStartAt: '2026-08-01T00:00:00Z',
    reviewWindowEndAt: '2026-08-07T23:59:59Z',
    reviewCriteria: { scoreThreshold: 70 } as Record<string, unknown>,
  };
}

function makeEscalationInput() {
  return {
    resultFollowUpCaseId: 'case-1',
    studentRef: 'student-1',
    escalationMode: 'mock_preparation',
    escalationLevel: 'teacher_level_1',
    safeEscalationSummary: 'Escalation for review needed',
    reviewerRoleTargets: { leadTeacher: true } as Record<string, unknown>,
    allowedDisclosure: { safeSummary: true } as Record<string, unknown>,
    blockedDisclosure: { safeguardingDetails: true } as Record<string, unknown>,
  };
}

describe('Package 16 — Review Window & Escalation', () => {
  let windowRepo: InMemoryFollowUpReviewWindowRepository;
  let escalationRepo: InMemoryFollowUpEscalationPlanRepository;

  beforeEach(() => {
    windowRepo = new InMemoryFollowUpReviewWindowRepository();
    escalationRepo = new InMemoryFollowUpEscalationPlanRepository();
  });

  describe('Review window', () => {
    it('can create a review window', async () => {
      const w = await windowRepo.create({
        ...makeWindowInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      expect(w).toBeDefined();
      expect(w.followUpReviewWindowId).toBeTruthy();
      expect(w.windowStatus).toBe('draft');
    });

    it('can schedule_mock review window', async () => {
      const w = await windowRepo.create({
        ...makeWindowInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const scheduled = await windowRepo.scheduleMock(w.followUpReviewWindowId);
      expect(scheduled.windowStatus).toBe('scheduled_mock');
      expect(scheduled.scheduledMockAt).toBeTruthy();
    });

    it('can complete_mock review window', async () => {
      const w = await windowRepo.create({
        ...makeWindowInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      await windowRepo.scheduleMock(w.followUpReviewWindowId);
      const completed = await windowRepo.completeMock(w.followUpReviewWindowId);
      expect(completed.windowStatus).toBe('completed_mock');
      expect(completed.completedMockAt).toBeTruthy();
    });

    it('can cancel review window', async () => {
      const w = await windowRepo.create({
        ...makeWindowInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const cancelled = await windowRepo.cancel(w.followUpReviewWindowId, 'SCHEDULE_CONFLICT', 'Cancelled');
      expect(cancelled.windowStatus).toBe('cancelled');
      expect(cancelled.cancelledAt).toBeTruthy();
    });

    it('can void review window', async () => {
      const w = await windowRepo.create({
        ...makeWindowInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const voided = await windowRepo.void(w.followUpReviewWindowId, 'USER_REQUEST', 'Voided');
      expect(voided.windowStatus).toBe('void');
      expect(voided.voidedAt).toBeTruthy();
    });

    it('review window does not create calendar event', () => {
      const methods = Object.getOwnPropertyNames(InMemoryFollowUpReviewWindowRepository.prototype);
      expect(methods).not.toContain('createCalendarEvent');
      expect(methods).not.toContain('scheduleCalendar');
    });

    it('review window does not schedule worker', () => {
      const methods = Object.getOwnPropertyNames(InMemoryFollowUpReviewWindowRepository.prototype);
      expect(methods).not.toContain('scheduleWorker');
      expect(methods).not.toContain('queueJob');
    });
  });

  describe('Escalation plan', () => {
    it('can create an escalation plan', async () => {
      const e = await escalationRepo.create({
        ...makeEscalationInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'lead_teacher',
      });
      expect(e).toBeDefined();
      expect(e.followUpEscalationPlanId).toBeTruthy();
      expect(e.escalationStatus).toBe('draft');
    });

    it('can mark escalation plan review_ready', async () => {
      const e = await escalationRepo.create({
        ...makeEscalationInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'lead_teacher',
      });
      const ready = await escalationRepo.markReviewReady(e.followUpEscalationPlanId);
      expect(ready.escalationStatus).toBe('review_ready');
    });

    it('can approve escalation plan for future use', async () => {
      const e = await escalationRepo.create({
        ...makeEscalationInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'lead_teacher',
      });
      await escalationRepo.markReviewReady(e.followUpEscalationPlanId);
      const approved = await escalationRepo.approveForFutureUse(e.followUpEscalationPlanId);
      expect(approved.escalationStatus).toBe('approved_for_future_use');
      expect(approved.approvedForFutureUseAt).toBeTruthy();
    });

    it('can suppress escalation plan', async () => {
      const e = await escalationRepo.create({
        ...makeEscalationInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'lead_teacher',
      });
      const suppressed = await escalationRepo.suppress(e.followUpEscalationPlanId, 'POLICY_SUPPRESSED', 'Suppressed');
      expect(suppressed.escalationStatus).toBe('suppressed');
      expect(suppressed.suppressedAt).toBeTruthy();
    });

    it('can block escalation plan', async () => {
      const e = await escalationRepo.create({
        ...makeEscalationInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'lead_teacher',
      });
      const blocked = await escalationRepo.block(e.followUpEscalationPlanId, 'POLICY_BLOCKED', 'Blocked');
      expect(blocked.escalationStatus).toBe('blocked');
    });

    it('can void escalation plan', async () => {
      const e = await escalationRepo.create({
        ...makeEscalationInput(),
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'lead_teacher',
      });
      const voided = await escalationRepo.void(e.followUpEscalationPlanId, 'USER_REQUEST', 'Voided');
      expect(voided.escalationStatus).toBe('void');
      expect(voided.voidedAt).toBeTruthy();
    });

    it('escalation plan does not send notification', () => {
      const methods = Object.getOwnPropertyNames(InMemoryFollowUpEscalationPlanRepository.prototype);
      expect(methods).not.toContain('sendNotification');
      expect(methods).not.toContain('notifyReviewer');
    });

    it('escalation plan does not disclose unsafe safeguarding details', () => {
      const methods = Object.getOwnPropertyNames(InMemoryFollowUpEscalationPlanRepository.prototype);
      expect(methods).not.toContain('discloseSafeguarding');
      expect(methods).not.toContain('unsafeDisclosure');
    });
  });
});
