import { describe, it, expect } from 'vitest';
import { TASK031_FORBIDDEN_OUTPUT_PATTERNS } from '../contracts/task031StagingSmokeContracts';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';
import { captureTask031DefaultObservabilityBaseline } from '../services/task031ObservabilityBaselineService';
import { validateTask031CopilotBootstrapSmokeSync } from '../services/task031CopilotBootstrapSmokeService';

describe('Task 031 - no answer keys or marking schemes', () => {
  it('should have answer key in forbidden patterns', () => {
    expect(TASK031_FORBIDDEN_OUTPUT_PATTERNS).toContain('answer key');
    expect(TASK031_FORBIDDEN_OUTPUT_PATTERNS).toContain('protected rubric');
  });

  it('should not expose answer keys in fixture', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const raw = JSON.stringify(fixture).toLowerCase();
    expect(raw).not.toContain('answer key');
  });

  it('should not expose answer keys in observability baseline', () => {
    const baseline = captureTask031DefaultObservabilityBaseline('test');
    const raw = JSON.stringify(baseline).toLowerCase();
    expect(raw).not.toContain('answer key');
  });

  it('should have answerKeysExposed false in copilot bootstrap smoke', () => {
    const result = validateTask031CopilotBootstrapSmokeSync();
    expect(result.answerKeysExposed).toBe(false);
  });

  it('should not expose protected rubric in any service data', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const baseline = captureTask031DefaultObservabilityBaseline('test');
    const allData = JSON.stringify(fixture) + JSON.stringify(baseline);
    expect(allData.toLowerCase()).not.toContain('protected rubric');
  });
});
