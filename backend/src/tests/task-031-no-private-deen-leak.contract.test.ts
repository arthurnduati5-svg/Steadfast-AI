import { describe, it, expect } from 'vitest';
import { TASK031_FORBIDDEN_OUTPUT_PATTERNS } from '../contracts/task031StagingSmokeContracts';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';
import { captureTask031DefaultObservabilityBaseline } from '../services/task031ObservabilityBaselineService';

describe('Task 031 - no private Deen text exposed', () => {
  it('should have Deen-sensitive private text in forbidden patterns', () => {
    expect(TASK031_FORBIDDEN_OUTPUT_PATTERNS).toContain('Deen-sensitive private text');
  });

  it('should not expose Deen-sensitive text in fixture', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const raw = JSON.stringify(fixture);
    expect(raw).not.toContain('Deen-sensitive private text');
  });

  it('should not expose Deen-sensitive text in observability baseline', () => {
    const baseline = captureTask031DefaultObservabilityBaseline('test');
    const raw = JSON.stringify(baseline);
    expect(raw).not.toContain('Deen-sensitive private text');
  });

  it('should include Deen-sensitive in the forbidden patterns array', () => {
    const hasDeen = TASK031_FORBIDDEN_OUTPUT_PATTERNS.some(
      p => p.includes('Deen'),
    );
    expect(hasDeen).toBe(true);
  });
});
