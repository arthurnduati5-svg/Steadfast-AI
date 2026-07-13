import { describe, it, expect } from 'vitest';
import { reviewPrivacySafety } from '../services/task035PrivacyReviewService';
import { evaluateHealthCapacityBudget } from '../services/task035HealthCapacityBudgetService';
import { evaluateFullSchoolRollbackReadiness } from '../services/task035FullSchoolRollbackReadinessService';
import { evaluateStaffReleaseBoard } from '../services/task035StaffReleaseBoardService';
import { generateStudentSafeLaunchNotice } from '../services/task035StudentSafeLaunchNoticeService';
import { reviewSocraticIntegrity } from '../services/task035SocraticIntegrityReviewService';
import { reviewDeenGovernance } from '../services/task035DeenGovernanceReviewService';
import { reviewCurriculumSource } from '../services/task035CurriculumSourceReviewService';
import { evaluateTeacherAdminReadiness } from '../services/task035TeacherAdminReadinessChecklistService';
import { simulateFullSchoolRuntimeGuard } from '../services/task035FullSchoolRuntimeGuardSimulationService';
import { evaluateProductionSafeEnvironmentGate } from '../services/task035ProductionSafeEnvironmentGateService';

describe('task035 run all gates acceptance', () => {
  it('all 11 gate services run without throwing', () => {
    expect(() => reviewPrivacySafety()).not.toThrow();
    expect(() => evaluateHealthCapacityBudget()).not.toThrow();
    expect(() => evaluateFullSchoolRollbackReadiness()).not.toThrow();
    expect(() => evaluateStaffReleaseBoard({
      adminApproved: true, operatorReady: true, teacherLeadReady: true,
      privacyReviewDone: true, deenReviewDone: true, safeguardingReviewDone: true,
      rollbackOwnerAssigned: true, killSwitchOwnerAssigned: true,
      supportConfirmed: true, incidentEscalationConfirmed: true, studentNoticeApproved: true,
    })).not.toThrow();
    expect(() => generateStudentSafeLaunchNotice()).not.toThrow();
    expect(() => reviewSocraticIntegrity()).not.toThrow();
    expect(() => reviewDeenGovernance()).not.toThrow();
    expect(() => reviewCurriculumSource()).not.toThrow();
    expect(() => evaluateTeacherAdminReadiness()).not.toThrow();
    expect(() => simulateFullSchoolRuntimeGuard()).not.toThrow();
    expect(() => evaluateProductionSafeEnvironmentGate()).not.toThrow();
  });

  it('all gates pass with ok=true in default synthetic mode', () => {
    const privacy = reviewPrivacySafety(); expect(privacy.ok).toBe(true);
    const health = evaluateHealthCapacityBudget(); expect(health.ok).toBe(true);
    const rollback = evaluateFullSchoolRollbackReadiness(); expect(rollback.ok).toBe(true);
    const notice = generateStudentSafeLaunchNotice(); expect(notice.ok).toBe(true);
    const socratic = reviewSocraticIntegrity(); expect(socratic.ok).toBe(true);
    const deen = reviewDeenGovernance(); expect(deen.ok).toBe(true);
    const curriculum = reviewCurriculumSource(); expect(curriculum.ok).toBe(true);
    const readiness = evaluateTeacherAdminReadiness(); expect(readiness.ok).toBe(true);
    const runtime = simulateFullSchoolRuntimeGuard(); expect(runtime.ok).toBe(true);
  });

  it('all gates produce zero blocking issues in default mode', () => {
    expect(reviewPrivacySafety().blockingIssues).toHaveLength(0);
    expect(evaluateHealthCapacityBudget().blockingIssues).toHaveLength(0);
    expect(evaluateFullSchoolRollbackReadiness().blockingIssues).toHaveLength(0);
    expect(generateStudentSafeLaunchNotice().blockingIssues).toHaveLength(0);
    expect(reviewSocraticIntegrity().blockingIssues).toHaveLength(0);
    expect(reviewDeenGovernance().blockingIssues).toHaveLength(0);
    expect(reviewCurriculumSource().blockingIssues).toHaveLength(0);
    expect(evaluateTeacherAdminReadiness().blockingIssues).toHaveLength(0);
    expect(simulateFullSchoolRuntimeGuard().blockingIssues).toHaveLength(0);
  });
});
