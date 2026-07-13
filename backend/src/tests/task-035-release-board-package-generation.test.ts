import { describe, it, expect } from 'vitest';
import { generateReleaseBoardPackage } from '../services/task035ReleaseBoardPackageService';
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
import { simulateFullSchoolRollout } from '../services/task035FullSchoolRolloutSimulationService';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';
import { loadTask034Proof } from '../services/task035Task034ProofLoaderService';

describe('task035 release board package generation', () => {
  const defaultInput = {
    task034Proof: loadTask034Proof(),
    schoolBoundary: validateApprovedSchoolBoundary(),
    simulation: simulateFullSchoolRollout({
      schoolBoundaryOk: true, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: true,
    }),
    envGate: evaluateProductionSafeEnvironmentGate(),
    staffReleaseBoard: evaluateStaffReleaseBoard({
      adminApproved: true, operatorReady: true, teacherLeadReady: true,
      privacyReviewDone: true, deenReviewDone: true, safeguardingReviewDone: true,
      rollbackOwnerAssigned: true, killSwitchOwnerAssigned: true,
      supportConfirmed: true, incidentEscalationConfirmed: true, studentNoticeApproved: true,
    }),
    studentNotice: generateStudentSafeLaunchNotice(),
    teacherAdmin: evaluateTeacherAdminReadiness(),
    runtimeGuard: simulateFullSchoolRuntimeGuard(),
    healthBudget: evaluateHealthCapacityBudget(),
    rollback: evaluateFullSchoolRollbackReadiness(),
    privacyReview: reviewPrivacySafety(),
    socraticReview: reviewSocraticIntegrity(),
    deenReview: reviewDeenGovernance(),
    curriculumReview: reviewCurriculumSource(),
  };

  it('generates package with task034 proof summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.task034ProofSummary).toBeDefined();
  });

  it('generates package with school boundary summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.schoolBoundarySummary).toBeDefined();
  });

  it('generates package with simulation summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.fullSchoolSimulationSummary).toBeDefined();
  });

  it('generates package with environment gate summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.productionSafeEnvironmentGate).toBeDefined();
  });

  it('generates package with staff release board summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.staffReleaseBoardSummary).toBeDefined();
  });

  it('generates package with student notice summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.studentSafeNoticeSummary).toBeDefined();
  });

  it('generates package with teacher readiness summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.teacherAdminReadinessSummary).toBeDefined();
  });

  it('generates package with runtime guard summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.runtimeGuardSimulationSummary).toBeDefined();
  });

  it('generates package with health capacity summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.healthCapacityBudgetSummary).toBeDefined();
  });

  it('generates package with rollback summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.rollbackKillSwitchSummary).toBeDefined();
  });

  it('generates package with privacy review summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.privacyReviewSummary).toBeDefined();
  });

  it('generates package with socratic review summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.socraticReviewSummary).toBeDefined();
  });

  it('generates package with deen review summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.deenReviewSummary).toBeDefined();
  });

  it('generates package with curriculum review summary', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.curriculumSourceReviewSummary).toBeDefined();
  });

  it('package has known limitations array', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(Array.isArray(pkg.knownLimitations)).toBe(true);
  });

  it('package has safeToStartTask036 flag', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(typeof pkg.safeToStartTask036).toBe('boolean');
  });

  it('package has final decision', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.finalDecision).toMatch(/TASK_035/);
  });

  it('package has generation timestamp', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.generatedAt).toBeTruthy();
  });

  it('blocking issues from env gate are captured in package', () => {
    const pkg = generateReleaseBoardPackage(defaultInput);
    expect(pkg.blockingIssues.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(pkg.blockingIssues)).toBe(true);
  });
});
