import { describe, it, expect, beforeEach } from 'vitest';
import { recordTask030SafeEvidenceEvent, listTask030SafeEvidenceEvents } from '../services/task030RehearsalEvidenceLedgerService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Evidence Ledger', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should record a safe evidence event', async () => {
    const event = await recordTask030SafeEvidenceEvent({
      eventId: '',
      runId: 'run_evt_001',
      scenarioId: 'scenario_001',
      stageId: 'stage_001',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'Test evidence event',
      reasonCodes: ['test'],
      createdAt: '',
    });
    expect(event.eventId).toBeDefined();
    expect(event.runId).toBe('run_evt_001');
  });

  it('should throw on forbidden fields', async () => {
    await expect(recordTask030SafeEvidenceEvent({
      eventId: '',
      runId: 'run_evt_bad',
      scenarioId: 'scenario_001',
      stageId: 'stage_001',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'leak',
      reasonCodes: [],
      createdAt: '',
      rawStudentData: 'leaked',
    } as any)).rejects.toThrow();
  });

  it('should list evidence events for a run', async () => {
    await recordTask030SafeEvidenceEvent({
      eventId: '',
      runId: 'run_evt_list',
      scenarioId: 'scenario_001',
      stageId: 'stage_001',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'Event 1',
      reasonCodes: ['code1'],
      createdAt: '',
    });
    const ledger = await listTask030SafeEvidenceEvents('run_evt_list');
    expect(ledger.ledgerId).toContain('run_evt_list');
    expect(ledger.events.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter out events with forbidden fields from list', async () => {
    await recordTask030SafeEvidenceEvent({
      eventId: '',
      runId: 'run_evt_filter',
      scenarioId: 'scenario_001',
      stageId: 'stage_001',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'Safe event',
      reasonCodes: [],
      createdAt: '',
    });
    await task030ControlledStagingRehearsalRepository.recordEvidenceEvent({
      eventId: 'bad_evt',
      runId: 'run_evt_filter',
      scenarioId: 'scenario_001',
      stageId: 'stage_001',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'leak',
      reasonCodes: [],
      createdAt: '',
      rawStudentData: 'exposed',
    } as any);

    const ledger = await listTask030SafeEvidenceEvents('run_evt_filter');
    const hasBad = ledger.events.some(e => e.eventId === 'bad_evt');
    expect(hasBad).toBe(false);
  });

  it('should return ledger with runId', async () => {
    await recordTask030SafeEvidenceEvent({
      eventId: '',
      runId: 'run_evt_ledger',
      scenarioId: 'scenario_001',
      stageId: 'stage_001',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'test',
      reasonCodes: [],
      createdAt: '',
    });
    const ledger = await listTask030SafeEvidenceEvents('run_evt_ledger');
    expect(ledger.runId).toBe('run_evt_ledger');
  });

  it('should return empty events for unknown run', async () => {
    const ledger = await listTask030SafeEvidenceEvents('nonexistent_run');
    expect(ledger.events).toHaveLength(0);
  });

  it('should set createdAt when not provided', async () => {
    const event = await recordTask030SafeEvidenceEvent({
      eventId: '',
      runId: 'run_evt_date',
      scenarioId: 'scenario_001',
      stageId: 'stage_001',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'test',
      reasonCodes: [],
      createdAt: '',
    });
    expect(event.createdAt).toBeDefined();
    expect(() => new Date(event.createdAt)).not.toThrow();
  });

  it('should use provided eventId if available', async () => {
    const event = await recordTask030SafeEvidenceEvent({
      eventId: 'custom_evt_id',
      runId: 'run_evt_id',
      scenarioId: 'scenario_001',
      stageId: 'stage_001',
      actorRole: 'admin',
      syntheticRole: 'synthetic_admin',
      status: 'passed',
      safeSummary: 'test',
      reasonCodes: [],
      createdAt: '',
    });
    expect(event.eventId).toBe('custom_evt_id');
  });
});
