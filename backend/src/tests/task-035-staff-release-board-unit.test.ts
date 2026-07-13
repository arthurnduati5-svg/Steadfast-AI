import { describe, it, expect } from 'vitest';
import { evaluateStaffReleaseBoard } from '../services/task035StaffReleaseBoardService';

describe('task035StaffReleaseBoard', () => {
  it('should pass when all requirements are met', () => {
    const result = evaluateStaffReleaseBoard({
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
    });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.missingRoles).toHaveLength(0);
    expect(result.safeSummary).toBe('All staff release board checks passed');
  });

  it('should fail when admin approval is missing', () => {
    const result = evaluateStaffReleaseBoard({
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
    });
    expect(result.ok).toBe(false);
    expect(result.missingRoles).toContain('admin');
    expect(result.blockingIssues).toContain('admin_approval_missing');
  });

  it('should fail when operator readiness is missing', () => {
    const result = evaluateStaffReleaseBoard({
      adminApproved: true,
      operatorReady: false,
      teacherLeadReady: true,
      privacyReviewDone: true,
      deenReviewDone: true,
      safeguardingReviewDone: true,
      rollbackOwnerAssigned: true,
      killSwitchOwnerAssigned: true,
      supportConfirmed: true,
      incidentEscalationConfirmed: true,
      studentNoticeApproved: true,
    });
    expect(result.ok).toBe(false);
    expect(result.missingRoles).toContain('operator');
    expect(result.blockingIssues).toContain('operator_readiness_missing');
  });

  it('should fail when multiple requirements are missing', () => {
    const result = evaluateStaffReleaseBoard({
      adminApproved: true,
      operatorReady: false,
      teacherLeadReady: false,
      privacyReviewDone: false,
      deenReviewDone: true,
      safeguardingReviewDone: true,
      rollbackOwnerAssigned: true,
      killSwitchOwnerAssigned: false,
      supportConfirmed: true,
      incidentEscalationConfirmed: true,
      studentNoticeApproved: false,
    });
    expect(result.ok).toBe(false);
    expect(result.missingRoles.length).toBeGreaterThanOrEqual(2);
    expect(result.blockingIssues.length).toBeGreaterThanOrEqual(3);
    expect(result.missingRoles).toContain('operator');
    expect(result.missingRoles).toContain('teacher_lead');
    expect(result.blockingIssues).toContain('kill_switch_owner_not_assigned');
    expect(result.blockingIssues).toContain('student_notice_not_approved');
  });

  it('should report safeSummary correctly on failure', () => {
    const result = evaluateStaffReleaseBoard({
      adminApproved: false,
      operatorReady: false,
      teacherLeadReady: true,
      privacyReviewDone: true,
      deenReviewDone: true,
      safeguardingReviewDone: true,
      rollbackOwnerAssigned: true,
      killSwitchOwnerAssigned: true,
      supportConfirmed: true,
      incidentEscalationConfirmed: true,
      studentNoticeApproved: true,
    });
    expect(result.safeSummary).toBe('Staff release board checks failed');
    expect(result.allRequiredRolesAcknowledged).toBe(false);
    expect(result.allRequiredChecksPassed).toBe(false);
  });
});
