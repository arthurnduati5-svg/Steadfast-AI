import { describe, it, expect, beforeEach } from 'vitest';
import { createStudentLearningSession, clearStudentLearningSessionStoreForTest, listStudentLearningSessionsForLearner, getStudentLearningSession, pauseStudentLearningSession, completeStudentLearningSession, abandonStudentLearningSession, resumeStudentLearningSession, updateSessionTransition } from '../services/studentLearningSessionLifecycleService';
import { StudentLearningSessionAccessPolicy } from '../services/studentLearningSessionAccessPolicy';
import { transitionSessionState, getInitialSessionState } from '../services/studentLearningSessionStateMachine';
import { buildLearnerSafeSessionSnapshot, buildEmptySessionSnapshot, assertSessionSnapshotIsSafe } from '../services/studentLearningSessionSnapshotService';
import { buildResumeContextFromSession, buildEmptyResumeContext, assertResumeContextIsSafe } from '../services/studentLearningSessionResumeContextService';
import { buildCompletedSessionSummary, buildAbandonedSessionSummary, assertExitSummaryIsSafe } from '../services/studentLearningSessionExitSummaryService';
import { recordSessionActionHistoryEvent, listSessionActionHistoryEvents, buildSafeActionHistoryView } from '../services/studentLearningSessionActionHistoryService';
import { recordSessionAuditEvent, clearAuditStoreForTest } from '../services/studentLearningSessionAuditService';
import { buildSessionCreatedResponse, buildSessionResumedResponse, buildSessionPausedResponse, buildSessionCompletedResponse, buildSessionAbandonedResponse, buildSessionSnapshotResponse, buildSessionTransitionResponse, buildResumeContextResponse, buildExitSummaryResponse, buildForbiddenRawFieldErrorResponse, buildHiddenReasoningErrorResponse, buildProtectedAnswerErrorResponse, buildGenericErrorResponse } from '../services/studentLearningSessionResponseBuilder';
import { findForbiddenFields } from '../lib/studentLearningSessionValidation';
import type {
  StudentLearningSessionContext,
  StudentLearningSessionMode,
} from '../contracts/studentLearningSessionContracts';
import { resetSessionStores } from '../tests/vitest-setup';

