import { describe, it, expect } from 'vitest';
import { evaluateTeacherAdminReview } from '../services/task034TeacherAdminReviewService';

describe('Task034TeacherAdminReview', () => {
  it('should pass for admin with all items reviewed', () => {
    const result = evaluateTeacherAdminReview({
      actorRole: 'admin',
      actorHash: 'admin_hash_task034_safe_001',
      task033ProofReviewed: true,
      controlledRolloutConfigReviewed: true,
      rolloutCapReviewed: true,
      expandedCohortEligibilityReviewed: true,
      staffReadinessReviewed: true,
      learnerNoticeReadinessReviewed: true,
      activationStateMachineReviewed: true,
      expandedRuntimeGuardReviewed: true,
      expandedPrivacyBoundaryReviewed: true,
      healthBudgetReviewed: true,
      canaryBaselineComparisonReviewed: true,
      expandedMonitoringSnapshotReviewed: true,
      socraticIntegrityReviewed: true,
      deenGovernanceReviewed: true,
      curriculumSourceReviewed: true,
      incidentEscalationBridgeReviewed: true,
      rollbackProofReviewed: true,
    });

    expect(result.ok).toBe(true);
    expect(result.teacherSafeSummaryOnly).toBe(false);
    expect(result.rawPrivateDataExposed).toBe(false);
    expect(result.blockingIssues).toEqual([]);
  });

  it('should pass for operator with all items reviewed', () => {
    const result = evaluateTeacherAdminReview({
      actorRole: 'operator',
      actorHash: 'operator_hash_task034_safe_001',
      task033ProofReviewed: true,
      controlledRolloutConfigReviewed: true,
      rolloutCapReviewed: true,
      expandedCohortEligibilityReviewed: true,
      staffReadinessReviewed: true,
      learnerNoticeReadinessReviewed: true,
      activationStateMachineReviewed: true,
      expandedRuntimeGuardReviewed: true,
      expandedPrivacyBoundaryReviewed: true,
      healthBudgetReviewed: true,
      canaryBaselineComparisonReviewed: true,
      expandedMonitoringSnapshotReviewed: true,
      socraticIntegrityReviewed: true,
      deenGovernanceReviewed: true,
      curriculumSourceReviewed: true,
      incidentEscalationBridgeReviewed: true,
      rollbackProofReviewed: true,
    });

    expect(result.ok).toBe(true);
  });

  it('should set teacherSafeSummaryOnly for teacher', () => {
    const result = evaluateTeacherAdminReview({
      actorRole: 'teacher',
      actorHash: 'teacher_hash_task034_safe_001',
      task033ProofReviewed: true,
      controlledRolloutConfigReviewed: true,
      rolloutCapReviewed: true,
      expandedCohortEligibilityReviewed: true,
      staffReadinessReviewed: true,
      learnerNoticeReadinessReviewed: true,
      activationStateMachineReviewed: true,
      expandedRuntimeGuardReviewed: true,
      expandedPrivacyBoundaryReviewed: true,
      healthBudgetReviewed: true,
      canaryBaselineComparisonReviewed: true,
      expandedMonitoringSnapshotReviewed: true,
      socraticIntegrityReviewed: true,
      deenGovernanceReviewed: true,
      curriculumSourceReviewed: true,
      incidentEscalationBridgeReviewed: true,
      rollbackProofReviewed: true,
    });

    expect(result.teacherSafeSummaryOnly).toBe(true);
  });

  it('should deny student from performing review', () => {
    const result = evaluateTeacherAdminReview({
      actorRole: 'student',
      actorHash: 'student_hash_task034_safe_001',
      task033ProofReviewed: true,
      controlledRolloutConfigReviewed: true,
      rolloutCapReviewed: true,
      expandedCohortEligibilityReviewed: true,
      staffReadinessReviewed: true,
      learnerNoticeReadinessReviewed: true,
      activationStateMachineReviewed: true,
      expandedRuntimeGuardReviewed: true,
      expandedPrivacyBoundaryReviewed: true,
      healthBudgetReviewed: true,
      canaryBaselineComparisonReviewed: true,
      expandedMonitoringSnapshotReviewed: true,
      socraticIntegrityReviewed: true,
      deenGovernanceReviewed: true,
      curriculumSourceReviewed: true,
      incidentEscalationBridgeReviewed: true,
      rollbackProofReviewed: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('STUDENT_CANNOT_PERFORM_REVIEW');
  });

  it('should deny unknown role', () => {
    const result = evaluateTeacherAdminReview({
      actorRole: 'unknown',
      actorHash: 'unknown',
      task033ProofReviewed: true,
      controlledRolloutConfigReviewed: true,
      rolloutCapReviewed: true,
      expandedCohortEligibilityReviewed: true,
      staffReadinessReviewed: true,
      learnerNoticeReadinessReviewed: true,
      activationStateMachineReviewed: true,
      expandedRuntimeGuardReviewed: true,
      expandedPrivacyBoundaryReviewed: true,
      healthBudgetReviewed: true,
      canaryBaselineComparisonReviewed: true,
      expandedMonitoringSnapshotReviewed: true,
      socraticIntegrityReviewed: true,
      deenGovernanceReviewed: true,
      curriculumSourceReviewed: true,
      incidentEscalationBridgeReviewed: true,
      rollbackProofReviewed: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('ROLE_NOT_AUTHORIZED_FOR_REVIEW');
  });
});
