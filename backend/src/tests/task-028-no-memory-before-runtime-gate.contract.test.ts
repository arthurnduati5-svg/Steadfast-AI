import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { recordExpansionMonitoringEvent } from '../services/task028ExpansionMonitoringEventService';

describe('Task 028 No Memory Before Runtime Gate', () => {
  const SCHOOL_ID = 'memory_before_gate_school';
  const PILOT_ID = 'pilot_memory_gate';

  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('should create memory access blocked event when gate is not cleared', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_mem_gate',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'Memory gate test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    const event = await recordExpansionMonitoringEvent({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'memory_access_blocked_before_guard',
      eventStatus: 'blocked',
      safeSummary: 'Memory access blocked before runtime guard (test).',
      reasonCodes: ['memory_access_not_gate_cleared'],
    });

    expect(event.ok).toBe(true);
    expect(event.eventId).toBeTruthy();
    expect(event.reasonCodes).toHaveLength(0);
  });

  it('should block memory access monitoring event when required fields missing', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: '',
      pilotProgramId: '',
      schoolId: '',
      actorRole: 'system',
      eventType: 'memory_access_blocked_before_guard',
      eventStatus: 'blocked',
      safeSummary: 'Missing fields test',
    });

    expect(event.ok).toBe(false);
    expect(event.reasonCodes).toContain('missing_required_fields');
  });

  it('should reject memory event with unsafe content in safeSummary', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'memory_access_blocked_before_guard',
      eventStatus: 'blocked',
      safeSummary: 'Contains raw student chat in summary',
    });

    expect(event.ok).toBe(false);
    expect(event.reasonCodes).toContain('unsafe_content_detected');
  });

  it('should allow gate check to be independent of memory access', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: 'non_existent_run_for_memory',
      actorIdHash: 'no_participant_hash',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
    expect(result.gateSnapshot).toHaveProperty('schoolVerified');
  });

  it('should create gate snapshot showing executionRunExists false when run missing', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: 'missing_memory_run',
      actorIdHash: 'some_hash',
      role: 'student',
    });

    expect(result.gateSnapshot.executionRunExists).toBe(false);
    expect(result.reasonCodes).toContain('expansion_execution_run_not_found');
  });
});
