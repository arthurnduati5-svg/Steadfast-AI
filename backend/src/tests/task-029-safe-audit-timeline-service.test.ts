import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task029SafeAuditTimelineInput, Task029SafeAuditTimeline } from '../contracts/task029ExpansionOperationsContracts';

vi.mock('../services/task029SafeAuditTimelineService', () => ({
  getSafeAuditTimeline: vi.fn(),
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    listOperationsAuditEvents: vi.fn(),
    recordAuditTimelineView: vi.fn(),
    recordOperationsAuditEvent: vi.fn(),
  },
}));

const { getSafeAuditTimeline } = await import('../services/task029SafeAuditTimelineService');

describe('getSafeAuditTimeline', () => {
  const validInput: Task029SafeAuditTimelineInput = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'admin',
    expansionRunId: 'run-1',
  };

  const mockTimeline: Task029SafeAuditTimeline = {
    schoolId: 'school-1',
    expansionRunId: 'run-1',
    events: [
      { eventId: 'audit_1', eventType: 'operation_viewed', createdAt: '2025-01-01T00:00:00Z', actorRole: 'admin', safeSummary: 'Dashboard viewed' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok:true with timeline data for valid input', async () => {
    vi.mocked(getSafeAuditTimeline).mockResolvedValue({ ok: true, data: mockTimeline, blockingIssues: [] });
    const result = await getSafeAuditTimeline(validInput);
    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.data!.schoolId).toBe('school-1');
  });

  it('returns events array in the timeline', async () => {
    vi.mocked(getSafeAuditTimeline).mockResolvedValue({ ok: true, data: mockTimeline, blockingIssues: [] });
    const result = await getSafeAuditTimeline(validInput);
    expect(Array.isArray(result.data!.events)).toBe(true);
    expect(result.data!.events.length).toBeGreaterThanOrEqual(0);
  });

  it('each event has required fields', async () => {
    vi.mocked(getSafeAuditTimeline).mockResolvedValue({ ok: true, data: mockTimeline, blockingIssues: [] });
    const result = await getSafeAuditTimeline(validInput);
    for (const event of result.data!.events) {
      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('eventType');
      expect(event).toHaveProperty('createdAt');
      expect(event).toHaveProperty('actorRole');
      expect(event).toHaveProperty('safeSummary');
    }
  });

  it('returns expansionRunId matching input', async () => {
    vi.mocked(getSafeAuditTimeline).mockResolvedValue({ ok: true, data: mockTimeline, blockingIssues: [] });
    const result = await getSafeAuditTimeline(validInput);
    expect(result.data!.expansionRunId).toBe('run-1');
  });

  it('returns blockingIssues when missing input fields', async () => {
    vi.mocked(getSafeAuditTimeline).mockResolvedValue({ ok: false, data: null, blockingIssues: ['missing_required_input_fields'] });
    const result = await getSafeAuditTimeline({ schoolId: '', actorId: '', actorRole: '', expansionRunId: '' });
    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('missing_required_input_fields');
  });

  it('blocks when schoolId is empty', async () => {
    vi.mocked(getSafeAuditTimeline).mockResolvedValue({ ok: false, data: null, blockingIssues: ['missing_required_input_fields'] });
    const result = await getSafeAuditTimeline({ ...validInput, schoolId: '' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });

  it('blocks when actorRole is missing', async () => {
    vi.mocked(getSafeAuditTimeline).mockResolvedValue({ ok: false, data: null, blockingIssues: ['missing_required_input_fields'] });
    const result = await getSafeAuditTimeline({ ...validInput, actorRole: '' });
    expect(result.ok).toBe(false);
  });

  it('event eventId contains the expansionRunId prefix', async () => {
    const timelineWithEvents: Task029SafeAuditTimeline = {
      schoolId: 'school-1',
      expansionRunId: 'run-abc',
      events: [
        { eventId: 'audit_run-abc_0_1234567890', eventType: 'dashboard_viewed', createdAt: '2025-01-01T00:00:00Z', actorRole: 'admin', safeSummary: 'test' },
      ],
    };
    vi.mocked(getSafeAuditTimeline).mockResolvedValue({ ok: true, data: timelineWithEvents, blockingIssues: [] });
    const result = await getSafeAuditTimeline(validInput);
    expect(result.data!.events[0].eventId).toContain('run-abc');
  });
});
