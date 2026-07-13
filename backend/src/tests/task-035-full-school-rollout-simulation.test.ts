import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Full School Rollout Simulation', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035FullSchoolRolloutSimulationService');
  });

  it('should export simulateFullSchoolRollout function', () => {
    expect(typeof service.simulateFullSchoolRollout).toBe('function');
  });

  it('should pass when all gates pass', () => {
    const input = {
      schoolBoundaryOk: true,
      staffReleaseBoardOk: true,
      studentNoticeReady: true,
      runtimeGuardOk: true,
      rollbackReadinessOk: true,
      healthBudgetOk: true,
      privacyReviewOk: true,
      socraticOk: true,
      deenOk: true,
      curriculumOk: true,
      crossSchoolBlocked: true,
      unknownSchoolBlocked: true,
    };
    const result = service.simulateFullSchoolRollout(input);
    expect(result.scenarioRun).toBe(true);
    expect(result.scenarioMode).toBe('controlled_school_wide_readiness_simulation');
    expect(result.liveActivationPerformed).toBe(false);
    expect(result.publicActivationPerformed).toBe(false);
    expect(result.multiSchoolActivationPerformed).toBe(false);
    expect(result.safeToStartTask036).toBe(true);
    expect(result.finalLaunchDecision).toBe('safe_to_prepare_school_launch');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should fail when school boundary is not ok', () => {
    const input = {
      schoolBoundaryOk: false,
      staffReleaseBoardOk: true,
      studentNoticeReady: true,
      runtimeGuardOk: true,
      rollbackReadinessOk: true,
      healthBudgetOk: true,
      privacyReviewOk: true,
      socraticOk: true,
      deenOk: true,
      curriculumOk: true,
      crossSchoolBlocked: true,
      unknownSchoolBlocked: true,
    };
    const result = service.simulateFullSchoolRollout(input);
    expect(result.safeToStartTask036).toBe(false);
    expect(result.finalLaunchDecision).toBe('not_safe_to_launch');
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });
});
