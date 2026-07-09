import { describe, it, expect, beforeEach } from 'vitest';
import { recordTask032CanaryEvidenceEvent, listTask032CanaryEvidenceEvents } from '../services/task032CanaryActivationEvidenceLedgerService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import type { Task032CanaryEvidenceEvent } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Evidence Ledger', () => {
  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const activationId = 'act_task032_evidence_001';

  function createEvent(overrides: Partial<Task032CanaryEvidenceEvent> = {}): Task032CanaryEvidenceEvent {
    return {
      eventId: `evt_${activationId}_${Date.now()}`,
      activationId,
      stageId: 'environment_gate',
      actorRole: 'school_admin',
      status: 'passed',
      safeSummary: 'Environment gate passed with controlled canary mode',
      reasonCodes: ['environment_type_valid', 'activation_mode_valid'],
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  it('should record evidence event with all fields', async () => {
    const event = createEvent();
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    expect(recorded.eventId).toBe(event.eventId);
    expect(recorded.activationId).toBe(activationId);
    expect(recorded.stageId).toBe('environment_gate');
    expect(recorded.actorRole).toBe('school_admin');
    expect(recorded.status).toBe('passed');
    expect(recorded.safeSummary).toBeTruthy();
    expect(recorded.createdAt).toBeTruthy();
  });

  it('should list events by activationId', async () => {
    await recordTask032CanaryEvidenceEvent(createEvent());
    await recordTask032CanaryEvidenceEvent(createEvent({ stageId: 'cohort_eligibility', status: 'passed' }));
    const ledger = await listTask032CanaryEvidenceEvents(activationId);
    expect(ledger.activationId).toBe(activationId);
    expect(ledger.events.length).toBe(2);
  });

  it('should return correct event count', async () => {
    await recordTask032CanaryEvidenceEvent(createEvent());
    await recordTask032CanaryEvidenceEvent(createEvent({ stageId: 'config_checking' }));
    await recordTask032CanaryEvidenceEvent(createEvent({ stageId: 'privacy_boundary' }));
    const ledger = await listTask032CanaryEvidenceEvents(activationId);
    expect(ledger.eventCount).toBe(3);
  });

  it('should not store raw payload', async () => {
    const event = createEvent();
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    const json = JSON.stringify(recorded);
    expect(json).not.toContain('rawPayload');
    expect(json).not.toContain('requestBody');
    expect(json).not.toContain('responseData');
  });

  it('should not store names', async () => {
    const event = createEvent();
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    const json = JSON.stringify(recorded);
    expect(json).not.toContain('studentName');
    expect(json).not.toContain('teacherName');
    expect(json).not.toContain('parentName');
  });

  it('should not store contact details', async () => {
    const event = createEvent();
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    const json = JSON.stringify(recorded);
    expect(json).not.toContain('email');
    expect(json).not.toContain('phone');
    expect(json).not.toMatch(/@/);
  });

  it('should not store student work', async () => {
    const event = createEvent();
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    const json = JSON.stringify(recorded);
    expect(json).not.toContain('studentWork');
    expect(json).not.toContain('learnerSubmission');
    expect(json).not.toContain('rawAnswer');
  });

  it('should not store chats', async () => {
    const event = createEvent();
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    const json = JSON.stringify(recorded);
    expect(json).not.toContain('rawChat');
    expect(json).not.toContain('chatTranscript');
    expect(json).not.toContain('studentMessage');
  });

  it('should not store AI content', async () => {
    const event = createEvent();
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    const json = JSON.stringify(recorded);
    expect(json).not.toContain('aiPrompt');
    expect(json).not.toContain('providerResponse');
    expect(json).not.toContain('hiddenReasoning');
  });

  it('should not store secrets', async () => {
    const event = createEvent();
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    const json = JSON.stringify(recorded);
    expect(json).not.toContain('sk-proj-');
    expect(json).not.toContain('Bearer ');
    expect(json).not.toContain('authorization');
  });

  it('should return empty ledger for unknown activationId', async () => {
    const ledger = await listTask032CanaryEvidenceEvents('unknown_activation');
    expect(ledger.activationId).toBe('unknown_activation');
    expect(ledger.events).toHaveLength(0);
    expect(ledger.eventCount).toBe(0);
  });

  it('should preserve reason codes in events', async () => {
    const reasons = ['gate_passed', 'all_checks_ok', 'no_blockers'];
    const event = createEvent({ reasonCodes: reasons });
    const recorded = await recordTask032CanaryEvidenceEvent(event);
    expect(recorded.reasonCodes).toEqual(reasons);
  });
});
