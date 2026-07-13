import { describe, it, expect } from 'vitest';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';
import { simulateFullSchoolRollout } from '../services/task035FullSchoolRolloutSimulationService';
import { TASK035_SAFE_IDENTIFIERS } from '../contracts/task035SchoolWideReadinessContracts';

describe('Task 035 - No Cross-School Access Contract', () => {
  it('should block cross-school access in boundary guard', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.crossSchoolAccessBlocked).toBe(true);
    expect(result.unknownSchoolBlocked).toBe(true);
    expect(result.tenantMismatchBlocked).toBe(true);
  });

  it('should block cross-school access in simulation', () => {
    const input = {
      schoolBoundaryOk: true, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: false, unknownSchoolBlocked: true,
    };
    const result = simulateFullSchoolRollout(input);
    expect(result.safeToStartTask036).toBe(false);
    expect(result.blockingIssues.some((i: string) => i.includes('cross_school'))).toBe(true);
  });

  it('should have safe identifiers without real school data', () => {
    for (const id of TASK035_SAFE_IDENTIFIERS) {
      expect(id).not.toMatch(/@/);
      expect(id).not.toMatch(/\d{3}[-.]?\d{3}[-.]?\d{4}/);
    }
  });
});
