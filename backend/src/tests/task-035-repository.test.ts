import { describe, it, expect, beforeEach } from 'vitest';
import { Task035SchoolWideReadinessRepository } from '../repositories/task035SchoolWideReadinessRepository';

describe('task035 repository', () => {
  let repo: Task035SchoolWideReadinessRepository;

  beforeEach(() => {
    repo = new Task035SchoolWideReadinessRepository();
  });

  describe('createSession', () => {
    it('creates a session and returns sessionId and createdAt', () => {
      const result = repo.createSession({ schoolId: 'school_001' });
      expect(result.sessionId).toMatch(/^task035_/);
      expect(result.createdAt).toBeTruthy();
      expect(typeof result.createdAt).toBe('string');
    });
  });

  describe('getSession', () => {
    it('returns the session for a valid sessionId', () => {
      const { sessionId } = repo.createSession({ schoolId: 'school_001' });
      const session = repo.getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session.schoolId).toBe('school_001');
    });

    it('returns null for a non-existent sessionId', () => {
      const session = repo.getSession('non_existent_id');
      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('updates an existing session and returns true', () => {
      const { sessionId } = repo.createSession({ schoolId: 'school_001' });
      const updated = repo.updateSession(sessionId, { status: 'completed' });
      expect(updated).toBe(true);
      const session = repo.getSession(sessionId);
      expect(session.status).toBe('completed');
    });

    it('returns false for non-existent session', () => {
      const result = repo.updateSession('missing', { status: 'completed' });
      expect(result).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('deletes an existing session and returns true', () => {
      const { sessionId } = repo.createSession({ schoolId: 'school_001' });
      const deleted = repo.deleteSession(sessionId);
      expect(deleted).toBe(true);
      expect(repo.getSession(sessionId)).toBeNull();
    });

    it('returns false for non-existent session', () => {
      expect(repo.deleteSession('missing')).toBe(false);
    });
  });

  describe('getAllSessions', () => {
    it('returns all created sessions', () => {
      repo.createSession({ schoolId: 'A' });
      repo.createSession({ schoolId: 'B' });
      const all = repo.getAllSessions();
      expect(all).toHaveLength(2);
    });

    it('returns empty array when no sessions exist', () => {
      expect(repo.getAllSessions()).toHaveLength(0);
    });
  });

  describe('appendDiagnostic', () => {
    it('appends a diagnostic to the session', () => {
      const { sessionId } = repo.createSession({ schoolId: 's1' });
      const diag = { step: 'env_check', result: 'pass' };
      const result = repo.appendDiagnostic(sessionId, diag);
      expect(result).toBe(true);
      const session = repo.getSession(sessionId);
      expect(session.diagnostics).toContainEqual(diag);
    });

    it('returns false for non-existent session', () => {
      const result = repo.appendDiagnostic('missing', { step: 'check' });
      expect(result).toBe(false);
    });
  });

  describe('appendEvidence', () => {
    it('appends evidence to the session', () => {
      const { sessionId } = repo.createSession({ schoolId: 's1' });
      const evidence = { file: 'report.json', hash: 'abc123' };
      const result = repo.appendEvidence(sessionId, evidence);
      expect(result).toBe(true);
      const session = repo.getSession(sessionId);
      expect(session.evidence).toContainEqual(evidence);
    });

    it('returns false for non-existent session', () => {
      const result = repo.appendEvidence('missing', { file: 'r.json' });
      expect(result).toBe(false);
    });
  });

  describe('clearSessions', () => {
    it('clears all sessions from repository', () => {
      repo.createSession({ schoolId: 'A' });
      repo.createSession({ schoolId: 'B' });
      repo.clearSessions();
      expect(repo.getAllSessions()).toHaveLength(0);
    });
  });
});
