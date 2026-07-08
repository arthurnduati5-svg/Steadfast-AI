import { describe, it, expect } from 'vitest';
import { verifyGovernanceContinuity } from '../services/task028GovernanceContinuityService';

describe('task028Task022ContentGovernanceContinuity', () => {
  it('verifies content governance continuity via governance service', async () => {
    const result = await verifyGovernanceContinuity('content-gov-school');
    expect(result).toHaveProperty('continuityStatuses.task022');
  });

  it('task022 continuity status is boolean', async () => {
    const result = await verifyGovernanceContinuity('content-gov-school');
    expect(typeof result.continuityStatuses.task022).toBe('boolean');
  });

  it('safeMessage includes school ID for content governance check', async () => {
    const result = await verifyGovernanceContinuity('content-gov-022');
    expect(result.safeMessage).toContain('content-gov-022');
  });

  it('continuity failure for task022 produces specific reason code', async () => {
    const result = await verifyGovernanceContinuity('missing-content-gov');
    const hasTask022Failure = result.reasonCodes.includes('task022_continuity_missing');
    expect(hasTask022Failure).toBe(typeof result.continuityStatuses.task022 === 'boolean' && !result.continuityStatuses.task022);
  });

  it('all governance checks use same verifyGovernanceContinuity function', async () => {
    const result = await verifyGovernanceContinuity('content-gov-test');
    expect(result.continuityStatuses).toHaveProperty('task020');
    expect(result.continuityStatuses).toHaveProperty('task021');
    expect(result.continuityStatuses).toHaveProperty('task022');
    expect(result.continuityStatuses).toHaveProperty('task023');
  });
});
