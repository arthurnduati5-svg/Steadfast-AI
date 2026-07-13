import { describe, it, expect } from 'vitest';
import { computeFinalSchoolLaunchDecision } from '../services/task035FinalSchoolLaunchDecisionService';

describe('task035FinalSchoolLaunchDecision', () => {
  it('should return pass when all gates are ok', () => {
    const { safeToStartTask036, finalDecision, blockingIssues } = computeFinalSchoolLaunchDecision({
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
    });
    expect(safeToStartTask036).toBe(true);
    expect(finalDecision).toBe('TASK_035_PASS_SAFE_TO_START_TASK_036');
    expect(blockingIssues).toHaveLength(0);
  });

  it('should fail when task034 proof is not ok', () => {
    const { safeToStartTask036, finalDecision, blockingIssues } = computeFinalSchoolLaunchDecision({
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
    });
    expect(safeToStartTask036).toBe(false);
    expect(finalDecision).toBe('TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036');
    expect(blockingIssues).toContain('task034_proof_not_ok');
  });

  it('should fail when socratic integrity review is not ok', () => {
    const { safeToStartTask036, blockingIssues } = computeFinalSchoolLaunchDecision({
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
      socraticIntegrityReviewOk: false,
      deenGovernanceReviewOk: true,
      curriculumSourceReviewOk: true,
      noPublicRollout: true,
      noMultiSchoolRollout: true,
      noRawPrivateData: true,
      blockingIssuesLength: 0,
    });
    expect(safeToStartTask036).toBe(false);
    expect(blockingIssues).toContain('socratic_integrity_review_not_ok');
  });

  it('should fail when public rollout is enabled', () => {
    const { safeToStartTask036, blockingIssues } = computeFinalSchoolLaunchDecision({
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
    });
    expect(safeToStartTask036).toBe(false);
    expect(blockingIssues).toContain('public_rollout_enabled');
  });

  it('should fail when raw private data is exposed', () => {
    const { safeToStartTask036, blockingIssues } = computeFinalSchoolLaunchDecision({
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
      noRawPrivateData: false,
      blockingIssuesLength: 0,
    });
    expect(safeToStartTask036).toBe(false);
    expect(blockingIssues).toContain('raw_private_data_exposed');
  });
});
