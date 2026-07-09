import { describe, it, expect } from 'vitest';
import { TASK031_FORBIDDEN_OUTPUT_PATTERNS } from '../contracts/task031StagingSmokeContracts';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';
import { captureTask031DefaultObservabilityBaseline } from '../services/task031ObservabilityBaselineService';

describe('Task 031 - no safeguarding raw data leak', () => {
  it('should have safeguarding raw details in forbidden patterns', () => {
    expect(TASK031_FORBIDDEN_OUTPUT_PATTERNS).toContain('safeguarding raw details');
  });

  it('should not expose safeguarding raw details in fixture', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const raw = JSON.stringify(fixture).toLowerCase();
    expect(raw).not.toContain('safeguarding raw details');
  });

  it('should not expose safeguarding raw details in observability baseline', () => {
    const baseline = captureTask031DefaultObservabilityBaseline('test');
    const raw = JSON.stringify(baseline).toLowerCase();
    expect(raw).not.toContain('safeguarding raw details');
  });

  it('should have forbidden patterns list covering safeguarding', () => {
    const hasSafeguarding = TASK031_FORBIDDEN_OUTPUT_PATTERNS.some(
      p => p.toLowerCase().includes('safeguarding'),
    );
    expect(hasSafeguarding).toBe(true);
  });
});
