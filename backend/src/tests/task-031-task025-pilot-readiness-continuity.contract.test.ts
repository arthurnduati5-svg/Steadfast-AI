import { describe, it, expect } from 'vitest';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';
import { generateTask031Report } from '../services/task031ReportService';

describe('Task 031 - Task 025 Pilot Readiness Continuity Contract', () => {
  it('should verify school identity for pilot readiness', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    expect(fixture.schoolId).toBe('school_task031_staging_safe');
    expect(fixture.tenantId).toBe('tenant_task031_staging_safe');
  });

  it('should have admin auth context with schoolId for pilot operations', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    expect(fixture.adminAuthContext.schoolId).toBe(fixture.schoolId);
  });

  it('should confirm staging environment gate passes pilot readiness', async () => {
    const report = await generateTask031Report({});
    expect(report.stagingEnvironmentGatePassed).toBe(true);
  });

  it('should confirm no live student guard passes pilot readiness', async () => {
    const report = await generateTask031Report({});
    expect(report.noLiveStudentGuardPassed).toBe(true);
  });
});
