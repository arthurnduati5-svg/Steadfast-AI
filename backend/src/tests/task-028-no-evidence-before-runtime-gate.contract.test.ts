import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { recordExpansionMonitoringEvent } from '../services/task028ExpansionMonitoringEventService';

describe('Task 028 No Evidence Before Runtime Gate', () => {
  const SCHOOL_ID = 'evidence_before_gate_school';
  const PILOT_ID = 'pilot_evidence_gate';

  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('should create evidence write blocked event when gate is not cleared', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_ev_gate',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Evidence gate test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    const event = await recordExpansionMonitoringEvent({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'evidence_write_blocked_before_guard',
      eventStatus: 'blocked',
      safeSummary: 'Evidence write blocked before runtime guard (test).',
      reasonCodes: ['evidence_write_not_gate_cleared'],
    });

    expect(event.ok).toBe(true);
    expect(event.eventId).toBeTruthy();
  });

  it('should block evidence write monitoring event when actor role is missing', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: '',
      eventType: 'evidence_write_blocked_before_guard',
      eventStatus: 'blocked',
      safeSummary: 'Missing actor role test',
    });

    expect(event.ok).toBe(false);
    expect(event.reasonCodes).toContain('missing_actor_role');
  });

  it('should reject evidence event with invalid event type', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'evidence_write_not_a_real_type',
      eventStatus: 'blocked',
      safeSummary: 'Invalid type test',
    });

    expect(event.ok).toBe(false);
    expect(event.reasonCodes.some((r: string) => r.startsWith('invalid_event_type'))).toBe(true);
  });

  it('should block evidence event with unsafe content in metadata', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'evidence_write_blocked_before_guard',
      eventStatus: 'blocked',
      safeSummary: 'Evidence block test',
      metadataSafeJson: { privateKey: 'Bearer some_token_value' },
    });

    expect(event.ok).toBe(false);
    expect(event.reasonCodes).toContain('unsafe_metadata_detected');
  });

  it('should ensure evidence is not written before gate passes', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: 'missing_evidence_run',
      actorIdHash: 'no_hash',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
    expect(result.gateSnapshot).toHaveProperty('schoolVerified');
    expect(result.gateSnapshot).toHaveProperty('executionRunExists');
    expect(result.gateSnapshot.executionRunExists).toBe(false);
  });

  it('should include stageActive false in gate snapshot when no active stage', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_ev_gate',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Evidence gate run no stage',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: 'some_hash',
      role: 'student',
    });

    expect(result.gateSnapshot.stageActive).toBe(false);
    expect(result.reasonCodes).toContain('no_active_stage');
  });
});
