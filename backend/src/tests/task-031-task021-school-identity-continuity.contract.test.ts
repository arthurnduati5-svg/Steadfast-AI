import { describe, it, expect } from 'vitest';
import { createTask031StagingSchoolIdentityFixture, validateTask031Fixture } from '../services/task031StagingSchoolIdentityFixtureService';

describe('Task 031 - Task 021 School Identity Continuity Contract', () => {
  it('should create fixture with schoolId present', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    expect(fixture.schoolId).toBeDefined();
    expect(fixture.schoolId.length).toBeGreaterThan(0);
  });

  it('should have schoolId in verifiedSchoolContext', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    expect(fixture.verifiedSchoolContext.schoolId).toBe(fixture.schoolId);
  });

  it('should have tenantId present in fixture', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    expect(fixture.tenantId).toBeDefined();
    expect(fixture.tenantId.length).toBeGreaterThan(0);
  });

  it('should pass validation with valid fixture', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const result = validateTask031Fixture(fixture);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});
