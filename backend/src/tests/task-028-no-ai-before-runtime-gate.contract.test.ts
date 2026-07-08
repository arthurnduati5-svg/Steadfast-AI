import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';

describe('Task 028 No AI Before Runtime Gate', () => {
  const SCHOOL_ID = 'ai_before_gate_school';

  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('should block when execution run does not exist', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: 'nonexistent_run',
      actorIdHash: 'some_hash',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('expansion_execution_run_not_found');
  });

  it('should block when participant is not in expanded cohort', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_ai_gate',
      pilotProgramId: 'pilot_ai_gate',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'AI gate test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: 'unregistered_hash',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('participant_not_in_expanded_cohort');
  });

  it('should block when kill switch is engaged', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_ai_gate',
      pilotProgramId: 'pilot_ai_gate',
      schoolId: SCHOOL_ID,
      status: 'stage_1_active',
      safeSummary: 'AI gate test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: {},
    });
    const RUN_ID = (run as any).id;

    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId: RUN_ID,
      pilotProgramId: 'pilot_ai_gate',
      schoolId: SCHOOL_ID,
      actorRole: 'admin',
      action: 'kill_switch_engaged',
      safeSummary: 'Kill switch engaged for test',
    });

    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: RUN_ID,
      actorIdHash: 'some_hash',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('kill_switch_enabled');
  });

  it('should block when expansion is paused', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_ai_gate',
      pilotProgramId: 'pilot_ai_gate',
      schoolId: SCHOOL_ID,
      status: 'paused',
      safeSummary: 'AI gate test run paused',
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
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('expansion_paused');
  });

  it('should block when expansion is rolled back', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_ai_gate',
      pilotProgramId: 'pilot_ai_gate',
      schoolId: SCHOOL_ID,
      status: 'rolled_back',
      safeSummary: 'AI gate test run rolled back',
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
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('expansion_rolled_back');
  });

  it('should return allowed: false with reason codes when gate fails', async () => {
    const result = await checkExpandedSessionGate({
      schoolId: SCHOOL_ID,
      executionRunId: 'missing_run',
      actorIdHash: 'missing_hash',
      role: 'unknown_role',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes.length).toBeGreaterThan(0);
    expect(result.safeMessage).toContain('blocked');
  });
});