describe('StudentLearningSessionRoutesContract', () => {
  const accessPolicy = new StudentLearningSessionAccessPolicy();
  const schoolIdA = 'school-alpha';
  const schoolIdB = 'school-beta';
  const studentAId = 'student-A';
  const studentBId = 'student-B';
  const ctxA: StudentLearningSessionContext = { schoolId: schoolIdA, studentId: studentAId, tutorLearnerId: studentAId };

  beforeEach(() => {
    clearStudentLearningSessionStoreForTest();
    clearAuditStoreForTest();
    resetSessionStores();
  });

  it('POST create route handler logic works (call createStudentLearningSession directly)', async () => {
    const result = await createStudentLearningSession(ctxA);
    const response = buildSessionCreatedResponse(result);
    expect(response.ok).toBe(true);
    expect(response.status).toBe('created');
    expect(response.sessionId).toBeTruthy();

    const access = accessPolicy.checkAccess(ctxA, result.session.schoolId, result.session.studentId || '', result.session.tutorLearnerId);
    expect(access.allowed).toBe(true);
  });

  it('GET list for learner returns sessions', async () => {
    await createStudentLearningSession(ctxA);
    await createStudentLearningSession(ctxA);
    const sessions = await listStudentLearningSessionsForLearner(schoolIdA, studentAId);
    expect(sessions.length).toBe(2);
  });

  it('GET single session returns session snapshot', async () => {
    const result = await createStudentLearningSession(ctxA);
    const now = new Date();
    const recordWithDates = { ...result.session, lastActiveAt: now, startedAt: now, createdAt: now, updatedAt: now } as any;
    expect(recordWithDates.id).toBe(result.session.id);
    const snapshot = buildLearnerSafeSessionSnapshot(recordWithDates);
    expect(snapshot.sessionId).toBe(result.session.id);
    expect(snapshot.sessionStatus).toBe('created');
    expect(() => assertSessionSnapshotIsSafe(snapshot)).not.toThrow();
  });

  it('POST resume works for paused session', async () => {
    const result = await createStudentLearningSession(ctxA);
    const sid = result.session.id;
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(sid, ctxA, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });
    await pauseStudentLearningSession(sid, ctxA);

    const resumeResult = await resumeStudentLearningSession(sid, ctxA);
    expect(resumeResult).not.toBeNull();
    expect(resumeResult!.resumed).toBe(true);
    expect(resumeResult!.session.status).toBe('active');
  });

  it('POST pause works for active session', async () => {
    const result = await createStudentLearningSession(ctxA);
    const sid = result.session.id;
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(sid, ctxA, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });

    const pauseResult = await pauseStudentLearningSession(sid, ctxA);
    expect(pauseResult).not.toBeNull();
    expect(pauseResult!.session.status).toBe('paused');
  });

  it('POST complete works for active session', async () => {
    const result = await createStudentLearningSession(ctxA);
    const sid = result.session.id;
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(sid, ctxA, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });

    const completeResult = await completeStudentLearningSession(sid, ctxA);
    expect(completeResult).not.toBeNull();
    expect(completeResult!.session.status).toBe('completed');
  });

  it('POST abandon works for active session', async () => {
    const result = await createStudentLearningSession(ctxA);
    const sid = result.session.id;
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(sid, ctxA, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });

    const abandonResult = await abandonStudentLearningSession(sid, ctxA);
    expect(abandonResult).not.toBeNull();
    expect(abandonResult!.session.status).toBe('abandoned');
  });

  it('POST transition works for valid transition', async () => {
    const result = await createStudentLearningSession(ctxA);
    const sid = result.session.id;

    const transition = transitionSessionState('created', 'orienting', 'none', 'start_session');
    expect(transition.allowed).toBe(true);

    const updated = await updateSessionTransition(sid, ctxA, {
      status: transition.sessionStatus,
      stage: transition.sessionStage,
      currentMode: transition.toMode,
      previousMode: transition.fromMode,
      allowedTransitions: [],
      blockedTransitions: [],
      safeReasonCodes: transition.safeReasonCodes,
    });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('active');
    expect(updated!.currentMode).toBe('chat');
  });

  it('GET snapshot returns safe snapshot', async () => {
    const result = await createStudentLearningSession(ctxA);
    const now = new Date();
    const recordWithDates = { ...result.session, lastActiveAt: now, startedAt: now, createdAt: now, updatedAt: now } as any;
    const snapshot = buildLearnerSafeSessionSnapshot(recordWithDates);
    expect(() => assertSessionSnapshotIsSafe(snapshot)).not.toThrow();

    const response = buildSessionSnapshotResponse(snapshot);
    expect(response.ok).toBe(true);
    expect(response.status).toBe('snapshot');
  });

  it('GET resume-context returns resume context', async () => {
    const result = await createStudentLearningSession(ctxA);
    const now = new Date();
    const recordWithDates = { ...result.session, lastActiveAt: now, startedAt: now, createdAt: now, updatedAt: now } as any;
    const resumeContext = buildResumeContextFromSession(recordWithDates);
    expect(() => assertResumeContextIsSafe(resumeContext)).not.toThrow();

    const response = buildResumeContextResponse(resumeContext);
    expect(response.ok).toBe(true);
  });

  it('GET exit-summary returns exit summary', async () => {
    const result = await createStudentLearningSession(ctxA);
    const now = new Date();
    const recordWithDates = { ...result.session, lastActiveAt: now, startedAt: now, endedAt: now, createdAt: now, updatedAt: now } as any;
    const modesUsed: StudentLearningSessionMode[] = [];
    const summary = buildCompletedSessionSummary(recordWithDates, modesUsed);
    expect(() => assertExitSummaryIsSafe(summary)).not.toThrow();

    const response = buildExitSummaryResponse(summary);
    expect(response.ok).toBe(true);
    expect(response.status).toBe('exit_summary');
  });

  it('GET actions returns action history', async () => {
    const result = await createStudentLearningSession(ctxA);
    const sid = result.session.id;

    await recordSessionActionHistoryEvent({
      sessionId: sid,
      schoolId: schoolIdA,
      studentId: studentAId,
      tutorLearnerId: studentAId,
      actionType: 'session_created',
      mode: 'none',
      status: 'created',
    });

    const events = await buildSafeActionHistoryView(sid, schoolIdA, studentAId);
    expect(events.length).toBe(1);
    expect(events[0].actionType).toBe('session_created');
  });

  it('POST audit records audit event', async () => {
    const result = await createStudentLearningSession(ctxA);
    const sid = result.session.id;

    const auditEvent = await recordSessionAuditEvent({
      schoolId: schoolIdA,
      studentId: studentAId,
      tutorLearnerId: studentAId,
      sessionId: sid,
      eventType: 'session_runtime_failed',
    });
    expect(auditEvent.eventId).toBeTruthy();
    expect(auditEvent.eventType).toBe('session_runtime_failed');
  });

  it('cross-learner access is denied (different studentId)', async () => {
    const result = await createStudentLearningSession(ctxA);
    const wrongCtx: StudentLearningSessionContext = { schoolId: schoolIdA, studentId: studentBId, tutorLearnerId: studentBId };
    const access = accessPolicy.checkAccess(wrongCtx, result.session.schoolId, result.session.studentId || '', result.session.tutorLearnerId);
    expect(access.allowed).toBe(false);
    expect(access.policyDecision).toBe('blocked_cross_learner');
  });

  it('missing school context is denied', () => {
    const noSchoolCtx: StudentLearningSessionContext = { schoolId: '', studentId: studentAId, tutorLearnerId: studentAId };
    const access = accessPolicy.checkAccess(noSchoolCtx, schoolIdA, studentAId, studentAId);
    expect(access.allowed).toBe(false);
    expect(access.policyDecision).toBe('blocked_no_school_context');
  });

  it('forbidden raw field in request is rejected', () => {
    const body = { rawText: 'some raw content' };
    const forbidden = findForbiddenFields(body);
    expect(forbidden.length).toBeGreaterThan(0);
    expect(forbidden).toContain('rawText');

    const response = buildForbiddenRawFieldErrorResponse();
    expect(response.ok).toBe(false);
    expect(response.policyDecision).toBe('blocked_forbidden_raw_field');

    const hiddenBody = { chainOfThought: 'hidden reasoning' };
    const hiddenForbidden = findForbiddenFields(hiddenBody);
    expect(hiddenForbidden).toContain('chainOfThought');
  });
});