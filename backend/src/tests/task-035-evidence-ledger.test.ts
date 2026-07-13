import { describe, it, expect, beforeEach } from 'vitest';
import { task035Repository } from '../repositories/task035SchoolWideReadinessRepository';

describe('task035EvidenceLedger', () => {
  beforeEach(() => {
    task035Repository.clearSessions();
  });

  it('should append evidence events to a session', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
    });
    const appended = task035Repository.appendEvidence(sessionId, {
      eventId: 'evt_001',
      evidenceType: 'privacy_review_passed',
      safeDescription: 'Privacy review completed with no exposures',
      safeReasonCodes: ['all_fields_false'],
      timestamp: new Date().toISOString(),
      actorRole: 'admin',
    });
    expect(appended).toBe(true);
    const session = task035Repository.getSession(sessionId);
    expect(session.evidence).toHaveLength(1);
    expect(session.evidence[0].eventId).toBe('evt_001');
    expect(session.evidence[0].evidenceType).toBe('privacy_review_passed');
  });

  it('should store evidence with safe fields only and no private data', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
    });
    task035Repository.appendEvidence(sessionId, {
      eventId: 'evt_002',
      evidenceType: 'staff_release_board_complete',
      safeDescription: 'All staff roles acknowledged and checks passed',
      safeReasonCodes: ['admin_approved', 'operator_ready', 'teacher_lead_ready'],
      timestamp: new Date().toISOString(),
      actorRole: 'operator',
    });
    const session = task035Repository.getSession(sessionId);
    const evt = session.evidence[0];
    expect(evt.safeDescription).not.toContain('raw student chat');
    expect(evt.safeDescription).not.toContain('private learner memory');
    expect(evt.safeDescription).not.toContain('answer key');
    expect(evt.safeReasonCodes).toEqual(['admin_approved', 'operator_ready', 'teacher_lead_ready']);
  });

  it('should append multiple evidence events sequentially', () => {
    const { sessionId } = task035Repository.createSession({
      schoolId: 'school_task035_full_school_safe',
    });
    task035Repository.appendEvidence(sessionId, {
      eventId: 'evt_003', evidenceType: 'simulation_complete', safeDescription: 'Simulation passed', safeReasonCodes: [], timestamp: new Date().toISOString(), actorRole: 'admin',
    });
    task035Repository.appendEvidence(sessionId, {
      eventId: 'evt_004', evidenceType: 'rollback_ready', safeDescription: 'Rollback readiness confirmed', safeReasonCodes: ['plan_exists'], timestamp: new Date().toISOString(), actorRole: 'operator',
    });
    task035Repository.appendEvidence(sessionId, {
      eventId: 'evt_005', evidenceType: 'final_decision_computed', safeDescription: 'Decision: safe to start Task 036', safeReasonCodes: ['all_gates_passed'], timestamp: new Date().toISOString(), actorRole: 'admin',
    });
    const session = task035Repository.getSession(sessionId);
    expect(session.evidence).toHaveLength(3);
    expect(session.evidence[2].eventId).toBe('evt_005');
  });

  it('should return false when appending evidence to a non-existent session', () => {
    const result = task035Repository.appendEvidence('nonexistent', {
      eventId: 'evt_bad',
      evidenceType: 'test',
      safeDescription: 'should not append',
      safeReasonCodes: [],
      timestamp: new Date().toISOString(),
      actorRole: 'admin',
    });
    expect(result).toBe(false);
  });
});
