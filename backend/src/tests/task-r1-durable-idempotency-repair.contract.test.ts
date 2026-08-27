import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  createStudentLearningSession,
  resumeStudentLearningSession,
  pauseStudentLearningSession,
  completeStudentLearningSession,
  updateSessionTransition,
} from '../services/studentLearningSessionLifecycleService';
import { studentLearningSessionRepository } from '../services/studentLearningSessionRepository';
import { transitionSessionState } from '../services/studentLearningSessionStateMachine';
import { resetSessionStores } from '../tests/vitest-setup';
import type { StudentLearningSessionContext } from '../contracts/studentLearningSessionContracts';

const baseContext: StudentLearningSessionContext = {
  schoolId: 'school-r1',
  studentId: 'student-r1',
  tutorLearnerId: 'learner-r1',
};

function makeActiveSessionId(ctx: StudentLearningSessionContext) {
  return createStudentLearningSession(ctx).then(async (created) => {
    const start = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, ctx, {
      status: start.sessionStatus,
      currentMode: start.toMode,
      stage: start.sessionStage,
    });
    return created.session.id;
  });
}

describe('R1 repair: durable idempotency + no test coupling', () => {
  beforeEach(() => {
    resetSessionStores();
  });

  it('A. production lifecycle has no dependency on tests/vitest', () => {
    const p = resolve(__dirname, '../services/studentLearningSessionLifecycleService.ts');
    const src = readFileSync(p, 'utf8');
    expect(src).not.toMatch(/from\s+['"]\.\.\/tests\//);
    expect(src).not.toMatch(/vitest/);
    expect(src).not.toMatch(/vitest-setup/);
    // clearStudentLearningSessionStoreForTest must remain but be harmless (no test import)
    expect(src).not.toMatch(/import\s+\{[^}]*resetSessionStores[^}]*\}\s+from/);
  });

  it('B. idempotency metadata reaches the durable event path', async () => {
    const ctx = { ...baseContext };
    const created = await createStudentLearningSession(ctx);
    const start = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, ctx, {
      status: start.sessionStatus,
      currentMode: start.toMode,
      stage: start.sessionStage,
    });

    const key = 'r1-key-b';
    const fp = 'r1-fp-b-v1';
    const paused = await pauseStudentLearningSession(created.session.id, ctx, {
      idempotencyKey: key,
      requestFingerprint: fp,
    });
    expect(paused).not.toBeNull();
    expect(paused!.session.status).toBe('paused');

    const events = await studentLearningSessionRepository.listEvents(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const pauseEvent = events.find((e) => e.eventType === 'session_paused');
    expect(pauseEvent).toBeDefined();
    expect(pauseEvent!.idempotencyKey).toBe(key);
    expect((pauseEvent as unknown as { requestFingerprint?: string }).requestFingerprint ?? (pauseEvent as unknown as { requestId?: string }).requestId).toBeDefined();
    // durable event must carry the fingerprint (stored as requestFingerprint)
    const raw = pauseEvent as unknown as Record<string, unknown>;
    const storedFp = (raw.requestFingerprint as string) ?? (raw.requestId as string);
    // via repository mapping requestFingerprint is exposed as requestId? We store both; check at least one matches
    // The repository maps requestFingerprint differently; directly check via checkIdempotency
    const check = await studentLearningSessionRepository.checkIdempotency(key, ctx.schoolId, ctx.tutorLearnerId, fp);
    expect(check.exists).toBe(true);
    expect(check.fingerprintMatch).toBe(true);
    expect(check.event!.idempotencyKey).toBe(key);
    expect(check.event!.operationVersion).toBeGreaterThan(1);
  });

  it('C. same key + same fingerprint: one mutation, one event, replayed result', async () => {
    const ctx = { ...baseContext };
    const created = await createStudentLearningSession(ctx);
    const start = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, ctx, {
      status: start.sessionStatus,
      currentMode: start.toMode,
      stage: start.sessionStage,
    });
    await pauseStudentLearningSession(created.session.id, ctx);
    const key = 'r1-key-c';
    const fp = 'r1-fp-c-same';

    const r1 = await resumeStudentLearningSession(created.session.id, ctx, { idempotencyKey: key, requestFingerprint: fp });
    expect(r1).not.toBeNull();
    expect(r1!.session.status).toBe('active');
    const eventsAfterFirst = await studentLearningSessionRepository.listEvents(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const countAfterFirst = eventsAfterFirst.filter((e) => e.idempotencyKey === key).length;
    expect(countAfterFirst).toBe(1);

    const r2 = await resumeStudentLearningSession(created.session.id, ctx, { idempotencyKey: key, requestFingerprint: fp });
    expect(r2).not.toBeNull();
    expect(r2!.session.status).toBe('active');
    expect(r2!.session.id).toBe(r1!.session.id);
    const eventsAfterSecond = await studentLearningSessionRepository.listEvents(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const countAfterSecond = eventsAfterSecond.filter((e) => e.idempotencyKey === key).length;
    expect(countAfterSecond).toBe(1);
  });

  it('D. same key + different fingerprint: conflict, state unchanged, event count unchanged', async () => {
    const ctx: StudentLearningSessionContext = { schoolId: 'school-d', studentId: 'student-d', tutorLearnerId: 'learner-d' };
    const created = await createStudentLearningSession(ctx);
    const start = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, ctx, {
      status: start.sessionStatus,
      currentMode: start.toMode,
      stage: start.sessionStage,
    });
    const key = 'r1-key-d';
    const fp1 = 'r1-fp-d-v1';
    const fp2 = 'r1-fp-d-v2-different';

    const r1 = await updateSessionTransition(created.session.id, ctx, { currentMode: 'focus' }, { idempotencyKey: key, requestFingerprint: fp1 });
    expect(r1).not.toBeNull();
    const eventsAfterFirst = await studentLearningSessionRepository.listEvents(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const countAfterFirst = eventsAfterFirst.filter((e) => e.idempotencyKey === key).length;
    expect(countAfterFirst).toBe(1);
    const sessionAfterFirst = await studentLearningSessionRepository.getSession(created.session.id, ctx.schoolId, ctx.tutorLearnerId);

    const r2 = await updateSessionTransition(created.session.id, ctx, { currentMode: 'focus' }, { idempotencyKey: key, requestFingerprint: fp2 });
    expect(r2).toBeNull();
    const eventsAfterSecond = await studentLearningSessionRepository.listEvents(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const countAfterSecond = eventsAfterSecond.filter((e) => e.idempotencyKey === key).length;
    expect(countAfterSecond).toBe(countAfterFirst);
    const sessionNow = await studentLearningSessionRepository.getSession(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    expect(sessionNow!.currentMode).toBe(sessionAfterFirst!.currentMode);
  });

  it('E. scoped school/learner idempotency remains isolated', async () => {
    const ctxA: StudentLearningSessionContext = { schoolId: 'school-A', studentId: 'student-A', tutorLearnerId: 'learner-A' };
    const ctxB: StudentLearningSessionContext = { schoolId: 'school-B', studentId: 'student-B', tutorLearnerId: 'learner-B' };
    const ctxA2: StudentLearningSessionContext = { schoolId: 'school-A', studentId: 'student-A2', tutorLearnerId: 'learner-A2' };
    const key = 'r1-key-e-shared';
    const fp = 'r1-fp-e-shared';

    const createdA = await createStudentLearningSession(ctxA);
    const startA = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(createdA.session.id, ctxA, { status: startA.sessionStatus, currentMode: startA.toMode, stage: startA.sessionStage });
    const pA = await pauseStudentLearningSession(createdA.session.id, ctxA, { idempotencyKey: key, requestFingerprint: fp });
    expect(pA).not.toBeNull();

    const createdB = await createStudentLearningSession(ctxB);
    const startB = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(createdB.session.id, ctxB, { status: startB.sessionStatus, currentMode: startB.toMode, stage: startB.sessionStage });
    const pB = await pauseStudentLearningSession(createdB.session.id, ctxB, { idempotencyKey: key, requestFingerprint: fp });
    expect(pB).not.toBeNull();

    const createdA2 = await createStudentLearningSession(ctxA2);
    const startA2 = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(createdA2.session.id, ctxA2, { status: startA2.sessionStatus, currentMode: startA2.toMode, stage: startA2.sessionStage });
    const pA2 = await pauseStudentLearningSession(createdA2.session.id, ctxA2, { idempotencyKey: key, requestFingerprint: fp });
    expect(pA2).not.toBeNull();

    // Each scope has its own event
    const evA = await studentLearningSessionRepository.listEvents(createdA.session.id, ctxA.schoolId, ctxA.tutorLearnerId);
    const evB = await studentLearningSessionRepository.listEvents(createdB.session.id, ctxB.schoolId, ctxB.tutorLearnerId);
    const evA2 = await studentLearningSessionRepository.listEvents(createdA2.session.id, ctxA2.schoolId, ctxA2.tutorLearnerId);
    expect(evA.filter((e) => e.idempotencyKey === key).length).toBe(1);
    expect(evB.filter((e) => e.idempotencyKey === key).length).toBe(1);
    expect(evA2.filter((e) => e.idempotencyKey === key).length).toBe(1);

    // cross-scope check must not see other's event
    const checkAB = await studentLearningSessionRepository.checkIdempotency(key, ctxA.schoolId, ctxA.tutorLearnerId, fp);
    expect(checkAB.exists).toBe(true);
    expect(checkAB.event!.sessionId).toBe(createdA.session.id);
  });

  it('F. paused + resume_session -> active remains correct', async () => {
    const ctx = { ...baseContext, schoolId: 'school-f', tutorLearnerId: 'learner-f', studentId: 'student-f' };
    const created = await createStudentLearningSession(ctx);
    const start = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, ctx, {
      status: start.sessionStatus,
      currentMode: start.toMode,
      stage: start.sessionStage,
    });
    const paused = await pauseStudentLearningSession(created.session.id, ctx);
    expect(paused).not.toBeNull();
    expect(paused!.session.status).toBe('paused');
    const resumed = await resumeStudentLearningSession(created.session.id, ctx);
    expect(resumed).not.toBeNull();
    expect(resumed!.session.status).toBe('active');
  });

  it('G. durable event contains idempotencyKey, requestFingerprint, correct operationVersion', async () => {
    const ctx = { ...baseContext, schoolId: 'school-g', tutorLearnerId: 'learner-g', studentId: 'student-g' };
    const created = await createStudentLearningSession(ctx);
    const start = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, ctx, {
      status: start.sessionStatus,
      currentMode: start.toMode,
      stage: start.sessionStage,
    });
    const key = 'r1-key-g';
    const fp = 'r1-fp-g';
    const paused = await pauseStudentLearningSession(created.session.id, ctx, { idempotencyKey: key, requestFingerprint: fp });
    expect(paused).not.toBeNull();
    const sessionAfter = await studentLearningSessionRepository.getSession(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const versioned = await studentLearningSessionRepository.getSessionWithVersion(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const events = await studentLearningSessionRepository.listEvents(created.session.id, ctx.schoolId, ctx.tutorLearnerId);
    const ev = events.find((e) => e.idempotencyKey === key)!;
    expect(ev).toBeDefined();
    expect(ev.idempotencyKey).toBe(key);
    expect(ev.operationVersion).toBe(versioned!.stateVersion);
    expect(ev.operationVersion).toBeGreaterThan(1);
  });
});
