import { describe, it, expect } from 'vitest';
import {
  TASK036_ALLOWED_ENVIRONMENT_TYPES,
  TASK036_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK036_ALLOWED_LAUNCH_MODES,
  TASK036_FORBIDDEN_LAUNCH_MODES,
  TASK036_ALLOWED_ACTOR_ROLES,
  TASK036_DENIED_ACTOR_ROLES,
  TASK036_REQUIRED_DEPENDENCY_COMMITS,
  TASK036_REQUIRED_STAGE_IDS,
  TASK036_VALID_STATE_TRANSITIONS,
  TASK036_FORBIDDEN_OUTPUT_FIELDS,
  TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS,
  REQUIRED_APPROVAL_ROLES,
  resolveTask036ActorRole,
  isTask036LaunchOperatorRole,
  isTask036DeniedRole,
  createTask036SafeId,
  createTask036SafeTimestamp,
  getTask036RequiredStageIds,
  isTask036ValidStateTransition,
  calculateTask036FinalLaunchDecision,
  calculateTask036SafeToStartTask040,
} from '../contracts/task036LiveSchoolLaunchContracts';

describe('Task036 Contracts - Environment Types', () => {
  it('allowed environment types excludes production', () => {
    expect(TASK036_ALLOWED_ENVIRONMENT_TYPES).not.toContain('production');
    expect(TASK036_ALLOWED_ENVIRONMENT_TYPES).toContain('controlled_live_school_launch');
    expect(TASK036_ALLOWED_ENVIRONMENT_TYPES).toContain('development');
    expect(TASK036_ALLOWED_ENVIRONMENT_TYPES).toContain('test');
    expect(TASK036_ALLOWED_ENVIRONMENT_TYPES).toContain('staging');
  });

  it('forbidden environment types includes production', () => {
    expect(TASK036_FORBIDDEN_ENVIRONMENT_TYPES).toContain('production');
    expect(TASK036_FORBIDDEN_ENVIRONMENT_TYPES.length).toBe(1);
  });
});

describe('Task036 Contracts - Launch Modes', () => {
  it('allowed launch modes only permits single_school_controlled_live_launch', () => {
    expect(TASK036_ALLOWED_LAUNCH_MODES).toContain('single_school_controlled_live_launch');
    expect(TASK036_ALLOWED_LAUNCH_MODES.length).toBe(1);
  });

  it('forbidden launch modes contains all other modes', () => {
    expect(TASK036_FORBIDDEN_LAUNCH_MODES).toContain('pilot_execution');
    expect(TASK036_FORBIDDEN_LAUNCH_MODES).toContain('canary_activation');
    expect(TASK036_FORBIDDEN_LAUNCH_MODES).toContain('limited_rollout');
    expect(TASK036_FORBIDDEN_LAUNCH_MODES).toContain('school_wide_readiness');
  });
});

describe('Task036 Contracts - Actor Roles', () => {
  it('allowed actor roles includes operational roles', () => {
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('school_admin');
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('internal_operator');
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('technical_operator');
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('privacy_owner');
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('safeguarding_owner');
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('content_governance_owner');
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('deen_review_owner');
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('rollback_owner');
    expect(TASK036_ALLOWED_ACTOR_ROLES).toContain('support_owner');
    expect(TASK036_ALLOWED_ACTOR_ROLES.length).toBe(9);
  });

  it('denied actor roles includes student teacher parent unknown', () => {
    expect(TASK036_DENIED_ACTOR_ROLES).toContain('student');
    expect(TASK036_DENIED_ACTOR_ROLES).toContain('teacher');
    expect(TASK036_DENIED_ACTOR_ROLES).toContain('parent');
    expect(TASK036_DENIED_ACTOR_ROLES).toContain('unknown');
    expect(TASK036_DENIED_ACTOR_ROLES.length).toBe(4);
  });
});

describe('Task036 Contracts - Required Dependencies & Stages', () => {
  it('REQUIRED_DEPENDENCY_COMMITS has at least one commit hash', () => {
    expect(TASK036_REQUIRED_DEPENDENCY_COMMITS.length).toBeGreaterThan(0);
    expect(TASK036_REQUIRED_DEPENDENCY_COMMITS[0]).toMatch(/^[a-f0-9]{40}$/);
  });

  it('REQUIRED_STAGE_IDS contains task035 stages', () => {
    expect(TASK036_REQUIRED_STAGE_IDS).toContain('task035_accepted');
    expect(TASK036_REQUIRED_STAGE_IDS).toContain('task035_safeToStartTask036_true');
    expect(TASK036_REQUIRED_STAGE_IDS).toContain('task035_no_task036_implementation');
    expect(TASK036_REQUIRED_STAGE_IDS).toContain('task035_no_task040_implementation');
    expect(TASK036_REQUIRED_STAGE_IDS).toContain('task035_no_frontend_ui');
    expect(TASK036_REQUIRED_STAGE_IDS).toContain('task035_no_live_launch');
  });
});

