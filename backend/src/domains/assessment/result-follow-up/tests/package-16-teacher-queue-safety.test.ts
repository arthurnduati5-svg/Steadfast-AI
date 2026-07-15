import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryTeacherFollowUpQueueRepository,
} from '../repositories/inMemoryResultFollowUpRepositories';

function makeQueueInput() {
  return {
    resultFollowUpCaseId: 'case-1',
    resultFollowUpActionPlanId: 'plan-1',
    studentRef: 'student-1',
    teacherRef: 'teacher-1',
    queueMode: 'mock_review',
    queuePriority: 'high',
    safeQueueSummary: 'Teacher review needed for follow-up case',
    suggestedNextActions: { reviewPlan: true } as Record<string, unknown>,
  };
}

describe('Package 16 — Teacher Queue Safety', () => {
  let queueRepo: InMemoryTeacherFollowUpQueueRepository;

  beforeEach(() => {
    queueRepo = new InMemoryTeacherFollowUpQueueRepository();
  });

  it('can create a teacher queue item', async () => {
    const q = await queueRepo.create({
      ...makeQueueInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    expect(q).toBeDefined();
    expect(q.teacherFollowUpQueueItemId).toBeTruthy();
    expect(q.queueStatus).toBe('draft');
    expect(q.teacherRef).toBe('teacher-1');
  });

  it('can mark teacher queue item queued_for_review', async () => {
    const q = await queueRepo.create({
      ...makeQueueInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const queued = await queueRepo.markQueued(q.teacherFollowUpQueueItemId);
    expect(queued.queueStatus).toBe('queued_for_review');
    expect(queued.queuedAt).toBeTruthy();
  });

  it('can acknowledge_mock teacher queue item', async () => {
    const q = await queueRepo.create({
      ...makeQueueInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    await queueRepo.markQueued(q.teacherFollowUpQueueItemId);
    const ack = await queueRepo.acknowledge(q.teacherFollowUpQueueItemId);
    expect(ack.queueStatus).toBe('acknowledged_mock');
    expect(ack.acknowledgedAt).toBeTruthy();
  });

  it('can complete_mock teacher queue item', async () => {
    const q = await queueRepo.create({
      ...makeQueueInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    await queueRepo.markQueued(q.teacherFollowUpQueueItemId);
    await queueRepo.acknowledge(q.teacherFollowUpQueueItemId);
    const completed = await queueRepo.complete(q.teacherFollowUpQueueItemId);
    expect(completed.queueStatus).toBe('completed_mock');
    expect(completed.completedAt).toBeTruthy();
  });

  it('can suppress teacher queue item', async () => {
    const q = await queueRepo.create({
      ...makeQueueInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const suppressed = await queueRepo.suppress(q.teacherFollowUpQueueItemId, 'POLICY_SUPPRESSED', 'Suppressed');
    expect(suppressed.queueStatus).toBe('suppressed');
    expect(suppressed.suppressedAt).toBeTruthy();
  });

  it('can block teacher queue item', async () => {
    const q = await queueRepo.create({
      ...makeQueueInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const blocked = await queueRepo.block(q.teacherFollowUpQueueItemId, 'POLICY_BLOCKED', 'Blocked');
    expect(blocked.queueStatus).toBe('blocked');
  });

  it('can void teacher queue item', async () => {
    const q = await queueRepo.create({
      ...makeQueueInput(),
      schoolId: 'school-1',
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
    });
    const voided = await queueRepo.void(q.teacherFollowUpQueueItemId, 'USER_REQUEST', 'Voided');
    expect(voided.queueStatus).toBe('void');
    expect(voided.voidedAt).toBeTruthy();
  });

  it('teacher queue item does not create live task', () => {
    const methods = Object.getOwnPropertyNames(InMemoryTeacherFollowUpQueueRepository.prototype);
    expect(methods).not.toContain('createLiveTask');
    expect(methods).not.toContain('assignLive');
  });

  it('teacher queue item does not notify teacher', () => {
    const methods = Object.getOwnPropertyNames(InMemoryTeacherFollowUpQueueRepository.prototype);
    expect(methods).not.toContain('notifyTeacher');
    expect(methods).not.toContain('sendTeacherNotification');
  });

  it('teacher queue item does not create calendar event', () => {
    const methods = Object.getOwnPropertyNames(InMemoryTeacherFollowUpQueueRepository.prototype);
    expect(methods).not.toContain('createCalendarEvent');
    expect(methods).not.toContain('scheduleEvent');
  });
});
