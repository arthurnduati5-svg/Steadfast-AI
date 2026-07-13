import { describe, it, expect } from 'vitest';
import { generateReleaseBoardPackage } from '../services/task035ReleaseBoardPackageService';

function makePassingResult(overrides: Record<string, any> = {}) {
  return {
    ok: true,
    blockingIssues: [],
    ...overrides,
  };
}

function makePassingSimulation() {
  return {
    ok: true,
    scenarioRun: true,
    scenarioMode: 'controlled_school_wide_readiness_simulation',
    approvedSchoolOnly: true,
    fullSchoolRosterSimulated: true,
    simulatedCoveragePercent: 100,
    liveActivationPerformed: false,
    publicActivationPerformed: false,
    multiSchoolActivationPerformed: false,
    crossSchoolAccessBlocked: true,
    unknownSchoolBlocked: true,
    staffReleaseBoardPassed: true,
    studentSafeNoticeReady: true,
    runtimeGuardPassed: true,
    rollbackReadinessPassed: true,
    healthCapacityBudgetPassed: true,
    privacyReviewPassed: true,
    socraticIntegrityPassed: true,
    deenGovernancePassed: true,
    curriculumSourcePassed: true,
    finalLaunchDecision: 'safe_to_prepare_school_launch',
    safeToStartTask036: true,
    blockingIssues: [],
  };
}

function makePassingEnvGate() {
  return {
    ok: true,
    nodeEnv: 'test',
    databaseUrlPresent: true,
    databaseUrlClassification: 'safe',
    rawDatabaseUrlExposed: false,
    publicRolloutBlocked: true,
    multiSchoolRolloutBlocked: true,
    fullSchoolSimulationOnly: true,
    releaseBoardRequired: true,
    rollbackReadyRequired: true,
    task034ProofRequired: true,
    blockingIssues: [],
  };
}

describe('task035ReleaseBoardPackage', () => {
  it('should generate a passing package when all gates pass', () => {
    const pkg = generateReleaseBoardPackage({
      task034Proof: makePassingResult(),
      schoolBoundary: makePassingResult(),
      simulation: makePassingSimulation(),
      envGate: makePassingEnvGate(),
      staffReleaseBoard: makePassingResult(),
      studentNotice: makePassingResult(),
      teacherAdmin: makePassingResult(),
      runtimeGuard: makePassingResult(),
      healthBudget: makePassingResult(),
      rollback: makePassingResult(),
      privacyReview: makePassingResult(),
      socraticReview: makePassingResult(),
      deenReview: makePassingResult(),
      curriculumReview: makePassingResult(),
    });
    expect(pkg.safeToStartTask036).toBe(true);
    expect(pkg.finalDecision).toBe('TASK_035_PASS_SAFE_TO_START_TASK_036');
    expect(pkg.blockingIssues).toHaveLength(0);
  });

  it('should include all summary sections in the package', () => {
    const pkg = generateReleaseBoardPackage({
      task034Proof: makePassingResult(),
      schoolBoundary: makePassingResult(),
      simulation: makePassingSimulation(),
      envGate: makePassingEnvGate(),
      staffReleaseBoard: makePassingResult(),
      studentNotice: makePassingResult(),
      teacherAdmin: makePassingResult(),
      runtimeGuard: makePassingResult(),
      healthBudget: makePassingResult(),
      rollback: makePassingResult(),
      privacyReview: makePassingResult(),
      socraticReview: makePassingResult(),
      deenReview: makePassingResult(),
      curriculumReview: makePassingResult(),
    });
    expect(pkg.task034ProofSummary).toBeDefined();
    expect(pkg.schoolBoundarySummary).toBeDefined();
    expect(pkg.fullSchoolSimulationSummary).toBeDefined();
    expect(pkg.productionSafeEnvironmentGate).toBeDefined();
    expect(pkg.staffReleaseBoardSummary).toBeDefined();
    expect(pkg.studentSafeNoticeSummary).toBeDefined();
    expect(pkg.teacherAdminReadinessSummary).toBeDefined();
    expect(pkg.runtimeGuardSimulationSummary).toBeDefined();
    expect(pkg.healthCapacityBudgetSummary).toBeDefined();
    expect(pkg.rollbackKillSwitchSummary).toBeDefined();
    expect(pkg.privacyReviewSummary).toBeDefined();
    expect(pkg.socraticReviewSummary).toBeDefined();
    expect(pkg.deenReviewSummary).toBeDefined();
    expect(pkg.curriculumSourceReviewSummary).toBeDefined();
  });

  it('should fail safeToStartTask036 when simulation has live activation', () => {
    const pkg = generateReleaseBoardPackage({
      task034Proof: makePassingResult(),
      schoolBoundary: makePassingResult(),
      simulation: { ...makePassingSimulation(), liveActivationPerformed: true },
      envGate: makePassingEnvGate(),
      staffReleaseBoard: makePassingResult(),
      studentNotice: makePassingResult(),
      teacherAdmin: makePassingResult(),
      runtimeGuard: makePassingResult(),
      healthBudget: makePassingResult(),
      rollback: makePassingResult(),
      privacyReview: makePassingResult(),
      socraticReview: makePassingResult(),
      deenReview: makePassingResult(),
      curriculumReview: makePassingResult(),
    });
    expect(pkg.safeToStartTask036).toBe(false);
    expect(pkg.finalDecision).toBe('TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036');
  });

  it('should fail safeToStartTask036 when env gate exposes raw database url', () => {
    const pkg = generateReleaseBoardPackage({
      task034Proof: makePassingResult(),
      schoolBoundary: makePassingResult(),
      simulation: makePassingSimulation(),
      envGate: { ...makePassingEnvGate(), rawDatabaseUrlExposed: true },
      staffReleaseBoard: makePassingResult(),
      studentNotice: makePassingResult(),
      teacherAdmin: makePassingResult(),
      runtimeGuard: makePassingResult(),
      healthBudget: makePassingResult(),
      rollback: makePassingResult(),
      privacyReview: makePassingResult(),
      socraticReview: makePassingResult(),
      deenReview: makePassingResult(),
      curriculumReview: makePassingResult(),
    });
    expect(pkg.safeToStartTask036).toBe(false);
    expect(pkg.finalDecision).toBe('TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036');
  });

  it('should include known limitations in the package', () => {
    const pkg = generateReleaseBoardPackage({
      task034Proof: makePassingResult(),
      schoolBoundary: makePassingResult(),
      simulation: makePassingSimulation(),
      envGate: makePassingEnvGate(),
      staffReleaseBoard: makePassingResult(),
      studentNotice: makePassingResult(),
      teacherAdmin: makePassingResult(),
      runtimeGuard: makePassingResult(),
      healthBudget: makePassingResult(),
      rollback: makePassingResult(),
      privacyReview: makePassingResult(),
      socraticReview: makePassingResult(),
      deenReview: makePassingResult(),
      curriculumReview: makePassingResult(),
    });
    expect(pkg.knownLimitations.length).toBeGreaterThan(0);
    expect(pkg.generatedAt).toBeDefined();
    expect(typeof pkg.generatedAt).toBe('string');
  });
});
