import type { Task033AdminReviewItem, Task033PostCanaryDecision, Task033ObservationRole } from '../contracts/task033CanaryObservationContracts';

export interface AdminReviewInput {
  actorRole: Task033ObservationRole;
  actorHash: string;
  canaryRunId: string;
  observationRunId: string;
  task032ProofOk: boolean;
  observationConfigOk: boolean;
  aggregateSnapshotOk: boolean;
  teacherFeedbackOk: boolean;
  studentSafeFeedbackOk: boolean;
  healthBudgetOk: boolean;
  learningQualityOk: boolean;
  deenGovernanceOk: boolean;
  curriculumSourceOk: boolean;
  privacyOk: boolean;
  incidentBridgeOk: boolean;
  rollbackReadinessOk: boolean;
  decision?: Task033PostCanaryDecision;
}

const ADMIN_OPERATOR_ROLES: Task033ObservationRole[] = ['admin', 'operator'];

export function submitAdminReview(input: AdminReviewInput): Task033AdminReviewItem {
  const blockingIssues: string[] = [];

  if (!ADMIN_OPERATOR_ROLES.includes(input.actorRole)) {
    blockingIssues.push('only_admin_or_operator_can_submit_admin_review');
  }

  if (!input.task032ProofOk) blockingIssues.push('task032_proof_not_ok');
  if (!input.observationConfigOk) blockingIssues.push('observation_config_not_ok');
  if (!input.aggregateSnapshotOk) blockingIssues.push('aggregate_snapshot_not_ok');
  if (!input.teacherFeedbackOk) blockingIssues.push('teacher_feedback_not_ok');
  if (!input.studentSafeFeedbackOk) blockingIssues.push('student_safe_feedback_not_ok');
  if (!input.healthBudgetOk) blockingIssues.push('health_budget_not_ok');
  if (!input.learningQualityOk) blockingIssues.push('learning_quality_not_ok');
  if (!input.deenGovernanceOk) blockingIssues.push('deen_governance_not_ok');
  if (!input.curriculumSourceOk) blockingIssues.push('curriculum_source_not_ok');
  if (!input.privacyOk) blockingIssues.push('privacy_not_ok');
  if (!input.incidentBridgeOk) blockingIssues.push('incident_bridge_not_ok');
  if (!input.rollbackReadinessOk) blockingIssues.push('rollback_readiness_not_ok');

  const decision: Task033PostCanaryDecision = input.decision || 'continue_observation';

  return {
    reviewId: `admin_review_task033_safe_${Date.now()}`,
    actorRole: input.actorRole,
    actorHash: input.actorHash,
    canaryRunId: input.canaryRunId,
    observationRunId: input.observationRunId,
    task032ProofReviewed: input.task032ProofOk,
    observationConfigReviewed: input.observationConfigOk,
    aggregateSnapshotReviewed: input.aggregateSnapshotOk,
    teacherFeedbackCategoriesReviewed: input.teacherFeedbackOk,
    studentSafeFeedbackCategoriesReviewed: input.studentSafeFeedbackOk,
    healthBudgetReviewed: input.healthBudgetOk,
    learningQualityReviewed: input.learningQualityOk,
    deenGovernanceReviewed: input.deenGovernanceOk,
    curriculumSourceReviewed: input.curriculumSourceOk,
    privacyReviewed: input.privacyOk,
    incidentBridgeReviewed: input.incidentBridgeOk,
    rollbackReadinessReviewed: input.rollbackReadinessOk,
    blockingIssues,
    decision,
    reviewedAt: new Date().toISOString(),
  };
}

export function isAdminReviewComplete(review: Task033AdminReviewItem): boolean {
  return review.blockingIssues.length === 0;
}
