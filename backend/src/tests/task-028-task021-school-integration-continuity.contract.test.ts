import { describe, it, expect } from 'vitest';
import { verifyGovernanceContinuity } from '../services/task028GovernanceContinuityService';

describe('task028Task021SchoolIntegrationContinuity', () => {
  it('verifies task021 school integration continuity', async () => {
    const result = await verifyGovernanceContinuity('school-continuity-021');
    expect(result).toHaveProperty('ok');
    expect(result).toHaveProperty('continuityStatuses');
  });

  it('task021 continuity has a boolean status', async () => {
    const result = await verifyGovernanceContinuity('school-continuity-021');
    expect(typeof result.continuityStatuses.task021).toBe('boolean');
  });

  it('safeMessage references school when continuity passes', async () => {
    const result = await verifyGovernanceContinuity('school-021-test');
    expect(result.safeMessage).toContain('school-021-test');
  });

  it('safeMessage references school when continuity fails', async () => {
    const result = await verifyGovernanceContinuity('school-021-fail');
    expect(result.safeMessage).toContain('school-021-fail');
  });

  it('reasonCodes list task021_continuity_missing when continuity fails', async () => {
    const result = await verifyGovernanceContinuity('missing-school-021');
    const hasTask021Failure = result.reasonCodes.includes('task021_continuity_missing');
    expect(hasTask021Failure).toBe(typeof result.continuityStatuses.task021 === 'boolean' && !result.continuityStatuses.task021);
  });

  it('verifies 9 continuity statuses total', async () => {
    const result = await verifyGovernanceContinuity('school-021-full');
    const statusKeys = Object.keys(result.continuityStatuses);
    expect(statusKeys.length).toBe(8);
    expect(statusKeys).toContain('task020');
    expect(statusKeys).toContain('task021');
  });
});
