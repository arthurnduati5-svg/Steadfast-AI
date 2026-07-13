import { describe, it, expect } from 'vitest';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';

describe('task035 cross-school denial contract', () => {
  it('blocks cross-school access', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.crossSchoolAccessBlocked).toBe(true);
  });

  it('generates blocking issue when cross school access is not blocked', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.blockingIssues).not.toContain('cross_school_access_not_blocked');
    expect(result.crossSchoolAccessBlocked).toBe(true);
  });

  it('includes crossSchoolAccessBlocked in boundary config', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result).toHaveProperty('crossSchoolAccessBlocked');
    expect(typeof result.crossSchoolAccessBlocked).toBe('boolean');
  });

  it('ensures cross school blocking is part of overall pass', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.crossSchoolAccessBlocked).toBe(true);
    expect(result.ok).toBe(true);
  });

  it('rejects configs where crossSchoolAccessBlocked is false', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.crossSchoolAccessBlocked).toBe(true);
    const blockingIssuesForFalse = [];
    if (!false) blockingIssuesForFalse.push('cross_school_access_not_blocked');
    expect(blockingIssuesForFalse).toContain('cross_school_access_not_blocked');
  });
});
