import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordTask031SafeEvidenceEvent,
  listTask031SafeEvidenceEvents,
  clearTask031EvidenceLedger,
} from '../services/task031SafeEvidenceLedgerService';

describe('Task 031 - Safe Evidence Ledger', () => {
  beforeEach(() => {
    clearTask031EvidenceLedger();
  });

  it('should record a safe evidence event', async () => {
    const event = await recordTask031SafeEvidenceEvent({
      runId: 'run_001',
      stageId: 'env_gate',
      scenarioId: 'scenario_route',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'Environment gate passed.',
      reasonCodes: [],
    });
    expect(event.eventId).toBeTruthy();
    expect(event.runId).toBe('run_001');
    expect(event.stageId).toBe('stage_gate');
    expect(event.scenarioId).toBe('scenario_route');
    expect(event.actorRole).toBe('admin');
    expect(event.syntheticRole).toBe('synthetic_admin');
    expect(event.status).toBe('passed');
    expect(event.safeSummary).toBe('Environment gate passed');
    expect(event.createdAt).toBeTruthy();
  });

  it('should strip forbidden fields from input', async () => {
    const event = await recordTask031SafeEvidenceEvent({
      runId: 'run_002',
      rawPayload: 'should not appear',
      secrets: 'should not appear',
      studentPrivateData: 'should not appear',
    });
    expect(event.runId).toBe('run_002');
    expect((event as any).rawPayload).toBeUndefined();
    expect((event as any).secrets).toBeUndefined();
    expect((event as any).studentPrivateData).toBeUndefined();
  });

  it('should use defaults for missing fields', async () => {
    const event = await recordTask031SafeEvidenceEvent({});
    expect(event.runId).toBe('unknown_run');
    expect(event.stageId).toBe('unknown_stage');
    expect(event.scenarioId).toBe('unknown_scenario');
    expect(event.actorRole).toBe('unknown');
    expect(event.syntheticRole).toBe('synthetic_unknown');
    expect(event.status).toBe('recorded');
    expect(event.safeSummary).toBe('No details exposed.');
    expect(event.reasonCodes).toEqual([]);
  });

  it('should list events by runId', async () => {
    await recordTask031SafeEvidenceEvent({ runId: 'run_list', stageId: 'first' });
    await recordTask031SafeEvidenceEvent({ runId: 'run_list', stageId: 'second' });
    const ledger = await listTask031SafeEvidenceEvents('run_list');
    expect(ledger.runId).toBe('run_list');
    expect(ledger.events).toHaveLength(2);
  });

  it('should return empty events for unknown runId', async () => {
    const ledger = await listTask031SafeEvidenceEvents('nonexistent');
    expect(ledger.runId).toBe('nonexistent');
    expect(ledger.events).toEqual([]);
  });

  it('should clear all events between tests', async () => {
    await recordTask031SafeEvidenceEvent({ runId: 'to_clear' });
    clearTask031EvidenceLedger();
    const ledger = await listTask031SafeEvidenceEvents('to_clear');
    expect(ledger.events).toEqual([]);
  });

  it('should preserve reasonCodes array', async () => {
    const event = await recordTask031SafeEvidenceEvent({
      runId: 'run_reasons',
      reasonCodes: ['gate_pass', 'no_issues'],
    });
    expect(event.reasonCodes).toEqual(['gate_pass', 'no_issues']);
  });
});