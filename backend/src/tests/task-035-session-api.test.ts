import { describe, it, expect } from 'vitest';
import { Task035SchoolWideReadinessRepository } from '../repositories/task035SchoolWideReadinessRepository';

describe('task035 session api', () => {
  let repo: Task035SchoolWideReadinessRepository;

  function createRepo() {
    repo = new Task035SchoolWideReadinessRepository();
  }

  it('creates a session with initial status and timestamp', () => {
    createRepo();
    const result = repo.createSession({ status: 'created', schoolId: 's1' });
    expect(result.sessionId).toBeTruthy();
    expect(result.createdAt).toBeTruthy();
    const session = repo.getSession(result.sessionId);
    expect(session.status).toBe('created');
  });

  it('retrieves a session by session id', () => {
    createRepo();
    const { sessionId } = repo.createSession({ name: 'test-session' });
    const session = repo.getSession(sessionId);
    expect(session).not.toBeNull();
    expect(session.sessionId).toBe(sessionId);
  });

  it('returns null for non-existent session retrieval', () => {
    createRepo();
    const session = repo.getSession('nonexistent-id');
    expect(session).toBeNull();
  });

  it('transitions session state on update', () => {
    createRepo();
    const { sessionId } = repo.createSession({ status: 'draft' });
    repo.updateSession(sessionId, { status: 'readiness_started' });
    const session = repo.getSession(sessionId);
    expect(session.status).toBe('readiness_started');
  });

  it('transitions session to decision_computed state', () => {
    createRepo();
    const { sessionId } = repo.createSession({ status: 'simulation_complete' });
    repo.updateSession(sessionId, { status: 'decision_computed', decision: 'TASK_035_PASS_SAFE_TO_START_TASK_036' });
    const session = repo.getSession(sessionId);
    expect(session.status).toBe('decision_computed');
    expect(session.decision).toBe('TASK_035_PASS_SAFE_TO_START_TASK_036');
  });

  it('creates sessions with independent state', () => {
    createRepo();
    const s1 = repo.createSession({ status: 'draft' });
    const s2 = repo.createSession({ status: 'completed' });
    expect(repo.getSession(s1.sessionId)?.status).toBe('draft');
    expect(repo.getSession(s2.sessionId)?.status).toBe('completed');
  });
});
