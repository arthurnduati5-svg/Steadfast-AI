import { describe, it, expect } from 'vitest';
import { computeTask034PostLimitedRolloutDecision } from '../services/task034PostLimitedRolloutDecisionService';
import type { PostLimitedRolloutDecisionInput } from '../services/task034PostLimitedRolloutDecisionService';

function allPassedInput(overrides?: Partial<PostLimitedRolloutDecisionInput>): PostLimitedRolloutDecisionInput {
  return {
    runtimeGuardPassed: true,
    healthBudgetPassed: true,
    incidentEscalationPassed: true,
    rollbackProtectionPassed: true,
    privacyReviewPassed: true,
    contentGovernanceReviewPassed: true,
    socraticIntegrityReviewPassed: true,
    deenBoundaryReviewPassed: true,
    schoolIdentityReviewPassed: true,
    crossSchoolDenialReviewPassed: true,
    staffReadinessPassed: true,
    learnerNoticeReadinessPassed: true,
    diagnosticsPassed: true,
    ...overrides,
  };
}

describe('Task034PostLimitedRolloutDecision', () => {
  it('all gates passed returns safeToStartTask035 true', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput());
    expect(result.safeToStartTask035).toBe(true);
    expect(result.finalDecision).toBe('TASK_034_PASS_SAFE_TO_START_TASK_035');
    expect(result.remainingBlockers).toHaveLength(0);
  });

  it('safeToStartTask040 is always false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput());
    expect(result.safeToStartTask040).toBe(false);
  });

  it('safeToStartTask040 is false even when all gates pass', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput());
    expect(result.safeToStartTask040).toBe(false);
  });

  it('runtime guard failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ runtimeGuardPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.finalDecision).toBe('TASK_034_BLOCKED');
    expect(result.remainingBlockers).toContain('runtime_guard_not_passed');
  });

  it('health budget failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ healthBudgetPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('health_budget_not_passed');
  });

  it('incident escalation failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ incidentEscalationPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('incident_escalation_not_passed');
  });

  it('rollback protection failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ rollbackProtectionPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('rollback_protection_not_passed');
  });

  it('privacy review failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ privacyReviewPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('privacy_review_not_passed');
  });

  it('content governance failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ contentGovernanceReviewPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('content_governance_review_not_passed');
  });

  it('socratic integrity failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ socraticIntegrityReviewPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('socratic_integrity_review_not_passed');
  });

  it('deen boundary failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ deenBoundaryReviewPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('deen_boundary_review_not_passed');
  });

  it('school identity failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ schoolIdentityReviewPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('school_identity_review_not_passed');
  });

  it('cross school denial failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ crossSchoolDenialReviewPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('cross_school_denial_review_not_passed');
  });

  it('staff readiness failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ staffReadinessPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('staff_readiness_not_passed');
  });

  it('learner notice readiness failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ learnerNoticeReadinessPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('learner_notice_readiness_not_passed');
  });

  it('diagnostics failure returns safeToStartTask035 false', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({ diagnosticsPassed: false }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toContain('diagnostics_not_passed');
  });

  it('remains blocked when multiple gates fail', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput({
      runtimeGuardPassed: false,
      privacyReviewPassed: false,
      deenBoundaryReviewPassed: false,
    }));
    expect(result.safeToStartTask035).toBe(false);
    expect(result.remainingBlockers).toHaveLength(3);
    expect(result.remainingBlockers).toContain('runtime_guard_not_passed');
    expect(result.remainingBlockers).toContain('privacy_review_not_passed');
    expect(result.remainingBlockers).toContain('deen_boundary_review_not_passed');
  });

  it('includes a generatedAt timestamp', () => {
    const result = computeTask034PostLimitedRolloutDecision(allPassedInput());
    expect(result.generatedAt).toBeDefined();
    expect(typeof result.generatedAt).toBe('string');
    expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
  });
});