describe('Task036 Contracts - State Transitions', () => {
  it('created can transition to dependency_checking or blocked', () => {
    expect(TASK036_VALID_STATE_TRANSITIONS.created).toContain('dependency_checking');
    expect(TASK036_VALID_STATE_TRANSITIONS.created).toContain('blocked');
    expect(TASK036_VALID_STATE_TRANSITIONS.created.length).toBe(2);
  });

  it('launch_ready can transition to launch_active_controlled or blocked', () => {
    expect(TASK036_VALID_STATE_TRANSITIONS.launch_ready).toContain('launch_active_controlled');
    expect(TASK036_VALID_STATE_TRANSITIONS.launch_ready).toContain('blocked');
  });

  it('blocked has no outgoing transitions', () => {
    expect(TASK036_VALID_STATE_TRANSITIONS.blocked).toEqual([]);
  });

  it('launch_complete has no outgoing transitions', () => {
    expect(TASK036_VALID_STATE_TRANSITIONS.launch_complete).toEqual([]);
  });

  it('all states in transitions map are valid Task036LaunchStatus values', () => {
    const states = Object.keys(TASK036_VALID_STATE_TRANSITIONS);
    expect(states).toContain('created');
    expect(states).toContain('launch_active_controlled');
    expect(states).toContain('launch_paused');
    expect(states).toContain('rollback_requested');
    expect(states).toContain('kill_switch_enabled');
    expect(states).toContain('launch_complete');
    expect(states).toContain('blocked');
    expect(states.length).toBeGreaterThanOrEqual(20);
  });
});

describe('Task036 Contracts - Forbidden Output Fields', () => {
  it('forbids raw learner data fields', () => {
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawLearnerData');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawChat');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawAnswer');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('parentContact');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('teacherPrivateNote');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('hiddenReasoning');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('markingScheme');
    expect(TASK036_FORBIDDEN_OUTPUT_FIELDS).toContain('rawSafeguardingNote');
  });
});

describe('Task036 Contracts - Forbidden Side Effect Patterns', () => {
  it('forbids external AI provider calls', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('openai');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('anthropic');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('gemini');
  });

  it('forbids destructive database operations', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('DROP TABLE');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('DELETE FROM');
  });
});

describe('Task036 Contracts - Forbidden Future Task Patterns', () => {
  it('forbids references to task040 and backend freeze', () => {
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('public SaaS');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('multi-school rollout');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('marketing launch');
  });
});

describe('Task036 Contracts - Required Approval Roles', () => {
  it('matches all allowed actor roles', () => {
    expect(REQUIRED_APPROVAL_ROLES).toEqual(TASK036_ALLOWED_ACTOR_ROLES);
    expect(REQUIRED_APPROVAL_ROLES.length).toBe(9);
  });
});

