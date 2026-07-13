import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Staff Release Board', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035StaffReleaseBoardService');
  });

  it('should export evaluateStaffReleaseBoard function', () => {
    expect(typeof service.evaluateStaffReleaseBoard).toBe('function');
  });

  it('should pass when all acknowledgements present', () => {
    const input = {
      adminApproved: true,
      operatorReady: true,
      teacherLeadReady: true,
      privacyReviewDone: true,
      deenReviewDone: true,
      safeguardingReviewDone: true,
      rollbackOwnerAssigned: true,
      killSwitchOwnerAssigned: true,
      supportConfirmed: true,
      incidentEscalationConfirmed: true,
      studentNoticeApproved: true,
    };
    const result = service.evaluateStaffReleaseBoard(input);
    expect(result.ok).toBe(true);
    expect(result.allRequiredRolesAcknowledged).toBe(true);
    expect(result.allRequiredChecksPassed).toBe(true);
    expect(result.missingRoles).toHaveLength(0);
  });

  it('should fail when admin approval missing', () => {
    const input = {
      adminApproved: false,
      operatorReady: true,
      teacherLeadReady: true,
      privacyReviewDone: true,
      deenReviewDone: true,
      safeguardingReviewDone: true,
      rollbackOwnerAssigned: true,
      killSwitchOwnerAssigned: true,
      supportConfirmed: true,
      incidentEscalationConfirmed: true,
      studentNoticeApproved: true,
    };
    const result = service.evaluateStaffReleaseBoard(input);
    expect(result.ok).toBe(false);
    expect(result.missingRoles).toContain('admin');
  });
});
