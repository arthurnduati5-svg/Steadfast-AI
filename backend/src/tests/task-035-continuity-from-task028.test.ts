import { describe, it, expect } from 'vitest';
import { simulateFullSchoolRollout } from '../services/task035FullSchoolRolloutSimulationService';

describe('task035 continuity from task028 (expansion execution)', () => {
  it('full school simulation service importable', () => {
    expect(typeof simulateFullSchoolRollout).toBe('function');
  });

  it('simulation rejects when school boundary not ok', () => {
    const result = simulateFullSchoolRollout({
      schoolBoundaryOk: false, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: true,
    });
    expect(result.safeToStartTask036).toBe(false);
    expect(result.blockingIssues).toContain('school_boundary_not_validated');
  });

  it('simulation passes when all gates pass', () => {
    const result = simulateFullSchoolRollout({
      schoolBoundaryOk: true, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: true,
    });
    expect(result.safeToStartTask036).toBe(true);
    expect(result.liveActivationPerformed).toBe(false);
    expect(result.publicActivationPerformed).toBe(false);
  });
});
