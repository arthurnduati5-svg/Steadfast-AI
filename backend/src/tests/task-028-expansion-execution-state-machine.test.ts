import { describe, it, expect, beforeEach } from 'vitest';
import { transitionExecutionState, assertCanTransition, VALID_EXECUTION_TRANSITIONS } from '../services/task028ExpansionExecutionStateMachine';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Expansion Execution State Machine', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'proposal-1', pilotProgramId: 'pp-1',
      schoolId: 'school-1', status: 'not_started', safeSummary: 'Test run',
    });
    executionRunId = (run as any).id;
  });

  it('should transition not_started to preflight_required', async () => {
    const result = await transitionExecutionState(executionRunId, 'preflight_required', 'admin', 'admin-hash');
    expect(result.ok).toBe(true);
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('preflight_required');
  });

  it('should transition preflight_required to ready', async () => {
    await transitionExecutionState(executionRunId, 'preflight_required', 'admin');
    const result = await transitionExecutionState(executionRunId, 'ready', 'admin');
    expect(result.ok).toBe(true);
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('ready');
  });

  it('should transition ready to stage_1_active', async () => {
    await transitionExecutionState(executionRunId, 'preflight_required', 'admin');
    await transitionExecutionState(executionRunId, 'ready', 'admin');
    const result = await transitionExecutionState(executionRunId, 'stage_1_active', 'admin');
    expect(result.ok).toBe(true);
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('stage_1_active');
    expect((run as any).startedAt).toBeTruthy();
  });

  it('should transition stage_1_active to stage_2_active', async () => {
    await transitionExecutionState(executionRunId, 'preflight_required', 'admin');
    await transitionExecutionState(executionRunId, 'ready', 'admin');
    await transitionExecutionState(executionRunId, 'stage_1_active', 'admin');
    const result = await transitionExecutionState(executionRunId, 'stage_2_active', 'admin');
    expect(result.ok).toBe(true);
  });

  it('should transition stage_2_active to stage_3_active', async () => {
    await transitionExecutionState(executionRunId, 'preflight_required', 'admin');
    await transitionExecutionState(executionRunId, 'ready', 'admin');
    await transitionExecutionState(executionRunId, 'stage_1_active', 'admin');
    await transitionExecutionState(executionRunId, 'stage_2_active', 'admin');
    const result = await transitionExecutionState(executionRunId, 'stage_3_active', 'admin');
    expect(result.ok).toBe(true);
  });

  it('should transition stage_3_active to completed', async () => {
    await transitionExecutionState(executionRunId, 'preflight_required', 'admin');
    await transitionExecutionState(executionRunId, 'ready', 'admin');
    await transitionExecutionState(executionRunId, 'stage_1_active', 'admin');
    await transitionExecutionState(executionRunId, 'stage_2_active', 'admin');
    await transitionExecutionState(executionRunId, 'stage_3_active', 'admin');
    const result = await transitionExecutionState(executionRunId, 'completed', 'admin');
    expect(result.ok).toBe(true);
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('completed');
    expect((run as any).completedAt).toBeTruthy();
  });

  it('should reject invalid transitions', async () => {
    const result = await transitionExecutionState(executionRunId, 'completed', 'admin');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('invalid_state_transition');
  });

  it('should reject transition from not_started to stage_2_active', async () => {
    const result = await transitionExecutionState(executionRunId, 'stage_2_active', 'admin');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('invalid_state_transition');
  });

  it('should reject transition from rolled_back to stage_1_active', async () => {
    await transitionExecutionState(executionRunId, 'preflight_required', 'admin');
    await transitionExecutionState(executionRunId, 'ready', 'admin');
    await transitionExecutionState(executionRunId, 'stage_1_active', 'admin');
    await transitionExecutionState(executionRunId, 'rollback_requested', 'admin');
    await transitionExecutionState(executionRunId, 'rolled_back', 'admin');
    const result = await transitionExecutionState(executionRunId, 'stage_1_active', 'admin');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('invalid_state_transition');
  });

  it('should write audit records on transition', async () => {
    await transitionExecutionState(executionRunId, 'preflight_required', 'admin', 'admin-hash', 'req-123');
    const audits = await task028ExpansionExecutionRepository.listAuditRecords(executionRunId);
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0].action).toContain('state_transition');
    expect(audits[0].actorRole).toBe('admin');
  });

  it('should assert can transition correctly', async () => {
    let check = await assertCanTransition(executionRunId, 'preflight_required');
    expect(check.ok).toBe(true);
    check = await assertCanTransition(executionRunId, 'completed');
    expect(check.ok).toBe(false);
  });

  it('should return false for non-existent run', async () => {
    const result = await transitionExecutionState('nonexistent', 'preflight_required', 'admin');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('execution_run_not_found');
  });
});
