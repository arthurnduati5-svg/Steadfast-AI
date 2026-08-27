import { describe, it, expect, beforeEach } from 'vitest';
import { createStudentLearningSession } from '../services/studentLearningSessionLifecycleService';
import { studentLearningSessionRepository } from '../services/studentLearningSessionRepository';
import { resetSessionStores, setForceNextEventFailure } from './vitest-setup';
import type { StudentLearningSessionContext } from '../contracts/studentLearningSessionContracts';

const baseContext: StudentLearningSessionContext = {
  schoolId: 'school-atomic',
  studentId: 'student-atomic',
  tutorLearnerId: 'learner-atomic',
};

describe('R1 atomic keyed create', () => {
  beforeEach(() => {
    resetSessionStores();
  });

  it('first create = 1 session + 1 event', async () => {
    const ctx = { ...baseContext };
    const key = 'key-first';
    const fp = 'fp-first-v1';
    const result = await createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp });
    expect(result.session).toBeDefined();
    expect(result.created).toBe(true);
    const sessions = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    expect(sessions.length).toBe(1);
    const events = await studentLearningSessionRepository.listEvents(result.session.id, ctx.schoolId, ctx.tutorLearnerId);
    expect(events.length).toBe(1);
    expect(events[0].eventType).toBe('session_created');
    expect(events[0].idempotencyKey).toBe(key);
    expect(events[0].requestFingerprint).toBe(fp);
  });

  it('identical retry = same session, counts unchanged', async () => {
    const ctx = { ...baseContext, schoolId: 'school-retry', tutorLearnerId: 'learner-retry', studentId: 'student-retry' };
    const key = 'key-retry';
    const fp = 'fp-retry-v1';
    const r1 = await createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp });
    const sessionsBefore = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    const eventsBefore = await studentLearningSessionRepository.listEvents(r1.session.id, ctx.schoolId, ctx.tutorLearnerId);

    const r2 = await createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp });
    expect(r2.session.id).toBe(r1.session.id);
    expect(r2.created).toBe(false);

    const sessionsAfter = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    const eventsAfter = await studentLearningSessionRepository.listEvents(r1.session.id, ctx.schoolId, ctx.tutorLearnerId);
    expect(sessionsAfter.length).toBe(sessionsBefore.length);
    expect(sessionsAfter.length).toBe(1);
    expect(eventsAfter.length).toBe(eventsBefore.length);
    expect(eventsAfter.length).toBe(1);
    expect(eventsAfter[0].id).toBe(eventsBefore[0].id);
  });

  it('conflicting fingerprint = no mutation', async () => {
    const ctx = { ...baseContext, schoolId: 'school-conflict', tutorLearnerId: 'learner-conflict', studentId: 'student-conflict' };
    const key = 'key-conflict';
    const fp1 = 'fp-conflict-v1';
    const fp2 = 'fp-conflict-v2-different';

    const r1 = await createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp1 });
    expect(r1.session).toBeDefined();
    const sessionsAfterFirst = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    const eventsAfterFirst = await studentLearningSessionRepository.listEvents(r1.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const eventCountAfterFirst = eventsAfterFirst.filter(e => e.idempotencyKey === key).length;
    expect(eventCountAfterFirst).toBe(1);

    const r2 = await createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp2 });
    // should be conflict
    expect(r2.safeReasonCodes).toContain('idempotency_key_conflict');
    expect(r2.session).toBeNull;
    // counts unchanged
    const sessionsAfterSecond = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    expect(sessionsAfterSecond.length).toBe(sessionsAfterFirst.length);
    // need to check events across all sessions of that scope (only one session id)
    const eventsAfterSecond = await studentLearningSessionRepository.listEvents(r1.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const countAfterSecond = eventsAfterSecond.filter(e => e.idempotencyKey === key).length;
    expect(countAfterSecond).toBe(eventCountAfterFirst);
  });

  it('concurrent identical requests = 1 session + 1 event', async () => {
    const ctx = { ...baseContext, schoolId: 'school-conc', tutorLearnerId: 'learner-conc', studentId: 'student-conc' };
    const key = 'key-conc';
    const fp = 'fp-conc-v1';

    const results = await Promise.all([
      createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp }),
      createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp }),
      createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp }),
      createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp }),
      createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp }),
    ]);

    // all should return same session id, at most one created true
    const ids = results.map(r => r.session?.id).filter(Boolean);
    expect(ids.length).toBe(5);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(1);

    // exactly one created true, rest false? Or at least counts prove single durable
    const createdTrueCount = results.filter(r => r.created).length;
    // With our current replay logic, first wins, rest replay => 1 created
    expect(createdTrueCount).toBe(1);

    const sessions = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    expect(sessions.length).toBe(1);
    const sessionId = sessions[0].id;
    const events = await studentLearningSessionRepository.listEvents(sessionId, ctx.schoolId, ctx.tutorLearnerId);
    const keyedEvents = events.filter(e => e.idempotencyKey === key);
    expect(keyedEvents.length).toBe(1);
    expect(keyedEvents[0].requestFingerprint).toBe(fp);
    // also ensure no orphan sessions outside that one
    // check total session count is 1
  });

  it('simulated event failure = transaction rollback', async () => {
    const ctx = { ...baseContext, schoolId: 'school-fail', tutorLearnerId: 'learner-fail', studentId: 'student-fail' };
    const key = 'key-fail';
    const fp = 'fp-fail-v1';

    setForceNextEventFailure(true);
    await expect(createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp })).rejects.toThrow(/simulated event failure/);

    // after failure, no session should be persisted
    const sessionsAfterFail = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    expect(sessionsAfterFail.length).toBe(0);

    // also no event with that key should exist
    const check = await studentLearningSessionRepository.checkIdempotency(key, ctx.schoolId, ctx.tutorLearnerId, fp);
    expect(check.exists).toBe(false);

    // retry without failure should succeed and create exactly 1 session+event
    const retry = await createStudentLearningSession(ctx, { idempotencyKey: key, requestFingerprint: fp });
    expect(retry.session).toBeDefined();
    expect(retry.created).toBe(true);
    const sessionsAfterRetry = await studentLearningSessionRepository.listSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    expect(sessionsAfterRetry.length).toBe(1);
    const eventsAfterRetry = await studentLearningSessionRepository.listEvents(retry.session.id, ctx.schoolId, ctx.tutorLearnerId);
    expect(eventsAfterRetry.filter(e => e.idempotencyKey === key).length).toBe(1);
  });
});
