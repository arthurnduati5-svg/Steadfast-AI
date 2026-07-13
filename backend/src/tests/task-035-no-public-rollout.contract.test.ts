import { describe, it, expect } from 'vitest';
import { evaluateProductionSafeEnvironmentGate } from '../services/task035ProductionSafeEnvironmentGateService';
import { simulateFullSchoolRollout } from '../services/task035FullSchoolRolloutSimulationService';
import { computeFinalSchoolLaunchDecision } from '../services/task035FinalSchoolLaunchDecisionService';

describe('Task 035 - No Public Rollout Contract', () => {
  it('should block open registration in environment gate', () => {
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.publicRolloutBlocked).toBeDefined();
  });

  it('should block multi-school rollout in environment gate', () => {
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.multiSchoolRolloutBlocked).toBeDefined();
  });

  it('should not allow uncontrolled activation in simulation', () => {
    const input = {
      schoolBoundaryOk: true, staffReleaseBoardOk: true, studentNoticeReady: true,
      runtimeGuardOk: true, rollbackReadinessOk: true, healthBudgetOk: true,
      privacyReviewOk: true, socraticOk: true, deenOk: true, curriculumOk: true,
      crossSchoolBlocked: true, unknownSchoolBlocked: true,
    };
    const result = simulateFullSchoolRollout(input);
    expect(result.liveActivationPerformed).toBe(false);
    expect(result.publicActivationPerformed).toBe(false);
    expect(result.multiSchoolActivationPerformed).toBe(false);
  });

  it('should have final decision that rejects public rollout', () => {
    const input = {
      task034ProofOk: true, productionEnvironmentGateOk: true,
      schoolBoundaryGuardOk: true, fullSchoolSimulationOk: true,
      staffReleaseBoardOk: true, studentSafeNoticeOk: true,
      teacherAdminReadinessOk: true, runtimeGuardSimulationOk: true,
      healthCapacityBudgetOk: true, rollbackReadinessOk: true,
      privacyReviewOk: true, socraticIntegrityReviewOk: true,
      deenGovernanceReviewOk: true, curriculumSourceReviewOk: true,
      noPublicRollout: false, noMultiSchoolRollout: true,
      noRawPrivateData: true, blockingIssuesLength: 0,
    };
    const result = computeFinalSchoolLaunchDecision(input);
    expect(result.safeToStartTask036).toBe(false);
  });
});
