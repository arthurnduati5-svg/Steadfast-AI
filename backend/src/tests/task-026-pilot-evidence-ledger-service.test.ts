import { describe, it, expect, beforeEach } from 'vitest';
import { recordEvidenceEvent, listEvidenceEvents } from '../services/task026PilotEvidenceLedgerService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026PilotEvidenceLedgerService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('rejects missing schoolId', async () => {
    const result = await recordEvidenceEvent({ schoolId: '', pilotRunId: 'r1', eventType: 'session_started', actorRole: 'learner', safeSummary: 'test' });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid event type', async () => {
    const result = await recordEvidenceEvent({ schoolId: 's1', pilotRunId: 'r1', eventType: 'invalid_event' as any, actorRole: 'learner', safeSummary: 'test' });
    expect(result.ok).toBe(false);
  });

  it('rejects metadata with forbidden fields', async () => {
    const result = await recordEvidenceEvent({ schoolId: 's1', pilotRunId: 'r1', eventType: 'session_started', actorRole: 'learner', safeSummary: 'test', metadataSafeJson: { rawChat: 'leaked' } });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('forbidden_field');
  });

  it('records evidence event with valid input', async () => {
    const run = await task026PilotExecutionRepository.createPilotRun({
      schoolId: 'school-1', pilotProgramId: 'pp-1', status: 'active_controlled',
      cohortIds: ['c1'], teacherOwnerId: 't1', supportOwnerId: 's1',
      safeguardingOwnerId: 'sg1', pauseOwnerId: 'p1', rollbackOwnerId: 'r1', monitoringOwnerId: 'm1',
      approvedCurriculumScopeIds: ['cur1'], approvedSourceScopeIds: ['src1'],
      activatedAt: null, pausedAt: null, rolledBackAt: null, completedAt: null, cancelledAt: null,
      blockingIssues: [],
    });
    const result = await recordEvidenceEvent({ schoolId: 'school-1', pilotRunId: run.id, eventType: 'session_started', actorRole: 'learner', safeSummary: 'Session started safely' });
    expect(result.ok).toBe(true);
    expect(result.event).toBeTruthy();
    expect(result.event!.eventType).toBe('session_started');
  });

  it('records all evidence event types', async () => {
    const types = ['learner_access_allowed', 'session_blocked', 'support_needed', 'teacher_monitor_viewed', 'pilot_paused'] as const;
    for (const t of types) {
      const result = await recordEvidenceEvent({ schoolId: 's1', pilotRunId: 'r1', eventType: t as any, actorRole: 'system', safeSummary: t });
      expect(result.ok).toBe(true);
    }
  });

  describe('listEvidenceEvents', () => {
    it('returns error for missing runId', async () => {
      const result = await listEvidenceEvents('');
      expect(result.ok).toBe(false);
      expect(result.reasonCodes).toContain('missing_run_id');
    });

    it('returns empty array when no events', async () => {
      const result = await listEvidenceEvents('r1');
      expect(result.ok).toBe(true);
      expect(result.events).toEqual([]);
    });

    it('returns recorded events', async () => {
      await task026PilotExecutionRepository.recordEvidenceEvent({ schoolId: 's1', pilotRunId: 'r1', eventType: 'session_started', actorRole: 'learner', safeSummary: 'Session', metadataSafeJson: {} });
      const result = await listEvidenceEvents('r1');
      expect(result.ok).toBe(true);
      expect(result.events.length).toBe(1);
    });
  });
});
