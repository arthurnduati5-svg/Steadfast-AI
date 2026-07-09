import { describe, it, expect } from 'vitest';
import { checkTask032CanaryCohortEligibility } from '../services/task032CanaryCohortEligibilityService';
import {
  createTask032ApprovedCanaryFixture,
  createTask032CohortMembersFixture,
  createTask032OutOfCohortStudentFixture,
  createTask032InactiveStudentFixture,
} from '../tests/fixtures/task032ApprovedCanaryFixture';

describe('Task 032 - Cohort Eligibility', () => {
  it('should pass with valid cohort members', async () => {
    const config = createTask032ApprovedCanaryFixture();
    const members = createTask032CohortMembersFixture();
    const result = await checkTask032CanaryCohortEligibility({ config, members });
    expect(result.ok).toBe(true);
    expect(result.eligibleStudentCount).toBe(2);
    expect(result.canaryCapPassed).toBe(true);
  });

  it('should fail with null config', async () => {
    const result = await checkTask032CanaryCohortEligibility({ config: null, members: [] });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('cohort_eligibility_config_missing');
  });

  it('should detect out-of-cohort student', async () => {
    const config = createTask032ApprovedCanaryFixture();
    const members = [createTask032OutOfCohortStudentFixture()];
    const result = await checkTask032CanaryCohortEligibility({ config, members });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('cohort_member_not_in_approved_cohort');
  });

  it('should detect inactive student', async () => {
    const config = createTask032ApprovedCanaryFixture();
    const members = [createTask032InactiveStudentFixture()];
    const result = await checkTask032CanaryCohortEligibility({ config, members });
    expect(result.ineligibleCount).toBeGreaterThan(0);
  });

  it('should fail if requested exceeds cap', async () => {
    const config = { ...createTask032ApprovedCanaryFixture(), effectiveStudentCap: 1, requestedStudentCount: 2 };
    const members = createTask032CohortMembersFixture();
    const result = await checkTask032CanaryCohortEligibility({ config, members });
    expect(result.canaryCapPassed).toBe(false);
    expect(result.blockingIssues).toContain('canary_size_exceeds_cap');
  });

  it('should not expose raw student identity', async () => {
    const config = createTask032ApprovedCanaryFixture();
    const members = createTask032CohortMembersFixture();
    const result = await checkTask032CanaryCohortEligibility({ config, members });
    expect(result.rawStudentIdentityExposed).toBe(false);
  });
});
