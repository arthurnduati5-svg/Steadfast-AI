import { describe, it, expect, beforeEach } from 'vitest';
import { recordAuditEvent, listAuditEvents } from '../services/task026ExecutionAuditService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026ExecutionAuditService', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  describe('recordAuditEvent', () => {
    it('rejects missing schoolId', async () => {
      const result = await recordAuditEvent({ schoolId: '', actorRole: 'admin', action: 'run_created', safeSummary: 'test' });
      expect(result.ok).toBe(false);
      expect(result.reasonCodes).toContain('missing_school_id');
    });

    it('rejects missing actorRole', async () => {
      const result = await recordAuditEvent({ schoolId: 's1', actorRole: '', action: 'run_created', safeSummary: 'test' });
      expect(result.ok).toBe(false);
    });

    it('rejects missing action', async () => {
      const result = await recordAuditEvent({ schoolId: 's1', actorRole: 'admin', action: '' as any, safeSummary: 'test' });
      expect(result.ok).toBe(false);
    });

    it('rejects metadata with forbidden fields', async () => {
      const result = await recordAuditEvent({ schoolId: 's1', actorRole: 'school_admin', action: 'run_created', safeSummary: 'test', metadataSafeJson: { rawChat: 'leaked' } });
      expect(result.ok).toBe(false);
      expect(result.reasonCodes).toContain('forbidden_field');
    });

    it('records audit event with valid input', async () => {
      const result = await recordAuditEvent({ schoolId: 'school-1', actorRole: 'school_admin', action: 'run_created', safeSummary: 'Run created' });
      expect(result.ok).toBe(true);
      expect(result.event).toBeTruthy();
      expect(result.event!.action).toBe('run_created');
      expect(result.event!.schoolId).toBe('school-1');
    });

    it('records all audit event types', async () => {
      const actions = ['run_activated', 'run_paused', 'run_resumed', 'rollback_requested', 'run_rolled_back', 'run_completed', 'run_cancelled'] as const;
      for (const action of actions) {
        const result = await recordAuditEvent({ schoolId: 's1', actorRole: 'system', action, safeSummary: action });
        expect(result.ok).toBe(true);
      }
    });

    it('truncates long safeSummary to 2000 chars', async () => {
      const long = 'x'.repeat(3000);
      const result = await recordAuditEvent({ schoolId: 's1', actorRole: 'admin', action: 'run_created', safeSummary: long });
      expect(result.ok).toBe(true);
      expect(result.event!.safeSummary.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('listAuditEvents', () => {
    it('returns empty array when no events', async () => {
      const result = await listAuditEvents('r1');
      expect(result.ok).toBe(true);
      expect(result.events).toEqual([]);
    });

    it('returns events filtered by runId', async () => {
      await task026PilotExecutionRepository.recordAuditEvent({ runId: 'r1', schoolId: 's1', actorRole: 'admin', action: 'run_created', safeSummary: 'test', metadataSafeJson: {} });
      await task026PilotExecutionRepository.recordAuditEvent({ runId: 'r2', schoolId: 's1', actorRole: 'admin', action: 'run_created', safeSummary: 'test', metadataSafeJson: {} });
      const result = await listAuditEvents('r1');
      expect(result.events.length).toBe(1);
    });

    it('returns all events when no runId specified', async () => {
      await task026PilotExecutionRepository.recordAuditEvent({ runId: 'r1', schoolId: 's1', actorRole: 'admin', action: 'run_created', safeSummary: 'test', metadataSafeJson: {} });
      await task026PilotExecutionRepository.recordAuditEvent({ runId: 'r2', schoolId: 's1', actorRole: 'admin', action: 'run_paused', safeSummary: 'test', metadataSafeJson: {} });
      const result = await listAuditEvents();
      expect(result.events.length).toBe(2);
    });
  });
});
