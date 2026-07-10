import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const RESULT_PATH = path.join(ROOT, 'logs/task-034/controlled-rollout-result.json');

describe('Task034ControlledRolloutRunner', () => {
  it('should have generated controlled-rollout-result.json', () => {
    expect(fs.existsSync(RESULT_PATH)).toBe(true);
  });

  it('should have valid JSON with all required fields', () => {
    const raw = fs.readFileSync(RESULT_PATH, 'utf8').replace(/^\uFEFF/, '');
    const result = JSON.parse(raw);

    expect(result.scenarioRun).toBe(true);
    expect(result.scenarioMode).toBe('controlled_limited_rollout');
    expect(result.task033ProofLoaded).toBe(true);
    expect(result.controlledRolloutConfigPassed).toBe(true);
    expect(result.rolloutCapPassed).toBe(true);
    expect(result.expandedCohortEligibilityPassed).toBe(true);
    expect(result.staffReadinessPassed).toBe(true);
    expect(result.learnerNoticeReadinessPassed).toBe(true);
    expect(result.activationStateMachinePassed).toBe(true);
    expect(result.expandedRuntimeGuardPassed).toBe(true);
    expect(result.expandedPrivacyBoundaryPassed).toBe(true);
    expect(result.healthBudgetPassed).toBe(true);
    expect(result.canaryBaselineComparisonPassed).toBe(true);
    expect(result.expandedMonitoringSnapshotCaptured).toBe(true);
    expect(result.teacherAdminReviewPassed).toBe(true);
    expect(result.studentSafeFeedbackContinuationPassed).toBe(true);
    expect(result.incidentRollbackBridgePassed).toBe(true);
    expect(result.pauseBlocksRuntime).toBe(true);
    expect(result.killSwitchBlocksRuntime).toBe(true);
    expect(result.rollbackBlocksRuntime).toBe(true);
    expect(result.socraticIntegrityPassed).toBe(true);
    expect(result.deenGovernancePassed).toBe(true);
    expect(result.curriculumSourcePassed).toBe(true);
    expect(result.teacherRoleBoundaryPassed).toBe(true);
    expect(result.studentRoleBoundaryPassed).toBe(true);
    expect(result.unknownRoleDenied).toBe(true);
    expect(result.openRolloutPerformed).toBe(false);
    expect(result.schoolWideRolloutPerformed).toBe(false);
    expect(result.hundredPercentRolloutPerformed).toBe(false);
    expect(result.rolloutPercent).toBeLessThanOrEqual(25);
    expect(result.rawPrivateDataExposed).toBe(false);
    expect(result.postLimitedRolloutDecision).toBe('safe_to_prepare_next_rollout_stage');
    expect(result.safeToStartTask035).toBe(true);
    expect(Array.isArray(result.blockingIssues)).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });
});
