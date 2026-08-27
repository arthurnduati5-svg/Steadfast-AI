import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStudentLearningSession,
  resumeStudentLearningSession,
  pauseStudentLearningSession,
  completeStudentLearningSession,
  abandonStudentLearningSession,
  expireStudentLearningSession,
  getStudentLearningSession,
  listStudentLearningSessionsForLearner,
  updateSessionTransition,
  clearStudentLearningSessionStoreForTest,
} from '../services/studentLearningSessionLifecycleService';
import { transitionSessionState } from '../services/studentLearningSessionStateMachine';
import type { StudentLearningSessionContext } from '../contracts/studentLearningSessionContracts';
import { resetSessionStores } from '../tests/vitest-setup';

const baseContext: StudentLearningSessionContext = {
  schoolId: 'school-1',
  studentId: 'student-1',
  tutorLearnerId: 'learner-1',
  subjectId: 'math',
  topicId: 'algebra',
};

describe('Task 016: StudentLearningSessionLifecycleService', () => {
  beforeEach(() => {
    clearStudentLearningSessionStoreForTest();
    resetSessionStores();
  });

  it('createStudentLearningSession creates a session with correct initial state', async () => {
    const result = await createStudentLearningSession(baseContext);
    expect(result.created).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session.id).toBeTruthy();
    expect(result.session.id).toMatch(/^sls_/);
  });

  it('Created session has status created, stage orienting, mode none', async () => {
    const result = await createStudentLearningSession(baseContext);
    expect(result.session.status).toBe('created');
    expect(result.session.stage).toBe('orienting');
    expect(result.session.currentMode).toBe('none');
  });

  it('Created session stores schoolId and tutorLearnerId', async () => {
    const result = await createStudentLearningSession(baseContext);
    expect(result.session.schoolId).toBe('school-1');
    expect(result.session.tutorLearnerId).toBe('learner-1');
  });

  it('resumeStudentLearningSession returns null for non-existent session', async () => {
    const result = await resumeStudentLearningSession('non-existent-id', baseContext);
    expect(result).toBeNull();
  });

  it('resumeStudentLearningSession resumes a paused session', async () => {
    const created = await createStudentLearningSession(baseContext);
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });
    await pauseStudentLearningSession(created.session.id, baseContext);

    const resumed = await resumeStudentLearningSession(created.session.id, baseContext);
    expect(resumed).not.toBeNull();
    expect(resumed!.resumed).toBe(true);
    expect(resumed!.session.status).toBe('active');
  });

  it('Create + pause + resume flow works correctly', async () => {
    const created = await createStudentLearningSession(baseContext);
    expect(created.session.status).toBe('created');

    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });

    const paused = await pauseStudentLearningSession(created.session.id, baseContext);
    expect(paused).not.toBeNull();
    expect(paused!.session.status).toBe('paused');

    const resumed = await resumeStudentLearningSession(created.session.id, baseContext);
    expect(resumed).not.toBeNull();
    expect(resumed!.resumed).toBe(true);
    expect(resumed!.session.status).toBe('active');
  });

  it('pauseStudentLearningSession pauses an active session', async () => {
    const created = await createStudentLearningSession(baseContext);
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });

    const paused = await pauseStudentLearningSession(created.session.id, baseContext);
    expect(paused).not.toBeNull();
    expect(paused!.session.status).toBe('paused');
  });

  it('completeStudentLearningSession completes an active session', async () => {
    const created = await createStudentLearningSession(baseContext);
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });

    const completed = await completeStudentLearningSession(created.session.id, baseContext);
    expect(completed).not.toBeNull();
    expect(completed!.session.status).toBe('completed');
    expect(completed!.session.endedAt).toBeDefined();
  });

  it('abandonStudentLearningSession abandons an active session', async () => {
    const created = await createStudentLearningSession(baseContext);
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });

    const abandoned = await abandonStudentLearningSession(created.session.id, baseContext);
    expect(abandoned).not.toBeNull();
    expect(abandoned!.session.status).toBe('abandoned');
    expect(abandoned!.session.endedAt).toBeDefined();
  });

  it('expireStudentLearningSession expires an active session', async () => {
    const created = await createStudentLearningSession(baseContext);
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });

    const expired = await expireStudentLearningSession(created.session.id, 'school-1', 'learner-1');
    expect(expired).not.toBeNull();
    expect(expired!.session.status).toBe('expired');
    expect(expired!.session.endedAt).toBeDefined();
  });

  it('Completed session cannot be resumed (returns null)', async () => {
    const created = await createStudentLearningSession(baseContext);
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });
    await completeStudentLearningSession(created.session.id, baseContext);

    const resumed = await resumeStudentLearningSession(created.session.id, baseContext);
    expect(resumed).toBeNull();
  });

  it('Abandoned session cannot be resumed', async () => {
    const created = await createStudentLearningSession(baseContext);
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });
    await abandonStudentLearningSession(created.session.id, baseContext);

    const resumed = await resumeStudentLearningSession(created.session.id, baseContext);
    expect(resumed).toBeNull();
  });

  it('getStudentLearningSession returns session by ID', async () => {
    const created = await createStudentLearningSession(baseContext);
    const found = await getStudentLearningSession(created.session.id, 'school-1', 'learner-1');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.session.id);
  });

  it('getStudentLearningSession returns null for non-existent ID', async () => {
    const found = await getStudentLearningSession('non-existent', 'school-1', 'learner-1');
    expect(found).toBeNull();
  });

  it('listStudentLearningSessionsForLearner lists sessions for specific learner', async () => {
    await createStudentLearningSession(baseContext);
    const otherContext: StudentLearningSessionContext = {
      schoolId: 'school-1',
      studentId: 'student-2',
      tutorLearnerId: 'learner-2',
    };
    await createStudentLearningSession(otherContext);

    const sessions = await listStudentLearningSessionsForLearner('school-1', 'learner-1');
    expect(sessions.length).toBe(1);
    expect(sessions[0].tutorLearnerId).toBe('learner-1');
  });

  it('Cross-learner access is blocked (wrong tutorLearnerId returns null)', async () => {
    const created = await createStudentLearningSession(baseContext);
    // Transition from created -> active via start_session
    const startResult = transitionSessionState('created', 'orienting', 'none', 'start_session');
    await updateSessionTransition(created.session.id, baseContext, {
      status: startResult.sessionStatus,
      currentMode: startResult.toMode,
      stage: startResult.sessionStage,
    });
    await pauseStudentLearningSession(created.session.id, baseContext);

    const wrongContext: StudentLearningSessionContext = {
      schoolId: 'school-1',
      studentId: 'student-other',
      tutorLearnerId: 'learner-other',
    };
    const resumed = await resumeStudentLearningSession(created.session.id, wrongContext);
    expect(resumed).toBeNull();
  });

  it('updateSessionTransition updates fields correctly', async () => {
    const created = await createStudentLearningSession(baseContext);
    const updated = await updateSessionTransition(created.session.id, baseContext, {
      status: 'active',
      currentMode: 'chat',
      stage: 'attempting',
    });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('active');
    expect(updated!.currentMode).toBe('chat');
    expect(updated!.previousMode).toBe('none');
    expect(updated!.stage).toBe('attempting');
    expect(updated!.updatedAt).toBeInstanceOf(Date);
  });

  it('updateSessionTransition returns null for completed session', async () => {
    const created = await createStudentLearningSession(baseContext);
    await updateSessionTransition(created.session.id, baseContext, { status: 'active', currentMode: 'chat' });
    await completeStudentLearningSession(created.session.id, baseContext);

    const result = await updateSessionTransition(created.session.id, baseContext, { currentMode: 'focus' });
    expect(result).toBeNull();
  });

  it('resetSessionStores clears all sessions', async () => {
    await createStudentLearningSession(baseContext);
    resetSessionStores();
    const sessions = await listStudentLearningSessionsForLearner('school-1', 'learner-1');
    expect(sessions.length).toBe(0);
  });
});