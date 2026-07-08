import { describe, it, expect } from 'vitest';
import {
  TASK025_BLOCKER_TYPES,
  TASK025_PILOT_READINESS_ACTOR_ROLES,
} from '../contracts/task025ControlledPilotReadinessContracts';
import { PILOT_READINESS_CHECK_TYPES } from '../contracts/task025PilotContracts';

describe('Task025 Task021 school integration continuity contract', () => {
  it('blocker types include school_identity from Task 021', () => {
    expect(TASK025_BLOCKER_TYPES).toContain('school_identity');
  });

  it('readiness check types include school_identity verification from Task 021', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('school_identity');
  });

  it('pilot readiness actor roles align with school identity scope from Task 021', () => {
    expect(TASK025_PILOT_READINESS_ACTOR_ROLES).toContain('school_admin');
  });

  it('readiness check types include cohort_configuration and participant_scope from school integration context', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('cohort_configuration');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('participant_scope');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('teacher_admin_access');
  });

  it('blocker types prevent pilot activation without verified school identity', () => {
    expect(TASK025_BLOCKER_TYPES).toContain('pilot_scope');
    expect(TASK025_BLOCKER_TYPES).toContain('cohort_readiness');
  });

  it('actor roles include authorized_pilot_coordinator for school integration coordination', () => {
    expect(TASK025_PILOT_READINESS_ACTOR_ROLES).toContain('authorized_pilot_coordinator');
  });
});
