import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { recordAuditEvent, listAuditEvents } from '../services/task027GovernanceAuditService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

const SCHOOL_A = 'test-school-audit-a';
const SCHOOL_B = 'test-school-audit-b';

describe('task027GovernanceAuditService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  afterEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('records audit event', async () => {
    const event = {
      id: '',
      schoolId: SCHOOL_A,
      actorRole: 'system_admin' as const,
      action: 'evidence_pack_generated' as const,
      safeSummary: 'Evidence pack generated successfully',
      metadataSafe: { proposalId: 'prop-1', blockingIssuesCount: 0 },
      createdAt: new Date(),
    };

    const result = await recordAuditEvent(event);
    expect(result).not.toBeNull();
    expect(result.id).toBeTruthy();
    expect(result.schoolId).toBe(SCHOOL_A);
    expect(result.action).toBe('evidence_pack_generated');
    expect(result.safeSummary).toBe('Evidence pack generated successfully');
  });

  it('lists events by school', async () => {
    await recordAuditEvent({
      id: '',
      schoolId: SCHOOL_A,
      actorRole: 'system_admin',
      action: 'decision_made',
      safeSummary: 'Decision made for school A',
      metadataSafe: {},
      createdAt: new Date(),
    });

    await recordAuditEvent({
      id: '',
      schoolId: SCHOOL_B,
      actorRole: 'school_admin',
      action: 'governance_started',
      safeSummary: 'Governance started for school B',
      metadataSafe: {},
      createdAt: new Date(),
    });

    await recordAuditEvent({
      id: '',
      schoolId: SCHOOL_A,
      actorRole: 'internal_operator',
      action: 'evidence_loaded',
      safeSummary: 'Evidence loaded for school A',
      metadataSafe: {},
      createdAt: new Date(),
    });

    const schoolAEvents = await listAuditEvents(SCHOOL_A);
    expect(schoolAEvents.length).toBe(2);
    expect(schoolAEvents.every(e => e.schoolId === SCHOOL_A)).toBe(true);

    const schoolBEvents = await listAuditEvents(SCHOOL_B);
    expect(schoolBEvents.length).toBe(1);
    expect(schoolBEvents[0].schoolId).toBe(SCHOOL_B);
  });

  it('limits event count', async () => {
    for (let i = 0; i < 5; i++) {
      await recordAuditEvent({
        id: '',
        schoolId: SCHOOL_A,
        actorRole: 'system_admin',
        action: 'evidence_pack_generated',
        safeSummary: `Event ${i}`,
        metadataSafe: { index: i },
        createdAt: new Date(),
      });
    }

    const allEvents = await listAuditEvents(SCHOOL_A);
    expect(allEvents.length).toBe(5);

    const limitedEvents = await listAuditEvents(SCHOOL_A, 3);
    expect(limitedEvents.length).toBe(3);

    const singleEvent = await listAuditEvents(SCHOOL_A, 1);
    expect(singleEvent.length).toBe(1);
  });

  it('returns empty array for unknown school', async () => {
    await recordAuditEvent({
      id: '',
      schoolId: SCHOOL_A,
      actorRole: 'system_admin',
      action: 'evidence_pack_generated',
      safeSummary: 'Test event',
      metadataSafe: {},
      createdAt: new Date(),
    });

    const unknownEvents = await listAuditEvents('unknown-school-x');
    expect(unknownEvents).toEqual([]);
    expect(unknownEvents.length).toBe(0);
  });
});
