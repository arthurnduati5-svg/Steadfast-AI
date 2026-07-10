import { describe, it, expect, beforeEach } from 'vitest';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';
import { appendTask034EvidenceEvent, getTask034EvidenceLedger } from '../services/task034EvidenceLedgerService';
import type { Task034EvidenceEvent } from '../contracts/task034ControlledLimitedRolloutContracts';

const SESSION_ID = 'test-sess-evidence';
const OTHER_SESSION = 'test-sess-other';

const makeEvent = (sessionId: string, overrides?: Partial<Task034EvidenceEvent>): Task034EvidenceEvent => ({
  eventId: `evt-${Date.now()}-${Math.random()}`,
  sessionId,
  evidenceType: 'privacy_review_pass',
  safeDescription: 'Privacy review passed',
  safeReasonCodes: ['privacy_ok'],
  timestamp: new Date().toISOString(),
  actorRole: 'internal_operator',
  ...overrides,
});

describe('Task034 Evidence Ledger', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('Evidence events can be appended', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    expect(ledger.totalCount).toBe(1);
  });

  it('Ledger returns all events for a session', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    expect(ledger.totalCount).toBe(3);
    expect(ledger.events.length).toBe(3);
  });

  it('Total count is accurate', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    expect(ledger.totalCount).toBe(2);
    expect(ledger.totalCount).toBe(ledger.events.length);
  });

  it('Each event has required fields', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    const event = ledger.events[0];
    expect(event.eventId).toBeTruthy();
    expect(event.sessionId).toBe(SESSION_ID);
    expect(event.evidenceType).toBeTruthy();
    expect(event.safeDescription).toBeTruthy();
    expect(Array.isArray(event.safeReasonCodes)).toBe(true);
    expect(event.timestamp).toBeTruthy();
    expect(event.actorRole).toBeTruthy();
  });

  it('Cross-session isolation (other session events not included)', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    await appendTask034EvidenceEvent(makeEvent(OTHER_SESSION));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    expect(ledger.totalCount).toBe(1);
  });

  it('Multiple evidence types are supported', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID, { evidenceType: 'runtime_guard_pass' }));
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID, { evidenceType: 'health_budget_pass' }));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    expect(ledger.events[0].evidenceType).toBe('runtime_guard_pass');
    expect(ledger.events[1].evidenceType).toBe('health_budget_pass');
  });

  it('Actor role is preserved in evidence event', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID, { actorRole: 'operations_reviewer' }));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    expect(ledger.events[0].actorRole).toBe('operations_reviewer');
  });

  it('Safe description is stored', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID, { safeDescription: 'All gates passed' }));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    expect(ledger.events[0].safeDescription).toBe('All gates passed');
  });

  it('generatedAt timestamp is set on ledger', async () => {
    await appendTask034EvidenceEvent(makeEvent(SESSION_ID));
    const ledger = await getTask034EvidenceLedger(SESSION_ID);
    expect(ledger.generatedAt).toBeTruthy();
    expect(typeof ledger.generatedAt).toBe('string');
  });

  it('Empty session returns empty ledger', async () => {
    const ledger = await getTask034EvidenceLedger('empty-session');
    expect(ledger.totalCount).toBe(0);
    expect(ledger.events).toHaveLength(0);
  });
});
