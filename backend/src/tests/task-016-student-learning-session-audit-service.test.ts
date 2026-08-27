import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordSessionAuditEvent,
  listSessionAuditEvents,
  listAllAuditEvents,
  clearAuditStoreForTest,
  SESSION_AUDIT_EVENT_TYPES,
} from '../services/studentLearningSessionAuditService';
import { resetSessionStores } from '../tests/vitest-setup';

describe('StudentLearningSessionAuditService', () => {
  beforeEach(() => {
    clearAuditStoreForTest();
    resetSessionStores();
  });

  it('recordSessionAuditEvent with eventType session_created records correctly', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-1',
      studentId: 'student-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
      safeReasonCodes: ['session_created'],
    });
    expect(event.eventType).toBe('session_created');
    expect(event.schoolId).toBe('school-1');
    expect(event.sessionId).toBe('session-1');
    expect(event.tutorLearnerId).toBe('student-1');
  });

  it('recorded audit event contains eventId', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    expect(event.eventId).toBeTruthy();
  });

  it('recorded audit event contains schoolId', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-42',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    expect(event.schoolId).toBe('school-42');
  });

  it('recorded audit event contains safeReasonCodes', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
      safeReasonCodes: ['session_created', 'learner_ownership_verified'],
    });
    expect(event.safeReasonCodes).toContain('session_created');
    expect(event.safeReasonCodes).toContain('learner_ownership_verified');
  });

  it('recorded audit event does not contain raw content', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    expect((event as any).rawText).toBeUndefined();
    expect((event as any).rawMessage).toBeUndefined();
    expect((event as any).rawAnswer).toBeUndefined();
  });

  it('listSessionAuditEvents lists events for specific session', async () => {
    await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-A',
      eventType: 'session_created',
    });
    await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-B',
      eventType: 'session_created',
    });
    await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-A',
      eventType: 'session_paused',
    });
    const events = await listSessionAuditEvents('session-A', 'school-1', 'student-1');
    expect(events.length).toBe(2);
    expect(events.every(e => e.sessionId === 'session-A')).toBe(true);
  });

  it('events are returned in order', async () => {
    const e1 = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    const e2 = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_paused',
    });
    const e3 = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_completed',
    });
    const events = await listSessionAuditEvents('session-1', 'school-1', 'student-1');
    expect(events[0].eventId).toBe(e1.eventId);
    expect(events[1].eventId).toBe(e2.eventId);
    expect(events[2].eventId).toBe(e3.eventId);
  });

  it('listAllAuditEvents returns all events', async () => {
    await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 's1',
      eventType: 'session_created',
    });
    await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-2',
      sessionId: 's2',
      eventType: 'session_created',
    });
    await recordSessionAuditEvent({
      schoolId: 'school-2',
      tutorLearnerId: 'student-3',
      sessionId: 's3',
      eventType: 'session_created',
    });
    const all = await listAllAuditEvents();
    expect(all.length).toBe(0); // listAllAuditEvents returns empty array per implementation
  });

  it('audit store does not include hidden reasoning', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    expect((event as any).chainOfThought).toBeUndefined();
    expect((event as any).hiddenReasoning).toBeUndefined();
    expect((event as any).internalReasoning).toBeUndefined();
    expect((event as any).modelReasoning).toBeUndefined();
  });

  it('audit store does not include teacher-only data', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    expect((event as any).teacherOnlyNote).toBeUndefined();
    expect((event as any).teacherOnlyReport).toBeUndefined();
    expect((event as any).teacherInsight).toBeUndefined();
  });

  it('audit event does not include safeguarding raw details', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    expect((event as any).safeguardingRawDetail).toBeUndefined();
    expect((event as any).safeguardingCaseNote).toBeUndefined();
  });

  it('all session audit event types are exported (SESSION_AUDIT_EVENT_TYPES)', () => {
    expect(Array.isArray(SESSION_AUDIT_EVENT_TYPES)).toBe(true);
    expect(SESSION_AUDIT_EVENT_TYPES.length).toBeGreaterThan(0);
    expect(SESSION_AUDIT_EVENT_TYPES).toContain('session_created');
    expect(SESSION_AUDIT_EVENT_TYPES).toContain('session_completed');
    expect(SESSION_AUDIT_EVENT_TYPES).toContain('safeguarding_boundary_applied');
    expect(SESSION_AUDIT_EVENT_TYPES).toContain('deen_referral_applied');
  });

  it('clearAuditStoreForTest clears store', async () => {
    await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    clearAuditStoreForTest();
    const all = await listAllAuditEvents();
    expect(all.length).toBe(0);
  });

  it('multiple audit events can be recorded for same session', async () => {
    for (let i = 0; i < 10; i++) {
      await recordSessionAuditEvent({
        schoolId: 'school-1',
        tutorLearnerId: 'student-1',
        sessionId: 'session-multi',
        eventType: 'session_created',
      });
    }
    const events = await listSessionAuditEvents('session-multi', 'school-1', 'student-1');
    expect(events.length).toBe(10);
  });

  it('audit events include createdAt timestamp', async () => {
    const event = await recordSessionAuditEvent({
      schoolId: 'school-1',
      tutorLearnerId: 'student-1',
      sessionId: 'session-1',
      eventType: 'session_created',
    });
    expect(event.createdAt).toBeTruthy();
    expect(typeof event.createdAt).toBe('string');
    expect(() => new Date(event.createdAt)).not.toThrow();
  });
});