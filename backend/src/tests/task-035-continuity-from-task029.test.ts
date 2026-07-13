import { describe, it, expect } from 'vitest';
import { evaluateStaffReleaseBoard } from '../services/task035StaffReleaseBoardService';
import { TASK035_FORBIDDEN_OUTPUT_PATTERNS } from '../contracts/task035SchoolWideReadinessContracts';

describe('task035 continuity from task029 (ops console)', () => {
  it('staff release board service importable', () => {
    expect(typeof evaluateStaffReleaseBoard).toBe('function');
  });

  it('release board passes with all requirements met', () => {
    const result = evaluateStaffReleaseBoard({
      adminApproved: true, operatorReady: true, teacherLeadReady: true,
      privacyReviewDone: true, deenReviewDone: true, safeguardingReviewDone: true,
      rollbackOwnerAssigned: true, killSwitchOwnerAssigned: true,
      supportConfirmed: true, incidentEscalationConfirmed: true, studentNoticeApproved: true,
    });
    expect(result.ok).toBe(true);
    expect(result.allRequiredRolesAcknowledged).toBe(true);
  });

  it('forbidden output patterns include privacy-sensitive fields', () => {
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS).toContain('raw student chat');
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS).toContain('private learner memory');
    expect(TASK035_FORBIDDEN_OUTPUT_PATTERNS).toContain('answer key');
  });
});
