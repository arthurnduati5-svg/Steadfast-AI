import { describe, it, expect, beforeEach } from 'vitest';
import { getControlledRolloutConfig } from '../services/task034ControlledRolloutConfigService';

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV };
});

describe('Task034ControlledRolloutConfig', () => {
  it('should pass with all required env flags set', () => {
    process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT = '1';
    process.env.TASK034_REQUIRE_TASK033_PROOF = '1';
    process.env.TASK034_NO_OPEN_ROLLOUT = '1';
    process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT = '1';
    process.env.TASK034_PRIVACY_SAFE_EVIDENCE = '1';
    process.env.TASK034_REQUIRE_STAFF_READINESS = '1';
    process.env.TASK034_REQUIRE_ROLLBACK_READY = '1';
    process.env.TASK034_MAX_ROLLOUT_PERCENT = '25';
    process.env.TASK034_MAX_ROLLOUT_STUDENTS = '100';

    const config = getControlledRolloutConfig();
    expect(config.blockingIssues).toEqual([]);
    expect(config.envFlagsValid).toBe(true);
    expect(config.maxControlledRolloutPercent).toBe(25);
    expect(config.maxControlledRolloutStudents).toBe(100);
    expect(config.observationMode).toBe('controlled_limited_rollout');
    expect(config.allowOpenRegistration).toBe(false);
    expect(config.allowPublicSignup).toBe(false);
    expect(config.allowAllStudents).toBe(false);
    expect(config.allowSchoolWideRollout).toBe(false);
    expect(config.allowHundredPercentRollout).toBe(false);
  });

  it('should fail when missing required env flags', () => {
    delete process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT;
    delete process.env.TASK034_REQUIRE_TASK033_PROOF;
    delete process.env.TASK034_NO_OPEN_ROLLOUT;

    const config = getControlledRolloutConfig();
    expect(config.envFlagsValid).toBe(false);
    expect(config.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should fail when open registration is enabled', () => {
    process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT = '1';
    process.env.TASK034_REQUIRE_TASK033_PROOF = '1';
    process.env.TASK034_NO_OPEN_ROLLOUT = '1';
    process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT = '1';
    process.env.TASK034_PRIVACY_SAFE_EVIDENCE = '1';
    process.env.TASK034_REQUIRE_STAFF_READINESS = '1';
    process.env.TASK034_REQUIRE_ROLLBACK_READY = '1';
    process.env.OPEN_REGISTRATION_ENABLED = 'true';

    const config = getControlledRolloutConfig();
    expect(config.blockingIssues).toContain('OPEN_REGISTRATION_ENABLED is true');
  });

  it('should fail when school-wide rollout is enabled', () => {
    process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT = '1';
    process.env.TASK034_REQUIRE_TASK033_PROOF = '1';
    process.env.TASK034_NO_OPEN_ROLLOUT = '1';
    process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT = '1';
    process.env.TASK034_PRIVACY_SAFE_EVIDENCE = '1';
    process.env.TASK034_REQUIRE_STAFF_READINESS = '1';
    process.env.TASK034_REQUIRE_ROLLBACK_READY = '1';
    process.env.SCHOOL_WIDE_ROLLOUT_ENABLED = 'true';

    const config = getControlledRolloutConfig();
    expect(config.blockingIssues).toContain('SCHOOL_WIDE_ROLLOUT_ENABLED is true');
  });

  it('should fail when max rollout percent exceeds 25', () => {
    process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT = '1';
    process.env.TASK034_REQUIRE_TASK033_PROOF = '1';
    process.env.TASK034_NO_OPEN_ROLLOUT = '1';
    process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT = '1';
    process.env.TASK034_PRIVACY_SAFE_EVIDENCE = '1';
    process.env.TASK034_REQUIRE_STAFF_READINESS = '1';
    process.env.TASK034_REQUIRE_ROLLBACK_READY = '1';
    process.env.TASK034_MAX_ROLLOUT_PERCENT = '50';

    const config = getControlledRolloutConfig();
    expect(config.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should fail when max rollout students exceeds 100', () => {
    process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT = '1';
    process.env.TASK034_REQUIRE_TASK033_PROOF = '1';
    process.env.TASK034_NO_OPEN_ROLLOUT = '1';
    process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT = '1';
    process.env.TASK034_PRIVACY_SAFE_EVIDENCE = '1';
    process.env.TASK034_REQUIRE_STAFF_READINESS = '1';
    process.env.TASK034_REQUIRE_ROLLBACK_READY = '1';
    process.env.TASK034_MAX_ROLLOUT_STUDENTS = '200';

    const config = getControlledRolloutConfig();
    expect(config.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should use safe identifiers', () => {
    process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT = '1';
    process.env.TASK034_REQUIRE_TASK033_PROOF = '1';
    process.env.TASK034_NO_OPEN_ROLLOUT = '1';
    process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT = '1';
    process.env.TASK034_PRIVACY_SAFE_EVIDENCE = '1';
    process.env.TASK034_REQUIRE_STAFF_READINESS = '1';
    process.env.TASK034_REQUIRE_ROLLBACK_READY = '1';

    const config = getControlledRolloutConfig();
    expect(config.schoolId).toBe('school_task034_limited_rollout_safe');
    expect(config.tenantId).toBe('tenant_task034_limited_rollout_safe');
    expect(config.cohortId).toBe('cohort_task034_limited_rollout_safe');
    expect(config.rolloutRunId).toBe('rollout_run_task034_safe');
    expect(config.rolloutWindowId).toBe('rollout_window_task034_safe');
  });
});