describe('Task036 Contracts - Helper Functions', () => {
  it('resolveTask036ActorRole normalizes role strings', () => {
    expect(resolveTask036ActorRole('school_admin')).toBe('school_admin');
    expect(resolveTask036ActorRole('School Admin')).toBe('school_admin');
    expect(resolveTask036ActorRole('School-Admin')).toBe('school_admin');
    expect(resolveTask036ActorRole('INTERNAL_OPERATOR')).toBe('internal_operator');
    expect(resolveTask036ActorRole('unknown_role_here')).toBe('unknown');
  });

  it('isTask036LaunchOperatorRole returns true for allowed roles', () => {
    expect(isTask036LaunchOperatorRole('school_admin')).toBe(true);
    expect(isTask036LaunchOperatorRole('internal_operator')).toBe(true);
    expect(isTask036LaunchOperatorRole('student')).toBe(false);
    expect(isTask036LaunchOperatorRole('parent')).toBe(false);
  });

  it('isTask036DeniedRole returns true for denied roles', () => {
    expect(isTask036DeniedRole('student')).toBe(true);
    expect(isTask036DeniedRole('teacher')).toBe(true);
    expect(isTask036DeniedRole('parent')).toBe(true);
    expect(isTask036DeniedRole('unknown')).toBe(true);
    expect(isTask036DeniedRole('school_admin')).toBe(false);
    expect(isTask036DeniedRole('technical_operator')).toBe(false);
  });

  it('createTask036SafeId produces unique IDs with correct prefix', () => {
    const id1 = createTask036SafeId();
    const id2 = createTask036SafeId();
    expect(id1).toMatch(/^task036_/);
    expect(id1).not.toBe(id2);
    expect(id2).toMatch(/^task036_/);
  });

  it('createTask036SafeTimestamp returns valid ISO string', () => {
    const ts = createTask036SafeTimestamp();
    expect(() => new Date(ts)).not.toThrow();
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('getTask036RequiredStageIds returns a copy of required stage IDs', () => {
    const ids = getTask036RequiredStageIds();
    expect(ids).toEqual(TASK036_REQUIRED_STAGE_IDS);
    ids.push('extra');
    expect(ids.length).toBe(TASK036_REQUIRED_STAGE_IDS.length + 1);
  });

  it('isTask036ValidStateTransition returns true for valid transitions', () => {
    expect(isTask036ValidStateTransition('created', 'dependency_checking')).toBe(true);
    expect(isTask036ValidStateTransition('dependency_passed', 'environment_checking')).toBe(true);
    expect(isTask036ValidStateTransition('launch_ready', 'launch_active_controlled')).toBe(true);
  });

  it('isTask036ValidStateTransition returns false for invalid transitions', () => {
    expect(isTask036ValidStateTransition('created', 'launch_ready')).toBe(false);
    expect(isTask036ValidStateTransition('blocked', 'created')).toBe(false);
    expect(isTask036ValidStateTransition('launch_complete', 'launch_paused')).toBe(false);
  });

  it('isTask036ValidStateTransition returns false for unknown state', () => {
    expect(isTask036ValidStateTransition('unknown_state' as any, 'created')).toBe(false);
  });

  it('calculateTask036FinalLaunchDecision returns pass when all gates pass', () => {
    const gates: Record<string, boolean> = {
      dependencyProofPassed: true,
      environmentGatePassed: true,
      launchWindowPassed: true,
      launchApprovalPassed: true,
      singleSchoolScopePassed: true,
      privacyBoundaryPassed: true,
      contentGovernancePassed: true,
      socraticIntegrityPassed: true,
      deenBoundaryPassed: true,
      schoolIdentityPassed: true,
      crossSchoolDenialPassed: true,
      runtimeMonitoringPassed: true,
      healthBudgetPassed: true,
      incidentReadinessPassed: true,
    };
    const decision = calculateTask036FinalLaunchDecision(gates);
    expect(decision.safeToStartTask040).toBe(true);
    expect(decision.finalDecision).toBe('TASK_036_PASS_SAFE_TO_START_TASK_040');
    expect(decision.allGatesPassed).toBe(true);
    expect(decision.remainingBlockers).toEqual([]);
  });

  it('calculateTask036FinalLaunchDecision returns blocked when any gate fails', () => {
    const gates: Record<string, boolean> = {
      dependencyProofPassed: true,
      environmentGatePassed: false,
      launchWindowPassed: true,
      privacyBoundaryPassed: true,
      contentGovernancePassed: false,
    };
    const decision = calculateTask036FinalLaunchDecision(gates);
    expect(decision.safeToStartTask040).toBe(false);
    expect(decision.finalDecision).toBe('TASK_036_BLOCKED');
    expect(decision.allGatesPassed).toBe(false);
    expect(decision.remainingBlockers.length).toBeGreaterThan(0);
    expect(decision.remainingBlockers).toContain('environmentGatePassed');
    expect(decision.remainingBlockers).toContain('contentGovernancePassed');
  });

  it('calculateTask036SafeToStartTask040 returns true only when all gates pass', () => {
    expect(calculateTask036SafeToStartTask040({ gate1: true, gate2: true })).toBe(true);
    expect(calculateTask036SafeToStartTask040({ gate1: true, gate2: false })).toBe(false);
    expect(calculateTask036SafeToStartTask040({})).toBe(true);
  });

  it('calculateTask036FinalLaunchDecision defaults missing gates to false', () => {
    const decision = calculateTask036FinalLaunchDecision({});
    expect(decision.dependencyProofPassed).toBe(false);
    expect(decision.environmentGatePassed).toBe(false);
    expect(decision.launchWindowPassed).toBe(false);
    expect(decision.safeToStartTask040).toBe(false);
    expect(decision.finalDecision).toBe('TASK_036_BLOCKED');
  });
});
