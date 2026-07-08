import { describe, it, expect } from 'vitest';
import {
  PILOT_PROGRAM_STATUSES,
  PILOT_ELIGIBILITY_STATUSES,
  PILOT_READINESS_CHECK_TYPES,
  PRIVATE_CONTENT_PATTERNS,
} from '../contracts/task025PilotContracts';

describe('task025PilotContracts', () => {
  it('defines valid pilot program statuses', () => {
    expect(PILOT_PROGRAM_STATUSES).toContain('draft');
    expect(PILOT_PROGRAM_STATUSES).toContain('preflight_required');
    expect(PILOT_PROGRAM_STATUSES).toContain('ready');
    expect(PILOT_PROGRAM_STATUSES).toContain('active');
    expect(PILOT_PROGRAM_STATUSES).toContain('paused');
    expect(PILOT_PROGRAM_STATUSES).toContain('completed');
    expect(PILOT_PROGRAM_STATUSES).toContain('blocked');
    expect(PILOT_PROGRAM_STATUSES).toContain('rolled_back');
  });

  it('defines valid eligibility statuses', () => {
    expect(PILOT_ELIGIBILITY_STATUSES).toContain('eligible');
    expect(PILOT_ELIGIBILITY_STATUSES).toContain('blocked');
    expect(PILOT_ELIGIBILITY_STATUSES).toContain('pending_review');
    expect(PILOT_ELIGIBILITY_STATUSES).toContain('removed');
  });

  it('defines all required readiness check types', () => {
    expect(PILOT_READINESS_CHECK_TYPES).toContain('school_identity');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('cohort_configuration');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('participant_scope');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('teacher_admin_access');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('curriculum_scope');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('approved_sources');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('socratic_safety');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('deen_governance');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('privacy_gate');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('rollback_ready');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('kill_switch_ready');
    expect(PILOT_READINESS_CHECK_TYPES).toContain('dry_run_passed');
    expect(PILOT_READINESS_CHECK_TYPES.length).toBeGreaterThanOrEqual(19);
  });

  it('private content patterns cover prohibited fields', () => {
    expect(PRIVATE_CONTENT_PATTERNS).toContain('rawChat');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('authorization');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('databaseUrl');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('answerKey');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('token');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('aiPrompt');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('deenSensitive');
  });
});
