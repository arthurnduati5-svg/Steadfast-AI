import { describe, it, expect, beforeEach } from 'vitest';
import { runTask032CanaryControlAction } from '../services/task032CanaryControlActionService';
import { createTask032CanaryActivationRecord, advanceTask032CanaryActivationState } from '../services/task032CanaryActivationStateMachineService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

async function createActivatedRecord(): Promise<string> {
  const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
  const path = [
    'dependency_checking', 'dependency_passed', 'config_checking', 'config_passed',
    'cohort_checking', 'cohort_passed', 'consent_authorization_checking', 'consent_authorization_passed',
    'privacy_boundary_checking', 'privacy_boundary_passed', 'runtime_guard_checking', 'runtime_guard_passed',
    'health_budget_checking', 'health_budget_passed', 'activation_ready', 'activated_internal',
  ];
  for (const s of path) {
    await advanceTask032CanaryActivationState(record.activationId, s as any);
  }
  return record.activationId;
}

describe('Task 032 - Control Actions', () => {
  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('should pause then resume canary successfully', async () => {
    const activationId = await createActivatedRecord();

    const pauseResult = await runTask032CanaryControlAction({
      activationId,
      action: 'pause_internal_canary',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(pauseResult.ok).toBe(true);
    expect(pauseResult.action).toBe('pause_internal_canary');
    expect(pauseResult.nextStatus).toBe('paused');

    const resumeResult = await runTask032CanaryControlAction({
      activationId,
      action: 'resume_internal_canary',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(resumeResult.ok).toBe(true);
    expect(resumeResult.nextStatus).toBe('activated_internal');
  });

  it('should enable kill switch', async () => {
    const activationId = await createActivatedRecord();

    const ksResult = await runTask032CanaryControlAction({
      activationId,
      action: 'enable_internal_kill_switch',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(ksResult.ok).toBe(true);
    expect(ksResult.action).toBe('enable_internal_kill_switch');
    expect(ksResult.nextStatus).toBe('kill_switch_enabled');
  });

  it('should disable kill switch', async () => {
    const activationId = await createActivatedRecord();

    await runTask032CanaryControlAction({
      activationId,
      action: 'enable_internal_kill_switch',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });

    const disableResult = await runTask032CanaryControlAction({
      activationId,
      action: 'disable_internal_kill_switch',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(disableResult.ok).toBe(true);
    expect(disableResult.nextStatus).toBe('paused');
  });

  it('should request rollback', async () => {
    const activationId = await createActivatedRecord();

    const rbResult = await runTask032CanaryControlAction({
      activationId,
      action: 'request_internal_rollback',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(rbResult.ok).toBe(true);
    expect(rbResult.nextStatus).toBe('rollback_requested');
  });

  it('should reject route_live_traffic forbidden action', async () => {
    const result = await runTask032CanaryControlAction({
      activationId: 'act_001',
      action: 'route_live_traffic' as any,
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('forbidden_control_action: route_live_traffic');
  });

  it('should reject send_live_notice forbidden action', async () => {
    const result = await runTask032CanaryControlAction({
      activationId: 'act_001',
      action: 'send_live_notice' as any,
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('forbidden_control_action: send_live_notice');
  });

  it('should reject expand_to_rollout forbidden action', async () => {
    const result = await runTask032CanaryControlAction({
      activationId: 'act_001',
      action: 'expand_to_rollout' as any,
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
  });

  it('should reject school_wide_enable forbidden action', async () => {
    const result = await runTask032CanaryControlAction({
      activationId: 'act_001',
      action: 'school_wide_enable' as any,
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
  });

  it('should reject observe_canary forbidden action', async () => {
    const result = await runTask032CanaryControlAction({
      activationId: 'act_001',
      action: 'observe_canary' as any,
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
  });

  it('should reject deploy_canary forbidden action', async () => {
    const result = await runTask032CanaryControlAction({
      activationId: 'act_001',
      action: 'deploy_canary' as any,
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
  });

  it('should return blocking issues when activation not found', async () => {
    const result = await runTask032CanaryControlAction({
      activationId: 'nonexistent_activation',
      action: 'pause_internal_canary',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('activation_record_not_found');
  });

  it('should reject unknown control action', async () => {
    const activationId = await createActivatedRecord();
    const result = await runTask032CanaryControlAction({
      activationId,
      action: 'invalid_action' as any,
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('unknown_control_action: invalid_action');
  });
});
