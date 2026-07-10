import { describe, it, expect, beforeEach } from 'vitest';
import { createTask034RolloutSession, transitionTask034RolloutStatus, listValidTransitions, isValidTransition } from '../services/task034ControlledRolloutStateMachineService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';
import type { Task034RolloutStatus } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('Task034 Controlled Rollout State Machine', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('createTask034RolloutSession creates with created status', async () => {
    const session = await createTask034RolloutSession({
      sessionId: 'rs_1', activationId: 'act_1', schoolId: 'sch_1',
      tenantId: 't1', cohortId: 'coh_1', actorRole: 'school_admin',
    });
    expect(session.status).toBe('created');
    expect(session.rolloutStage).toBe('created');
    expect(session.sessionId).toBe('rs_1');
  });

  it('Denied actor role student is rejected', async () => {
    const session = await createTask034RolloutSession({
      sessionId: 'rs_blocked', activationId: 'act_1', schoolId: 'sch_1',
      tenantId: 't1', cohortId: 'coh_1', actorRole: 'student',
    });
    expect(session.blockingIssues).toContain('denied_actor_role: student');
  });

  it('transitionTask034RolloutStatus follows valid path created -> dependency_checking', async () => {
    const session = await createTask034RolloutSession({
      sessionId: 'rs_2', activationId: 'act_1', schoolId: 'sch_1',
      tenantId: 't1', cohortId: 'coh_1', actorRole: 'school_admin',
    });
    const next = await transitionTask034RolloutStatus(session, 'dependency_checking');
    expect(next.status).toBe('dependency_checking');
  });

  it('Invalid transitions set status to blocked', async () => {
    const session = await createTask034RolloutSession({
      sessionId: 'rs_3', activationId: 'act_1', schoolId: 'sch_1',
      tenantId: 't1', cohortId: 'coh_1', actorRole: 'school_admin',
    });
    const result = await transitionTask034RolloutStatus(session, 'limited_rollout_complete');
    expect(result.status).toBe('blocked');
    expect(result.blockingIssues.some(i => i.includes('invalid_transition'))).toBe(true);
  });

  it('Full happy path through all checking states', async () => {
    let session = await createTask034RolloutSession({
      sessionId: 'rs_happy', activationId: 'act_1', schoolId: 'sch_1',
      tenantId: 't1', cohortId: 'coh_1', actorRole: 'school_admin',
    });
    const path: Array<{ from: Task034RolloutStatus; to: Task034RolloutStatus }> = [
      { from: 'created', to: 'dependency_checking' },
      { from: 'dependency_checking', to: 'dependency_passed' },
      { from: 'dependency_passed', to: 'environment_checking' },
      { from: 'environment_checking', to: 'environment_passed' },
      { from: 'environment_passed', to: 'config_checking' },
      { from: 'config_checking', to: 'config_passed' },
      { from: 'config_passed', to: 'cap_checking' },
      { from: 'cap_checking', to: 'cap_passed' },
      { from: 'cap_passed', to: 'cohort_checking' },
      { from: 'cohort_checking', to: 'cohort_passed' },
      { from: 'cohort_passed', to: 'staff_readiness_checking' },
      { from: 'staff_readiness_checking', to: 'staff_readiness_passed' },
      { from: 'staff_readiness_passed', to: 'learner_notice_checking' },
      { from: 'learner_notice_checking', to: 'learner_notice_passed' },
      { from: 'learner_notice_passed', to: 'runtime_guard_checking' },
      { from: 'runtime_guard_checking', to: 'runtime_guard_passed' },
      { from: 'runtime_guard_passed', to: 'health_budget_checking' },
      { from: 'health_budget_checking', to: 'health_budget_passed' },
      { from: 'health_budget_passed', to: 'privacy_review_checking' },
      { from: 'privacy_review_checking', to: 'privacy_review_passed' },
      { from: 'privacy_review_passed', to: 'governance_review_checking' },
      { from: 'governance_review_checking', to: 'governance_review_passed' },
      { from: 'governance_review_passed', to: 'socratic_review_checking' },
      { from: 'socratic_review_checking', to: 'socratic_review_passed' },
      { from: 'socratic_review_passed', to: 'deen_review_checking' },
      { from: 'deen_review_checking', to: 'deen_review_passed' },
      { from: 'deen_review_passed', to: 'school_identity_checking' },
      { from: 'school_identity_checking', to: 'school_identity_passed' },
      { from: 'school_identity_passed', to: 'rollback_protection_checking' },
      { from: 'rollback_protection_checking', to: 'rollback_protection_passed' },
    ];
    for (const step of path) {
      expect(isValidTransition(step.from, step.to)).toBe(true);
      session = await transitionTask034RolloutStatus(session, step.to);
      expect(session.status).toBe(step.to);
    }
  });

  it('Active internal can pause and resume', async () => {
    let session = await createTask034RolloutSession({
      sessionId: 'rs_pause', activationId: 'a1', schoolId: 's1',
      tenantId: 't1', cohortId: 'c1', actorRole: 'school_admin',
    });
    session = await transitionTask034RolloutStatus(session, 'dependency_checking');
    session = await transitionTask034RolloutStatus(session, 'dependency_passed');
    session = await transitionTask034RolloutStatus(session, 'environment_checking');
    session = await transitionTask034RolloutStatus(session, 'environment_passed');
    session = await transitionTask034RolloutStatus(session, 'config_checking');
    session = await transitionTask034RolloutStatus(session, 'config_passed');
    session = await transitionTask034RolloutStatus(session, 'cap_checking');
    session = await transitionTask034RolloutStatus(session, 'cap_passed');
    session = await transitionTask034RolloutStatus(session, 'cohort_checking');
    session = await transitionTask034RolloutStatus(session, 'cohort_passed');
    session = await transitionTask034RolloutStatus(session, 'staff_readiness_checking');
    session = await transitionTask034RolloutStatus(session, 'staff_readiness_passed');
    session = await transitionTask034RolloutStatus(session, 'learner_notice_checking');
    session = await transitionTask034RolloutStatus(session, 'learner_notice_passed');
    session = await transitionTask034RolloutStatus(session, 'runtime_guard_checking');
    session = await transitionTask034RolloutStatus(session, 'runtime_guard_passed');
    session = await transitionTask034RolloutStatus(session, 'health_budget_checking');
    session = await transitionTask034RolloutStatus(session, 'health_budget_passed');
    session = await transitionTask034RolloutStatus(session, 'privacy_review_checking');
    session = await transitionTask034RolloutStatus(session, 'privacy_review_passed');
    session = await transitionTask034RolloutStatus(session, 'governance_review_checking');
    session = await transitionTask034RolloutStatus(session, 'governance_review_passed');
    session = await transitionTask034RolloutStatus(session, 'socratic_review_checking');
    session = await transitionTask034RolloutStatus(session, 'socratic_review_passed');
    session = await transitionTask034RolloutStatus(session, 'deen_review_checking');
    session = await transitionTask034RolloutStatus(session, 'deen_review_passed');
    session = await transitionTask034RolloutStatus(session, 'school_identity_checking');
    session = await transitionTask034RolloutStatus(session, 'school_identity_passed');
    session = await transitionTask034RolloutStatus(session, 'rollback_protection_checking');
    session = await transitionTask034RolloutStatus(session, 'rollback_protection_passed');
    session = await transitionTask034RolloutStatus(session, 'limited_rollout_ready');
    session = await transitionTask034RolloutStatus(session, 'limited_rollout_active_internal');
    session = await transitionTask034RolloutStatus(session, 'limited_rollout_paused');
    expect(session.status).toBe('limited_rollout_paused');
    const back = await transitionTask034RolloutStatus(session, 'limited_rollout_active_internal');
    expect(back.status).toBe('limited_rollout_active_internal');
  });

  it('blocked cannot transition to active states', async () => {
    const session = await createTask034RolloutSession({
      sessionId: 'rs_blocked2', activationId: 'a1', schoolId: 's1',
      tenantId: 't1', cohortId: 'c1', actorRole: 'school_admin',
    });
    const blocked = await transitionTask034RolloutStatus(session, 'blocked');
    expect(blocked.status).toBe('blocked');
    const still = await transitionTask034RolloutStatus(blocked, 'limited_rollout_active_internal');
    expect(still.status).toBe('blocked');
  });

  it('listValidTransitions returns valid next states', () => {
    const transitions = listValidTransitions('created');
    expect(transitions).toContain('dependency_checking');
    expect(transitions).not.toContain('blocked');
  });

  it('isValidTransition returns false for terminal states', () => {
    expect(isValidTransition('limited_rollout_complete', 'created')).toBe(false);
    expect(isValidTransition('blocked', 'created')).toBe(false);
  });
});
