import { describe, it, expect, beforeEach } from 'vitest';
import { executeTask034RolloutCommand } from '../services/task034ControlledRolloutCommandService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';
import { createTask034RolloutSession, transitionTask034RolloutStatus } from '../services/task034ControlledRolloutStateMachineService';

async function createActiveSession(sessionId: string) {
  let session = await createTask034RolloutSession({
    sessionId, activationId: 'act_1', schoolId: 'sch_1',
    tenantId: 't1', cohortId: 'coh_1', actorRole: 'school_admin',
  });
  const path = ['dependency_checking', 'dependency_passed', 'environment_checking',
    'environment_passed', 'config_checking', 'config_passed', 'cap_checking',
    'cap_passed', 'cohort_checking', 'cohort_passed', 'staff_readiness_checking',
    'staff_readiness_passed', 'learner_notice_checking', 'learner_notice_passed',
    'runtime_guard_checking', 'runtime_guard_passed', 'health_budget_checking',
    'health_budget_passed', 'privacy_review_checking', 'privacy_review_passed',
    'governance_review_checking', 'governance_review_passed', 'socratic_review_checking',
    'socratic_review_passed', 'deen_review_checking', 'deen_review_passed',
    'school_identity_checking', 'school_identity_passed', 'rollback_protection_checking',
    'rollback_protection_passed', 'limited_rollout_ready',
    'limited_rollout_active_internal',
  ] as const;
  for (const status of path) {
    session = await transitionTask034RolloutStatus(session, status);
  }
  return session;
}

describe('Task034 Controlled Rollout Command', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('pause command pauses an active rollout', async () => {
    await createActiveSession('rs_cmd1');
    const result = await executeTask034RolloutCommand('pause', 'rs_cmd1');
    expect(result.ok).toBe(true);
    expect(result.message).toBe('Rollout paused');
    const session = await task034Repository.getRolloutSession('rs_cmd1');
    expect(session!.status).toBe('limited_rollout_paused');
  });

  it('resume command resumes a paused rollout', async () => {
    await createActiveSession('rs_cmd2');
    await executeTask034RolloutCommand('pause', 'rs_cmd2');
    const result = await executeTask034RolloutCommand('resume', 'rs_cmd2');
    expect(result.ok).toBe(true);
    expect(result.message).toBe('Rollout resumed');
    const session = await task034Repository.getRolloutSession('rs_cmd2');
    expect(session!.status).toBe('limited_rollout_active_internal');
  });

  it('kill_switch command enables kill switch on active', async () => {
    await createActiveSession('rs_cmd3');
    const result = await executeTask034RolloutCommand('kill_switch', 'rs_cmd3');
    expect(result.ok).toBe(true);
    expect(result.message).toBe('Kill switch enabled');
    const session = await task034Repository.getRolloutSession('rs_cmd3');
    expect(session!.status).toBe('kill_switch_enabled');
  });

  it('kill_switch command works from paused state', async () => {
    await createActiveSession('rs_cmd4');
    await executeTask034RolloutCommand('pause', 'rs_cmd4');
    const result = await executeTask034RolloutCommand('kill_switch', 'rs_cmd4');
    expect(result.ok).toBe(true);
  });

  it('rollback command requests rollback on active', async () => {
    await createActiveSession('rs_cmd5');
    const result = await executeTask034RolloutCommand('rollback', 'rs_cmd5');
    expect(result.ok).toBe(true);
    expect(result.message).toBe('Rollback requested');
    const session = await task034Repository.getRolloutSession('rs_cmd5');
    expect(session!.status).toBe('rollback_requested');
  });

  it('rollback command works from paused state', async () => {
    await createActiveSession('rs_cmd6');
    await executeTask034RolloutCommand('pause', 'rs_cmd6');
    const result = await executeTask034RolloutCommand('rollback', 'rs_cmd6');
    expect(result.ok).toBe(true);
  });

  it('pause fails from non-active status', async () => {
    const session = await createTask034RolloutSession({
      sessionId: 'rs_cmd7', activationId: 'a1', schoolId: 's1',
      tenantId: 't1', cohortId: 'c1', actorRole: 'school_admin',
    });
    const result = await executeTask034RolloutCommand('pause', 'rs_cmd7');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Cannot pause');
  });

  it('resume fails from non-paused status', async () => {
    await createActiveSession('rs_cmd8');
    const result = await executeTask034RolloutCommand('resume', 'rs_cmd8');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Cannot resume');
  });

  it('unknown command returns error', async () => {
    await createActiveSession('rs_cmd_unknown');
    const result = await executeTask034RolloutCommand('nonexistent_command', 'rs_cmd_unknown');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Unknown command');
  });

  it('non-existent session returns not found error', async () => {
    const result = await executeTask034RolloutCommand('pause', 'non_existent');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Session not found');
  });
});
