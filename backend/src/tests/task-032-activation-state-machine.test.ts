import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTask032CanaryActivationRecord,
  advanceTask032CanaryActivationState,
  blockTask032CanaryActivation,
  getTask032CanaryActivationRecord,
} from '../services/task032CanaryActivationStateMachineService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

function fullValidPath(): string[] {
  return [
    'dependency_checking',
    'dependency_passed',
    'config_checking',
    'config_passed',
    'cohort_checking',
    'cohort_passed',
    'consent_authorization_checking',
    'consent_authorization_passed',
    'privacy_boundary_checking',
    'privacy_boundary_passed',
    'runtime_guard_checking',
    'runtime_guard_passed',
    'health_budget_checking',
    'health_budget_passed',
    'activation_ready',
    'activated_internal',
  ];
}

describe('Task 032 - Activation State Machine', () => {
  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('should create activation record with created status', async () => {
    const record = await createTask032CanaryActivationRecord({
      schoolId: 'school_task032_safe',
      configuredCohortSize: 25,
    });
    expect(record.status).toBe('created');
    expect(record.schoolId).toBe('school_task032_safe');
    expect(record.configuredCohortSize).toBe(25);
    expect(record.safeToStartTask033).toBe(false);
    expect(record.healthBudgetStatus).toBe('not_run');
    expect(record.privacyBoundaryStatus).toBe('not_run');
    expect(record.reasonCodes).toContain('activation_record_created');
  });

  it('should advance from created to dependency_checking', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    const advanced = await advanceTask032CanaryActivationState(record.activationId, 'dependency_checking');
    expect(advanced.status).toBe('dependency_checking');
    expect(advanced.safeStage).toBe('dependency_checking');
  });

  it('should advance through full valid path to activated_internal', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    let current = record;
    for (const nextStatus of fullValidPath()) {
      current = await advanceTask032CanaryActivationState(current.activationId, nextStatus as any);
      expect(current.status).toBe(nextStatus);
    }
    expect(current.status).toBe('activated_internal');
    expect(current.reasonCodes.length).toBeGreaterThan(1);
  });

  it('should reject invalid transition from created to activated_internal directly', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    await expect(
      advanceTask032CanaryActivationState(record.activationId, 'activated_internal')
    ).rejects.toThrow('Invalid state transition');
  });

  it('should reject invalid transition from blocked to any other state', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    await blockTask032CanaryActivation(record.activationId, ['test_blocker']);
    await expect(
      advanceTask032CanaryActivationState(record.activationId, 'dependency_checking')
    ).rejects.toThrow('Invalid state transition');
  });

  it('should reject transition to blocked from blocked', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    await blockTask032CanaryActivation(record.activationId, ['reason']);
    await expect(
      advanceTask032CanaryActivationState(record.activationId, 'blocked')
    ).rejects.toThrow('Invalid state transition');
  });

  it('should support pause and resume cycle', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    for (const s of fullValidPath()) {
      await advanceTask032CanaryActivationState(record.activationId, s as any);
    }
    expect((await getTask032CanaryActivationRecord(record.activationId))!.status).toBe('activated_internal');

    const paused = await advanceTask032CanaryActivationState(record.activationId, 'paused');
    expect(paused.status).toBe('paused');

    const resumed = await advanceTask032CanaryActivationState(record.activationId, 'activated_internal');
    expect(resumed.status).toBe('activated_internal');
  });

  it('should support kill switch transition', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    for (const s of fullValidPath()) {
      await advanceTask032CanaryActivationState(record.activationId, s as any);
    }
    const ks = await advanceTask032CanaryActivationState(record.activationId, 'kill_switch_enabled');
    expect(ks.status).toBe('kill_switch_enabled');
  });

  it('should support rollback transition', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    for (const s of fullValidPath()) {
      await advanceTask032CanaryActivationState(record.activationId, s as any);
    }
    const rb = await advanceTask032CanaryActivationState(record.activationId, 'rollback_requested');
    expect(rb.status).toBe('rollback_requested');

    const blocked = await advanceTask032CanaryActivationState(record.activationId, 'blocked');
    expect(blocked.status).toBe('blocked');
  });

  it('blockTask032CanaryActivation should set blocked status', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    const blocked = await blockTask032CanaryActivation(record.activationId, ['blocker_1', 'blocker_2']);
    expect(blocked.status).toBe('blocked');
    expect(blocked.blockers).toContain('blocker_1');
    expect(blocked.blockers).toContain('blocker_2');
  });

  it('blocked activation should have safeToStartTask033 false', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    const blocked = await blockTask032CanaryActivation(record.activationId, ['failed_gate']);
    expect(blocked.safeToStartTask033).toBe(false);
  });

  it('getTask032CanaryActivationRecord should return null for nonexistent', async () => {
    const result = await getTask032CanaryActivationRecord('nonexistent_id');
    expect(result).toBeNull();
  });

  it('should throw error when advancing nonexistent record', async () => {
    await expect(
      advanceTask032CanaryActivationState('nonexistent', 'dependency_checking')
    ).rejects.toThrow('Activation record not found');
  });
});
