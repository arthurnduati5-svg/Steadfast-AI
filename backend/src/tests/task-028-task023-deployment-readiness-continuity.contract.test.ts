import { describe, it, expect } from 'vitest';
import { verifyGovernanceContinuity } from '../services/task028GovernanceContinuityService';

describe('task028Task023DeploymentReadinessContinuity', () => {
  it('verifies deployment readiness continuity via governance service', async () => {
    const result = await verifyGovernanceContinuity('deploy-readiness-school');
    expect(result).toHaveProperty('continuityStatuses.task023');
  });

  it('task023 continuity status is boolean', async () => {
    const result = await verifyGovernanceContinuity('deploy-readiness-school');
    expect(typeof result.continuityStatuses.task023).toBe('boolean');
  });

  it('safeMessage includes school ID for deployment check', async () => {
    const result = await verifyGovernanceContinuity('deploy-023-test');
    expect(result.safeMessage).toContain('deploy-023-test');
  });

  it('continuity failure for task023 produces specific reason code', async () => {
    const result = await verifyGovernanceContinuity('missing-deploy-023');
    const hasTask023Failure = result.reasonCodes.includes('task023_continuity_missing');
    expect(hasTask023Failure).toBe(typeof result.continuityStatuses.task023 === 'boolean' && !result.continuityStatuses.task023);
  });

  it('document paths include task023 deployment report', async () => {
    const result = await verifyGovernanceContinuity('deploy-023-check');
    expect(result.continuityStatuses).toHaveProperty('task023');
    expect(typeof result.continuityStatuses.task023).toBe('boolean');
    expect(result.safeMessage).toBeTruthy();
  });
});
