import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Final School Launch Decision', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035FinalSchoolLaunchDecisionService');
  });

  it('should export computeFinalSchoolLaunchDecision function', () => {
    expect(typeof service.computeFinalSchoolLaunchDecision).toBe('function');
  });

  it('should return PASS when all gates pass', () => {
    const input = {
      task034ProofOk: true,
      productionEnvironmentGateOk: true,
      schoolBoundaryGuardOk: true,
      fullSchoolSimulationOk: true,
      staffReleaseBoardOk: true,
      studentSafeNoticeOk: true,
      teacherAdminReadinessOk: true,
      runtimeGuardSimulationOk: true,
      healthCapacityBudgetOk: true,
      rollbackReadinessOk: true,
      privacyReviewOk: true,
      socraticIntegrityReviewOk: true,
      deenGovernanceReviewOk: true,
      curriculumSourceReviewOk: true,
      noPublicRollout: true,
      noMultiSchoolRollout: true,
      noRawPrivateData: true,
      blockingIssuesLength: 0,
    };

    const result = service.computeFinalSchoolLaunchDecision(input);
    expect(result.safeToStartTask036).toBe(true);
    expect(result.finalDecision).toBe('TASK_035_PASS_SAFE_TO_START_TASK_036');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should return FAIL when task 034 proof is not ok', () => {
    const input = {
      task034ProofOk: false,
      productionEnvironmentGateOk: true,
      schoolBoundaryGuardOk: true,
      fullSchoolSimulationOk: true,
      staffReleaseBoardOk: true,
      studentSafeNoticeOk: true,
      teacherAdminReadinessOk: true,
      runtimeGuardSimulationOk: true,
      healthCapacityBudgetOk: true,
      rollbackReadinessOk: true,
      privacyReviewOk: true,
      socraticIntegrityReviewOk: true,
      deenGovernanceReviewOk: true,
      curriculumSourceReviewOk: true,
      noPublicRollout: true,
      noMultiSchoolRollout: true,
      noRawPrivateData: true,
      blockingIssuesLength: 0,
    };

    const result = service.computeFinalSchoolLaunchDecision(input);
    expect(result.safeToStartTask036).toBe(false);
    expect(result.finalDecision).toBe('TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036');
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should return FAIL when public rollout enabled', () => {
    const input = {
      task034ProofOk: true,
      productionEnvironmentGateOk: true,
      schoolBoundaryGuardOk: true,
      fullSchoolSimulationOk: true,
      staffReleaseBoardOk: true,
      studentSafeNoticeOk: true,
      teacherAdminReadinessOk: true,
      runtimeGuardSimulationOk: true,
      healthCapacityBudgetOk: true,
      rollbackReadinessOk: true,
      privacyReviewOk: true,
      socraticIntegrityReviewOk: true,
      deenGovernanceReviewOk: true,
      curriculumSourceReviewOk: true,
      noPublicRollout: false,
      noMultiSchoolRollout: true,
      noRawPrivateData: true,
      blockingIssuesLength: 0,
    };

    const result = service.computeFinalSchoolLaunchDecision(input);
    expect(result.safeToStartTask036).toBe(false);
    expect(result.finalDecision).toBe('TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036');
  });
});
