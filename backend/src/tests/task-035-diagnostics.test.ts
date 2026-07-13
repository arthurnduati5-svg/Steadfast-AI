import { describe, it, expect, beforeEach } from 'vitest';
import { task035Repository } from '../repositories/task035SchoolWideReadinessRepository';

describe('task035Diagnostics', () => {
  beforeEach(() => {
    task035Repository.clearSessions();
  });

  it('should append diagnostics to a session', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
      status: 'decision_computed',
      safeToStartTask036: true,
    });
    const appended = task035Repository.appendDiagnostic(sessionId, {
      checkName: 'privacy_gate',
      passed: true,
      detail: 'All 15 privacy fields verified false',
      safeSummary: 'Privacy gate passed',
    });
    expect(appended).toBe(true);
    const session = task035Repository.getSession(sessionId);
    expect(session.diagnostics).toHaveLength(1);
    expect(session.diagnostics[0].checkName).toBe('privacy_gate');
    expect(session.diagnostics[0].passed).toBe(true);
  });

  it('should show session state in diagnostics without private data', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
      status: 'release_board_package_generated',
      safeToStartTask036: true,
    });
    task035Repository.appendDiagnostic(sessionId, {
      checkName: 'session_state',
      passed: true,
      detail: 'Session state is release_board_package_generated',
      safeSummary: 'Session consistent',
    });
    task035Repository.appendDiagnostic(sessionId, {
      checkName: 'final_decision',
      passed: true,
      detail: 'TASK_035_PASS_SAFE_TO_START_TASK_036',
      safeSummary: 'Decision passed',
    });
    const session = task035Repository.getSession(sessionId);
    expect(session.diagnostics).toHaveLength(2);
    for (const diag of session.diagnostics) {
      expect(diag.safeSummary).not.toContain('raw');
      expect(diag.safeSummary).not.toContain('password');
      expect(diag.safeSummary).not.toContain('secret');
      expect(diag.safeSummary).not.toContain('private');
    }
  });

  it('should include evidence count in diagnostics when evidence exists', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
      status: 'decision_computed',
    });
    task035Repository.appendEvidence(sessionId, {
      eventId: 'evt_diag_1', evidenceType: 'gate_passed', safeDescription: 'Socratic gate passed', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'admin',
    });
    task035Repository.appendEvidence(sessionId, {
      eventId: 'evt_diag_2', evidenceType: 'gate_passed', safeDescription: 'Deen gate passed', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'admin',
    });
    task035Repository.appendDiagnostic(sessionId, {
      checkName: 'evidence_intake',
      passed: true,
      detail: 'Evidence count: 2',
      safeSummary: 'Evidence intake healthy',
    });
    const session = task035Repository.getSession(sessionId);
    expect(session.evidence).toHaveLength(2);
    const evtDiag = session.diagnostics.find((d: any) => d.checkName === 'evidence_intake');
    expect(evtDiag).toBeDefined();
    expect(evtDiag.passed).toBe(true);
  });

  it('should return false when appending diagnostics to a non-existent session', () => {
    const result = task035Repository.appendDiagnostic('nonexistent', {
      checkName: 'test',
      passed: false,
      detail: 'no session',
      safeSummary: 'no session',
    });
    expect(result).toBe(false);
  });

  it('should handle deletion of a session cleanly', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
    });
    task035Repository.appendDiagnostic(sessionId, {
      checkName: 'pre_delete', passed: true, detail: 'Before delete', safeSummary: 'ok',
    });
    const deleted = task035Repository.deleteSession(sessionId);
    expect(deleted).toBe(true);
    const session = task035Repository.getSession(sessionId);
    expect(session).toBeNull();
  });
});
