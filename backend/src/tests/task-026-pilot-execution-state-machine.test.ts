import { describe, it, expect, beforeEach } from 'vitest';
import { transitionExecutionState, assertCanTransition } from '../services/task026PilotExecutionStateMachine';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 Pilot Execution State Machine', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK026_REQUIRE_REAL_PRISMA;
    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test-1',
      schoolId: 'school-1',
      status: 'not_started',
      safeSummary: 'Test execution run',
    });
    executionRunId = (run as any).id;
  });

  it('should transition from not_started to starting', async () => {
    const result = await transitionExecutionState(executionRunId, 'starting', 'admin', 'admin-hash');
    expect(result.ok).toBe(true);
    const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('starting');
  });

  it('should transition from starting to active', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin', 'admin-hash');
    const result = await transitionExecutionState(executionRunId, 'active', 'admin', 'admin-hash');
    expect(result.ok).toBe(true);
    const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('active');
  });

  it('should transition from active to paused', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin');
    await transitionExecutionState(executionRunId, 'active', 'admin');
    const result = await transitionExecutionState(executionRunId, 'paused', 'admin');
    expect(result.ok).toBe(true);
    const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('paused');
    expect((run as any).pausedAt).toBeTruthy();
  });

  it('should transition from paused to resuming', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin');
    await transitionExecutionState(executionRunId, 'active', 'admin');
    await transitionExecutionState(executionRunId, 'paused', 'admin');
    const result = await transitionExecutionState(executionRunId, 'resuming', 'admin');
    expect(result.ok).toBe(true);
  });

  it('should transition from resuming to active', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin');
    await transitionExecutionState(executionRunId, 'active', 'admin');
    await transitionExecutionState(executionRunId, 'paused', 'admin');
    await transitionExecutionState(executionRunId, 'resuming', 'admin');
    const result = await transitionExecutionState(executionRunId, 'active', 'admin');
    expect(result.ok).toBe(true);
    const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('active');
  });

  it('should transition from active to rollback_requested', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin');
    await transitionExecutionState(executionRunId, 'active', 'admin');
    const result = await transitionExecutionState(executionRunId, 'rollback_requested', 'admin');
    expect(result.ok).toBe(true);
  });

  it('should transition from rollback_requested to rolled_back', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin');
    await transitionExecutionState(executionRunId, 'active', 'admin');
    await transitionExecutionState(executionRunId, 'rollback_requested', 'admin');
    const result = await transitionExecutionState(executionRunId, 'rolled_back', 'admin');
    expect(result.ok).toBe(true);
    const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('rolled_back');
    expect((run as any).rolledBackAt).toBeTruthy();
  });

  it('should reject invalid transitions', async () => {
    const result = await transitionExecutionState(executionRunId, 'completed', 'admin');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('invalid_state_transition');
  });

  it('should write audit records on transitions', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin', 'admin-hash', 'req-1');
    const audits = await task026PilotExecutionRepository.listAuditRecords(executionRunId);
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0].action).toContain('state_transition');
  });

  it('should assert can transition correctly', async () => {
    let check = await assertCanTransition(executionRunId, 'starting');
    expect(check.ok).toBe(true);

    check = await assertCanTransition(executionRunId, 'completed');
    expect(check.ok).toBe(false);
  });

  it('should transition from active to completed', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin');
    await transitionExecutionState(executionRunId, 'active', 'admin');
    const result = await transitionExecutionState(executionRunId, 'completed', 'admin');
    expect(result.ok).toBe(true);
    const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('completed');
    expect((run as any).completedAt).toBeTruthy();
  });

  it('should transition to blocked from any state', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin');
    await transitionExecutionState(executionRunId, 'active', 'admin');
    const result = await transitionExecutionState(executionRunId, 'blocked', 'admin');
    expect(result.ok).toBe(true);
  });

  it('should transition to failed from any state', async () => {
    await transitionExecutionState(executionRunId, 'starting', 'admin');
    await transitionExecutionState(executionRunId, 'active', 'admin');
    const result = await transitionExecutionState(executionRunId, 'failed', 'admin');
    expect(result.ok).toBe(true);
  });
});
