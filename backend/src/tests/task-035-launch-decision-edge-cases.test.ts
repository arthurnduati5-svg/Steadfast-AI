import { describe, it, expect } from 'vitest';
import { computeFinalSchoolLaunchDecision } from '../services/task035FinalSchoolLaunchDecisionService';

describe('task035 launch decision edge cases', () => {
  const passInput = {
    task034ProofOk: true, productionEnvironmentGateOk: true, schoolBoundaryGuardOk: true,
    fullSchoolSimulationOk: true, staffReleaseBoardOk: true, studentSafeNoticeOk: true,
    teacherAdminReadinessOk: true, runtimeGuardSimulationOk: true, healthCapacityBudgetOk: true,
    rollbackReadinessOk: true, privacyReviewOk: true, socraticIntegrityReviewOk: true,
    deenGovernanceReviewOk: true, curriculumSourceReviewOk: true,
    noPublicRollout: true, noMultiSchoolRollout: true, noRawPrivateData: true, blockingIssuesLength: 0,
  };

  it('all gates safe yields safe_to_prepare_school_launch', () => {
    const result = computeFinalSchoolLaunchDecision(passInput);
    expect(result.finalDecision).toBe('TASK_035_PASS_SAFE_TO_START_TASK_036');
    expect(result.safeToStartTask036).toBe(true);
  });

  it('task034 proof fail blocks acceptance', () => {
    const r = computeFinalSchoolLaunchDecision({ ...passInput, task034ProofOk: false });
    expect(r.safeToStartTask036).toBe(false);
    expect(r.blockingIssues).toContain('task034_proof_not_ok');
  });

  it('production environment gate fail blocks acceptance', () => {
    const r = computeFinalSchoolLaunchDecision({ ...passInput, productionEnvironmentGateOk: false });
    expect(r.safeToStartTask036).toBe(false);
    expect(r.blockingIssues).toContain('production_environment_gate_not_ok');
  });

  it('school boundary fail blocks acceptance', () => {
    const r = computeFinalSchoolLaunchDecision({ ...passInput, schoolBoundaryGuardOk: false });
    expect(r.safeToStartTask036).toBe(false);
    expect(r.blockingIssues).toContain('school_boundary_guard_not_ok');
  });

  it('simulation fail blocks acceptance', () => {
    const r = computeFinalSchoolLaunchDecision({ ...passInput, fullSchoolSimulationOk: false });
    expect(r.safeToStartTask036).toBe(false);
    expect(r.blockingIssues).toContain('full_school_simulation_not_ok');
  });

  it('public rollout blocks acceptance', () => {
    const r = computeFinalSchoolLaunchDecision({ ...passInput, noPublicRollout: false });
    expect(r.safeToStartTask036).toBe(false);
    expect(r.blockingIssues).toContain('public_rollout_enabled');
  });

  it('raw private data exposed blocks acceptance', () => {
    const r = computeFinalSchoolLaunchDecision({ ...passInput, noRawPrivateData: false });
    expect(r.safeToStartTask036).toBe(false);
    expect(r.blockingIssues).toContain('raw_private_data_exposed');
  });

  it('non-zero blocking issues length blocks acceptance', () => {
    const r = computeFinalSchoolLaunchDecision({ ...passInput, blockingIssuesLength: 1 });
    expect(r.safeToStartTask036).toBe(false);
  });

  it('multiple failures produce multiple blocking issues', () => {
    const r = computeFinalSchoolLaunchDecision({
      ...passInput, schoolBoundaryGuardOk: false, privacyReviewOk: false,
    });
    expect(r.blockingIssues.length).toBeGreaterThanOrEqual(2);
    expect(r.finalDecision).toBe('TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036');
  });
});
