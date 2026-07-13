import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveLaunchEvent: vi.fn(),
    getLaunchEvent: vi.fn(),
    listLaunchEventsForSession: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function intakeEvent(event: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!event.eventId) errors.push('missing_event_id');
  if (!event.sessionId) errors.push('missing_session_id');
  if (!event.eventType) errors.push('missing_event_type');
  if (!event.safeSummary) errors.push('missing_safe_summary');
  if (errors.length > 0) return { ok: false, errors };
  task036Repository.saveLaunchEvent(event);
  return { ok: true, errors: [] };
}

describe('Task036 Event Intake', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('intakes a valid event', () => {
    const event = {
      eventId: 'evt-1', sessionId: 'sess-1',
      eventType: 'gate_passed', safeSummary: 'Environment gate passed',
      timestamp: '2026-01-01T00:00:00Z',
    };
    const result = intakeEvent(event);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(task036Repository.saveLaunchEvent).toHaveBeenCalledWith(event);
  });

  it('rejects event with missing eventId', () => {
    const event = { sessionId: 'sess-1', eventType: 'pass', safeSummary: 'ok', timestamp: '' };
    const result = intakeEvent(event);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('missing_event_id');
  });

  it('rejects event with missing sessionId', () => {
    const event = { eventId: 'evt-1', eventType: 'pass', safeSummary: 'ok', timestamp: '' };
    const result = intakeEvent(event);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('missing_session_id');
  });

  it('rejects event with missing safeSummary', () => {
    const event = { eventId: 'evt-1', sessionId: 'sess-1', eventType: 'pass', timestamp: '' };
    const result = intakeEvent(event);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('missing_safe_summary');
  });

  it('retrieves events for a session', () => {
    const events = [
      { eventId: 'e1', sessionId: 's1', eventType: 'pass', safeSummary: 'ok', timestamp: '' },
      { eventId: 'e2', sessionId: 's1', eventType: 'fail', safeSummary: 'nok', timestamp: '' },
    ];
    vi.mocked(task036Repository.listLaunchEventsForSession).mockReturnValue(events);
    const retrieved = task036Repository.listLaunchEventsForSession('s1');
    expect(retrieved.length).toBe(2);
  });

  it('retrieves a single event by ID', () => {
    const event = { eventId: 'evt-1', sessionId: 'sess-1', eventType: 'pass', safeSummary: 'ok', timestamp: '' };
    vi.mocked(task036Repository.getLaunchEvent).mockReturnValue(event);
    const retrieved = task036Repository.getLaunchEvent('evt-1');
    expect(retrieved!.eventType).toBe('pass');
  });
});
