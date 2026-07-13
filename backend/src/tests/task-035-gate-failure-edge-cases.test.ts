import { describe, it, expect } from 'vitest';
import { simulateFullSchoolRollout } from '../services/task035FullSchoolRolloutSimulationService';
import { evaluateStaffReleaseBoard } from '../services/task035StaffReleaseBoardService';
import { evaluateProductionSafeEnvironmentGate } from '../services/task035ProductionSafeEnvironmentGateService';

describe('task035 gate failure edge cases', () => {
  it('school boundary fail blocks simulation', () => {
    const r = simulateFullSchoolRollout({
      schoolBoundaryOk: false, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: true,
    });
    expect(r.ok).toBe(false);
    expect(r.blockingIssues).toContain('school_boundary_not_validated');
    expect(r.safeToStartTask036).toBe(false);
  });

  it('release board fail blocks simulation', () => {
    const r = simulateFullSchoolRollout({
      schoolBoundaryOk: true, staffReleaseBoardOk: false, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: true,
    });
    expect(r.ok).toBe(false);
    expect(r.blockingIssues).toContain('staff_release_board_not_passed');
  });

  it('runtime guard fail blocks simulation', () => {
    const r = simulateFullSchoolRollout({
      schoolBoundaryOk: true, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: false, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: true,
    });
    expect(r.ok).toBe(false);
    expect(r.blockingIssues).toContain('runtime_guard_not_passed');
  });

  it('health budget fail blocks simulation', () => {
    const r = simulateFullSchoolRollout({
      schoolBoundaryOk: true, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: false, healthBudgetOk: false,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: true,
    });
    expect(r.ok).toBe(false);
    expect(r.blockingIssues).toContain('health_budget_not_passed');
  });

  it('cross school not blocked fails simulation', () => {
    const r = simulateFullSchoolRollout({
      schoolBoundaryOk: true, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: false, unknownSchoolBlocked: true,
    });
    expect(r.ok).toBe(false);
    expect(r.blockingIssues).toContain('cross_school_access_not_blocked');
  });

  it('unknown school not blocked fails simulation', () => {
    const r = simulateFullSchoolRollout({
      schoolBoundaryOk: true, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: false,
    });
    expect(r.ok).toBe(false);
    expect(r.blockingIssues).toContain('unknown_school_not_blocked');
  });

  it('release board detects missing admin approval', () => {
    const r = evaluateStaffReleaseBoard({
      adminApproved: false, operatorReady: true, teacherLeadReady: true,
      privacyReviewDone: true, deenReviewDone: true, safeguardingReviewDone: true,
      rollbackOwnerAssigned: true, killSwitchOwnerAssigned: true,
      supportConfirmed: true, incidentEscalationConfirmed: true, studentNoticeApproved: true,
    });
    expect(r.ok).toBe(false);
    expect(r.missingRoles).toContain('admin');
  });

  it('release board detects missing student notice', () => {
    const r = evaluateStaffReleaseBoard({
      adminApproved: true, operatorReady: true, teacherLeadReady: true,
      privacyReviewDone: true, deenReviewDone: true, safeguardingReviewDone: true,
      rollbackOwnerAssigned: true, killSwitchOwnerAssigned: true,
      supportConfirmed: true, incidentEscalationConfirmed: true, studentNoticeApproved: false,
    });
    expect(r.ok).toBe(false);
    expect(r.blockingIssues).toContain('student_notice_not_approved');
  });

  it('env gate blocking issues list is populated when flags missing', () => {
    const previous = process.env.TASK035_SCHOOL_WIDE_READINESS;
    const prevProof = process.env.TASK035_REQUIRE_TASK034_PROOF;
    delete process.env.TASK035_SCHOOL_WIDE_READINESS;
    delete process.env.TASK035_REQUIRE_TASK034_PROOF;
    const r = evaluateProductionSafeEnvironmentGate();
    expect(r.blockingIssues.length).toBeGreaterThanOrEqual(2);
    if (previous) process.env.TASK035_SCHOOL_WIDE_READINESS = previous;
    if (prevProof) process.env.TASK035_REQUIRE_TASK034_PROOF = prevProof;
  });
});
