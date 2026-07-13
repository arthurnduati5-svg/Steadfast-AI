import { describe, it, expect, beforeEach } from 'vitest';
import { task035Repository } from '../repositories/task035SchoolWideReadinessRepository';

describe('task035ReadinessReadModel', () => {
  beforeEach(() => {
    task035Repository.clearSessions();
  });

  it('should return safe aggregates for a session with valid data', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
      tenantId: 'tenant_task035_full_school_safe',
      status: 'release_board_package_generated',
      safeToStartTask036: true,
    });
    const session = task035Repository.getSession(sessionId);
    expect(session).not.toBeNull();
    expect(session.sessionId).toBe(sessionId);
    expect(session.schoolId).toBe('school_task035_full_school_safe');
    expect(session.status).toBe('release_board_package_generated');
    expect(session.safeToStartTask036).toBe(true);
  });

  it('should return null for a non-existent session', () => {
    const session = task035Repository.getSession('nonexistent_session_id');
    expect(session).toBeNull();
  });

  it('should update session state correctly', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
      status: 'draft',
    });
    const updated = task035Repository.updateSession(sessionId, {
      status: 'decision_computed',
      safeToStartTask036: true,
    });
    expect(updated).toBe(true);
    const session = task035Repository.getSession(sessionId);
    expect(session.status).toBe('decision_computed');
    expect(session.safeToStartTask036).toBe(true);
  });

  it('should return empty diagnostics and evidence arrays for a fresh session', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
    });
    const session = task035Repository.getSession(sessionId);
    expect(Array.isArray(session.diagnostics)).toBe(true);
    expect(session.diagnostics).toHaveLength(0);
    expect(Array.isArray(session.evidence)).toBe(true);
    expect(session.evidence).toHaveLength(0);
  });
});
