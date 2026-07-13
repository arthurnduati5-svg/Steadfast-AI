import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Release Board Package', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035ReleaseBoardPackageService');
  });

  it('should export generateReleaseBoardPackage function', () => {
    expect(typeof service.generateReleaseBoardPackage).toBe('function');
  });

  it('should generate package with correct decision when all gates pass', () => {
    const makeOk = () => ({ ok: true, blockingIssues: [] });
    const makeNotOk = () => ({ ok: false, blockingIssues: ['failed'] });

    const input = {
      task034Proof: { ...makeOk(), safeToRunTask035: true, safeToStartTask036: false, reportFound: true, taskId: '034', safeToStartTask035: true, finalDecision: 'TASK_034_PASS_SAFE_TO_START_TASK_035', blockingIssuesEmpty: true, verificationExitCodeZero: true, controlledRolloutScenarioRun: true, controlledRolloutSafeToStartTask035: true, controlledRolloutRolloutPercent: 20, controlledRolloutOpenRolloutPerformed: false, controlledRolloutSchoolWideRolloutPerformed: false, controlledRolloutHundredPercentRolloutPerformed: false, handoffConsistent: true, handoffAgreesWithReport: true, standaloneLogExists: true, standaloneLogExitZero: true, privacyScanPassed: true, jsonValidationPassed: true, testsPassed: true, noStalePlaceholders: true },
      schoolBoundary: makeOk(),
      simulation: { ...makeOk(), liveActivationPerformed: false, publicActivationPerformed: false, multiSchoolActivationPerformed: false },
      envGate: { ...makeOk(), rawDatabaseUrlExposed: false },
      staffReleaseBoard: makeOk(),
      studentNotice: makeOk(),
      teacherAdmin: makeOk(),
      runtimeGuard: makeOk(),
      healthBudget: makeOk(),
      rollback: makeOk(),
      privacyReview: makeOk(),
      socraticReview: makeOk(),
      deenReview: makeOk(),
      curriculumReview: makeOk(),
    };

    const pkg = service.generateReleaseBoardPackage(input);
    expect(pkg.safeToStartTask036).toBe(true);
    expect(pkg.finalDecision).toBe('TASK_035_PASS_SAFE_TO_START_TASK_036');
    expect(Array.isArray(pkg.blockingIssues)).toBe(true);
  });

  it('should fail when task 034 proof is not ok', () => {
    const makeOk = () => ({ ok: true, blockingIssues: [] });

    const input = {
      task034Proof: { ok: false, blockingIssues: ['task034_proof_invalid'], safeToRunTask035: false, safeToStartTask036: false, reportFound: false, taskId: '', safeToStartTask035: false, finalDecision: '', blockingIssuesEmpty: false, verificationExitCodeZero: false, controlledRolloutScenarioRun: false, controlledRolloutSafeToStartTask035: false, controlledRolloutRolloutPercent: 0, controlledRolloutOpenRolloutPerformed: false, controlledRolloutSchoolWideRolloutPerformed: false, controlledRolloutHundredPercentRolloutPerformed: false, handoffConsistent: false, handoffAgreesWithReport: false, standaloneLogExists: false, standaloneLogExitZero: false, privacyScanPassed: false, jsonValidationPassed: false, testsPassed: false, noStalePlaceholders: false },
      schoolBoundary: makeOk(),
      simulation: { ...makeOk(), liveActivationPerformed: false, publicActivationPerformed: false, multiSchoolActivationPerformed: false },
      envGate: { ...makeOk(), rawDatabaseUrlExposed: false },
      staffReleaseBoard: makeOk(),
      studentNotice: makeOk(),
      teacherAdmin: makeOk(),
      runtimeGuard: makeOk(),
      healthBudget: makeOk(),
      rollback: makeOk(),
      privacyReview: makeOk(),
      socraticReview: makeOk(),
      deenReview: makeOk(),
      curriculumReview: makeOk(),
    };

    const pkg = service.generateReleaseBoardPackage(input);
    expect(pkg.safeToStartTask036).toBe(false);
    expect(pkg.finalDecision).toBe('TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036');
  });
});
