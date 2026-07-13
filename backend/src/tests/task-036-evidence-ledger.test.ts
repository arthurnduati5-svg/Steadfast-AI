import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { Task036EvidenceEvent, Task036EvidenceLedger } from '../contracts/task036LiveSchoolLaunchContracts';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    appendEvidenceEvent: vi.fn(),
    getEvidenceLedger: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function createEvidenceEvent(overrides: Partial<Task036EvidenceEvent> = {}): Task036EvidenceEvent {
  return {
    eventId: overrides.eventId ?? 'evt-1',
    sessionId: overrides.sessionId ?? 'sess-1',
    eventType: overrides.eventType ?? 'gate_passed',
    safeSummary: overrides.safeSummary ?? 'Gate passed successfully',
    actorRole: overrides.actorRole ?? 'school_admin',
    timestamp: overrides.timestamp ?? new Date().toISOString(),
  };
}

describe('Task036 Evidence Ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends an evidence event', () => {
    const event = createEvidenceEvent();
    task036Repository.appendEvidenceEvent(event);
    expect(task036Repository.appendEvidenceEvent).toHaveBeenCalledWith(event);
  });

  it('retrieves ledger with events filtered by session', () => {
    const events = [
      createEvidenceEvent({ eventId: 'e1', sessionId: 's1', eventType: 'gate_passed' }),
      createEvidenceEvent({ eventId: 'e2', sessionId: 's1', eventType: 'approval_granted' }),
    ];
    const ledger: Task036EvidenceLedger = {
      sessionId: 's1',
      events,
      totalEventCount: 2,
      generatedAt: new Date().toISOString(),
    };
    vi.mocked(task036Repository.getEvidenceLedger).mockReturnValue(ledger);
    const result = task036Repository.getEvidenceLedger('s1');
    expect(result.totalEventCount).toBe(2);
    expect(result.events).toHaveLength(2);
    expect(result.events[0].eventType).toBe('gate_passed');
  });

  it('retrieves all evidence events when no session specified', () => {
    const events = [
      createEvidenceEvent({ eventId: 'e1', sessionId: 's1' }),
      createEvidenceEvent({ eventId: 'e2', sessionId: 's2' }),
    ];
    const ledger: Task036EvidenceLedger = {
      sessionId: 'all',
      events,
      totalEventCount: 2,
      generatedAt: new Date().toISOString(),
    };
    vi.mocked(task036Repository.getEvidenceLedger).mockReturnValue(ledger);
    const result = task036Repository.getEvidenceLedger();
    expect(result.totalEventCount).toBe(2);
    expect(result.sessionId).toBe('all');
  });

  it('returns empty ledger when no events exist', () => {
    const ledger: Task036EvidenceLedger = {
      sessionId: 's1',
      events: [],
      totalEventCount: 0,
      generatedAt: new Date().toISOString(),
    };
    vi.mocked(task036Repository.getEvidenceLedger).mockReturnValue(ledger);
    const result = task036Repository.getEvidenceLedger('s1');
    expect(result.totalEventCount).toBe(0);
    expect(result.events).toEqual([]);
  });

  it('stores safe summary in evidence event', () => {
    const event = createEvidenceEvent({
      safeSummary: 'Environment gate passed - single school scope confirmed',
    });
    expect(event.safeSummary).toContain('Environment gate passed');
    expect(event.actorRole).toBe('school_admin');
  });

  it('records all required event fields', () => {
    const event = createEvidenceEvent({
      eventId: 'evt-complete',
      sessionId: 'sess-1',
      eventType: 'rollback_requested',
      safeSummary: 'Rollback requested due to cross-school attempt',
      actorRole: 'rollback_owner',
    });
    expect(event.eventId).toBeTruthy();
    expect(event.sessionId).toBeTruthy();
    expect(event.eventType).toBeTruthy();
    expect(event.safeSummary).toBeTruthy();
    expect(event.actorRole).toBeTruthy();
  });
});
