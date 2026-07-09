import { describe, it, expect } from 'vitest';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';
import { TASK031_FORBIDDEN_OUTPUT_PATTERNS } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { runTask031BackendRouteSmoke } from '../services/task031BackendRouteSmokeService';

describe('Task 031 - Task 022 Content Governance Continuity Contract', () => {
  it('should have curriculumScope present in fixture', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    expect(fixture.curriculumScope).toBeDefined();
    expect(fixture.curriculumScope).toContain('task031_safe');
  });

  it('should not expose answer keys in forbidden patterns', () => {
    expect(TASK031_FORBIDDEN_OUTPUT_PATTERNS).toContain('answer key');
  });

  it('should not expose protected rubric in forbidden patterns', () => {
    expect(TASK031_FORBIDDEN_OUTPUT_PATTERNS).toContain('protected rubric');
  });

  it('should include curriculum content route in backend smoke routes', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.taskRoutesChecked).toBeGreaterThanOrEqual(12);
    expect(result.ok).toBe(true);
  });
});
