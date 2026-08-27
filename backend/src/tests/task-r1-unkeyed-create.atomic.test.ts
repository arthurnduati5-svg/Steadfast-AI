import { describe, it, expect, beforeEach } from 'vitest';
import { createStudentLearningSession } from '../services/studentLearningSessionLifecycleService';
import { studentLearningSessionRepository } from '../services/studentLearningSessionRepository';
import { resetSessionStores, setForceNextEventFailure } from './vitest-setup';
import type { StudentLearningSessionContext } from '../contracts/studentLearningSessionContracts';

const baseContext: StudentLearningSessionContext = {
  schoolId: 'school-unkeyed',
  studentId: 'student-unkeyed',
  tutorLearnerId: 'learner-unkeyed',
};

describe('R1 atomic unkeyed create', () => {
  beforeEach(() => {
    resetSessionStores();
  });

  it('unkeyed create = exactly 1 state + 1 session_created event', async () => {
    const ctx = { ...baseContext };
    const result = await createStudentLearningSession(ctx);
    expect(result.session).toBeDefined();
    expect(result.created).toBe(true);

    const sessions = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    expect(sessions.length).toBe(1);

    const events = await studentLearningSessionRepository.listEvents(result.session.id, ctx.schoolId, ctx.tutorLearnerId);
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('session_created');
    expect(events[0].idempotencyKey ?? null).toBeNull();
    expect(events[0].requestFingerprint ?? null).toBeNull();
    expect(events[0].operationVersion).toBe(1);
  });

  it('forced unkeyed event failure = 0 state + 0 event', async () => {
    const ctx = { ...baseContext, schoolId: 'school-unkeyed-fail', tutorLearnerId: 'learner-unkeyed-fail', studentId: 'student-unkeyed-fail' };

    setForceNextEventFailure(true);
    await expect(createStudentLearningSession(ctx)).rejects.toThrow(/simulated event failure/);

    const sessionsAfterFail = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    expect(sessionsAfterFail.length).toBe(0);
    const eventsAfterFail = await studentLearningSessionRepository.listEvents('any-id', ctx.schoolId, ctx.tutorLearnerId);
    expect(eventsAfterFail.length).toBe(0);
  });
});
