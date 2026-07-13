import { describe, it, expect } from 'vitest';
import {
  TASK036_VALID_STATE_TRANSITIONS,
  isTask036ValidStateTransition,
  Task036LaunchStatus,
} from '../contracts/task036LiveSchoolLaunchContracts';

function createStateMachine() {
  return {
    currentState: 'created' as Task036LaunchStatus,
    transitions: TASK036_VALID_STATE_TRANSITIONS,
    transition(to: Task036LaunchStatus): { ok: boolean; error?: string } {
      if (!isTask036ValidStateTransition(this.currentState, to)) {
        return { ok: false, error: `Cannot transition from ${this.currentState} to ${to}` };
      }
      this.currentState = to;
      return { ok: true };
    },
    canTransition(to: Task036LaunchStatus): boolean {
      return isTask036ValidStateTransition(this.currentState, to);
    },
  };
}

describe('Task036 State Machine', () => {
  it('starts in created state', () => {
    const sm = createStateMachine();
    expect(sm.currentState).toBe('created');
  });

  it('transitions from created to dependency_checking', () => {
    const sm = createStateMachine();
    const result = sm.transition('dependency_checking');
    expect(result.ok).toBe(true);
    expect(sm.currentState).toBe('dependency_checking');
  });

  it('blocks invalid transition from created to launch_ready', () => {
    const sm = createStateMachine();
    const result = sm.transition('launch_ready');
    expect(result.ok).toBe(false);
    expect(sm.currentState).toBe('created');
  });

  it('follows full happy path to launch_ready', () => {
    const sm = createStateMachine();
    const path: Task036LaunchStatus[] = [
      'dependency_checking', 'dependency_passed',
      'environment_checking', 'environment_passed',
      'launch_window_checking', 'launch_window_passed',
      'approval_checking', 'approval_passed',
      'single_school_scope_checking', 'single_school_scope_passed',
      'runtime_guard_checking', 'runtime_guard_passed',
      'health_budget_checking', 'health_budget_passed',
      'privacy_boundary_checking', 'privacy_boundary_passed',
      'content_governance_checking', 'content_governance_passed',
      'socratic_integrity_checking', 'socratic_integrity_passed',
      'deen_boundary_checking', 'deen_boundary_passed',
      'school_identity_checking', 'school_identity_passed',
      'incident_readiness_checking', 'incident_readiness_passed',
      'rollback_readiness_checking', 'rollback_readiness_passed',
      'launch_ready',
    ];
    for (const step of path) {
      const result = sm.transition(step);
      expect(result.ok).toBe(true);
    }
    expect(sm.currentState).toBe('launch_ready');
  });

  it('transitions from launch_ready to launch_active_controlled', () => {
    const sm = createStateMachine();
    sm.transition('dependency_checking'); sm.transition('dependency_passed');
    sm.transition('environment_checking'); sm.transition('environment_passed');
    sm.transition('launch_window_checking'); sm.transition('launch_window_passed');
    sm.transition('approval_checking'); sm.transition('approval_passed');
    sm.transition('single_school_scope_checking'); sm.transition('single_school_scope_passed');
    sm.transition('runtime_guard_checking'); sm.transition('runtime_guard_passed');
    sm.transition('health_budget_checking'); sm.transition('health_budget_passed');
    sm.transition('privacy_boundary_checking'); sm.transition('privacy_boundary_passed');
    sm.transition('content_governance_checking'); sm.transition('content_governance_passed');
    sm.transition('socratic_integrity_checking'); sm.transition('socratic_integrity_passed');
    sm.transition('deen_boundary_checking'); sm.transition('deen_boundary_passed');
    sm.transition('school_identity_checking'); sm.transition('school_identity_passed');
    sm.transition('incident_readiness_checking'); sm.transition('incident_readiness_passed');
    sm.transition('rollback_readiness_checking'); sm.transition('rollback_readiness_passed');
    sm.transition('launch_ready');
    const result = sm.transition('launch_active_controlled');
    expect(result.ok).toBe(true);
    expect(sm.currentState).toBe('launch_active_controlled');
  });

  it('transitions from launch_active_controlled to launch_paused', () => {
    const sm = createStateMachine();
    sm.currentState = 'launch_active_controlled';
    const result = sm.transition('launch_paused');
    expect(result.ok).toBe(true);
  });

  it('transitions from launch_active_controlled to kill_switch_enabled', () => {
    const sm = createStateMachine();
    sm.currentState = 'launch_active_controlled';
    const result = sm.transition('kill_switch_enabled');
    expect(result.ok).toBe(true);
  });

  it('blocks transition from launch_complete to any state', () => {
    const sm = createStateMachine();
    sm.currentState = 'launch_complete';
    expect(sm.canTransition('launch_paused')).toBe(false);
    expect(sm.canTransition('blocked')).toBe(false);
  });

  it('any state can transition to blocked', () => {
    const sm = createStateMachine();
    sm.currentState = 'created';
    expect(sm.canTransition('blocked')).toBe(true);
    sm.currentState = 'launch_window_checking';
    expect(sm.canTransition('blocked')).toBe(true);
    sm.currentState = 'launch_active_controlled';
    expect(sm.canTransition('blocked')).toBe(false);
  });

  it('canTransition returns false for unknown states', () => {
    const sm = createStateMachine();
    expect(sm.canTransition('nonexistent' as any)).toBe(false);
  });

  it('transition to blocked works from any checking state', () => {
    const checkingStates: Task036LaunchStatus[] = [
      'dependency_checking', 'environment_checking',
      'launch_window_checking', 'approval_checking',
      'single_school_scope_checking', 'runtime_guard_checking',
      'health_budget_checking', 'privacy_boundary_checking',
      'content_governance_checking', 'socratic_integrity_checking',
      'deen_boundary_checking', 'school_identity_checking',
      'incident_readiness_checking', 'rollback_readiness_checking',
    ];
    for (const state of checkingStates) {
      const sm = createStateMachine();
      sm.currentState = state;
      expect(sm.canTransition('blocked')).toBe(true);
    }
  });
});
