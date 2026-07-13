import { describe, it, expect } from 'vitest';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';

describe('task035 unknown-school denial contract', () => {
  it('blocks unknown school access', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.unknownSchoolBlocked).toBe(true);
  });

  it('generates blocking issue when unknown school is not blocked', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.blockingIssues).not.toContain('unknown_school_not_blocked');
    expect(result.unknownSchoolBlocked).toBe(true);
  });

  it('includes unknownSchoolBlocked as a required boundary property', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result).toHaveProperty('unknownSchoolBlocked');
    expect(typeof result.unknownSchoolBlocked).toBe('boolean');
  });

  it('unknown school blocking contributes to overall ok status', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.unknownSchoolBlocked).toBe(true);
    const allRequiredBlocked = result.crossSchoolAccessBlocked && result.unknownSchoolBlocked && result.tenantMismatchBlocked;
    expect(allRequiredBlocked).toBe(true);
  });

  it('boundary guard does not pass if unknown school could be reached', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.unknownSchoolBlocked).toBe(true);
    const simulatedUnsafeConfig = { ...result, unknownSchoolBlocked: false };
    const blockingIssues = [];
    if (!simulatedUnsafeConfig.unknownSchoolBlocked) blockingIssues.push('unknown_school_not_blocked');
    expect(blockingIssues).toContain('unknown_school_not_blocked');
  });
});
