import { describe, it, expect } from 'vitest';
import { TASK031_FORBIDDEN_OUTPUT_PATTERNS, TASK031_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';
import { captureTask031DefaultObservabilityBaseline } from '../services/task031ObservabilityBaselineService';

describe('Task 031 - no hidden reasoning / chain of thought', () => {
  it('should have AI prompt and provider response in forbidden patterns', () => {
    expect(TASK031_FORBIDDEN_OUTPUT_PATTERNS).toContain('AI prompt');
    expect(TASK031_FORBIDDEN_OUTPUT_PATTERNS).toContain('provider response');
  });

  it('should not expose AI prompt in fixture data', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const raw = JSON.stringify(fixture).toLowerCase();
    expect(raw).not.toContain('ai prompt');
  });

  it('should not expose provider response in observability baseline', () => {
    const baseline = captureTask031DefaultObservabilityBaseline('test');
    const raw = JSON.stringify(baseline).toLowerCase();
    expect(raw).not.toContain('provider response');
  });

  it('should define forbidden output fields for hidden reasoning', () => {
    expect(TASK031_FORBIDDEN_OUTPUT_FIELDS).toContain('rawPayload');
    expect(TASK031_FORBIDDEN_OUTPUT_FIELDS).toContain('providerPayloads');
    expect(TASK031_FORBIDDEN_OUTPUT_FIELDS).toContain('secrets');
  });
});
