import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 035 - Runner Contract', () => {
  it('should have scenario runner script that validates env flags', () => {
    const runnerPath = path.resolve(__dirname, '../../../scripts/run-task035-school-wide-readiness.cjs');
    expect(fs.existsSync(runnerPath)).toBe(true);

    const content = fs.readFileSync(runnerPath, 'utf8');
    expect(content).toContain('TASK035_SCHOOL_WIDE_READINESS');
    expect(content).toContain('TASK035_REQUIRE_TASK034_PROOF');
    expect(content).toContain('TASK035_NO_PUBLIC_ROLLOUT');
    expect(content).toContain('TASK035_NO_MULTI_SCHOOL_ROLLOUT');
    expect(content).toContain('TASK035_PRIVACY_SAFE_EVIDENCE');
    expect(content).toContain('TASK035_REQUIRE_RELEASE_BOARD');
    expect(content).toContain('TASK035_REQUIRE_ROLLBACK_READY');
    expect(content).toContain('TASK035_FULL_SCHOOL_SIMULATION_ONLY');
  });

  it('should produce school-wide-readiness-result.json with required fields', () => {
    const resultPath = path.resolve(__dirname, '../../../logs/task-035/school-wide-readiness-result.json');

    if (fs.existsSync(resultPath)) {
      const raw = fs.readFileSync(resultPath, 'utf8').replace(/^\uFEFF/, '');
      const result = JSON.parse(raw);

      expect(result.scenarioRun).toBeDefined();
      expect(result.scenarioMode).toBeDefined();
      expect(result.task034ProofLoaded).toBeDefined();
      expect(result.productionEnvironmentGatePassed).toBeDefined();
      expect(result.approvedSchoolBoundaryPassed).toBeDefined();
      expect(result.fullSchoolRosterSimulated).toBeDefined();
      expect(result.simulatedCoveragePercent).toBeDefined();
      expect(result.liveActivationPerformed).toBeDefined();
      expect(result.publicActivationPerformed).toBeDefined();
      expect(result.multiSchoolActivationPerformed).toBeDefined();
      expect(result.crossSchoolAccessBlocked).toBeDefined();
      expect(result.staffReleaseBoardPassed).toBeDefined();
      expect(result.studentSafeNoticeReady).toBeDefined();
      expect(result.teacherAdminReadinessPassed).toBeDefined();
      expect(result.runtimeGuardPassed).toBeDefined();
      expect(result.healthCapacityBudgetPassed).toBeDefined();
      expect(result.rollbackReadinessPassed).toBeDefined();
      expect(result.privacyReviewPassed).toBeDefined();
      expect(result.socraticIntegrityPassed).toBeDefined();
      expect(result.deenGovernancePassed).toBeDefined();
      expect(result.curriculumSourcePassed).toBeDefined();
      expect(result.finalLaunchDecision).toBeDefined();
      expect(result.safeToStartTask036).toBeDefined();
      expect(Array.isArray(result.blockingIssues)).toBe(true);
    }
  });
});
