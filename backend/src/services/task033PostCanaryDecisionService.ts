import type {
  Task033PostCanaryDecision,
  Task033Task032ProofStatus,
  Task033CanaryObservationConfig,
  Task033AggregateMonitoringSnapshot,
  Task033HealthBudgetReview,
  Task033LearningQualityReview,
  Task033DeenGovernanceReview,
  Task033CurriculumSourceReview,
  Task033PrivacyReview,
  Task033RollbackReadinessReview,
} from '../contracts/task033CanaryObservationContracts';

export interface PostCanaryDecisionInput {
  task032Proof: Task033Task032ProofStatus;
  observationConfig: Task033CanaryObservationConfig;
  aggregateSnapshot?: Task033AggregateMonitoringSnapshot;
  teacherFeedbackReviewOk: boolean;
  studentSafeFeedbackReviewOk: boolean;
  healthBudgetReview: Task033HealthBudgetReview;
  learningQualityReview: Task033LearningQualityReview;
  deenGovernanceReview: Task033DeenGovernanceReview;
  curriculumSourceReview: Task033CurriculumSourceReview;
  privacyReview: Task033PrivacyReview;
  incidentBridgeReview: { ok: boolean; blockingIssues: string[] };
  rollbackReadinessReview: Task033RollbackReadinessReview;
  verificationCommandsPassed: boolean;
}

export interface PostCanaryDecisionOutput {
  decision: Task033PostCanaryDecision;
  safeToStartTask034: boolean;
  blockingIssues: string[];
}

export function computeTask033PostCanaryDecision(input: PostCanaryDecisionInput): PostCanaryDecisionOutput {
  const blockingIssues: string[] = [];

  if (!input.task032Proof.ok) blockingIssues.push('task032_proof_invalid');
  if (!input.observationConfig.envFlagsValid) blockingIssues.push('observation_config_invalid');
  if (input.observationConfig.allowOpenRollout) blockingIssues.push('open_rollout_allowed');
  if (input.observationConfig.allowSchoolWideRollout) blockingIssues.push('school_wide_rollout_allowed');

  if (!input.healthBudgetReview.overallPassed) {
    blockingIssues.push('health_budget_failed');
  }

  if (input.learningQualityReview.blockingIssues.length > 0) {
    blockingIssues.push(...input.learningQualityReview.blockingIssues.map(i => `learning_quality:${i}`));
  }

  if (input.deenGovernanceReview.blockingIssues.length > 0) {
    blockingIssues.push(...input.deenGovernanceReview.blockingIssues.map(i => `deen_governance:${i}`));
  }

  if (input.curriculumSourceReview.blockingIssues.length > 0) {
    blockingIssues.push(...input.curriculumSourceReview.blockingIssues.map(i => `curriculum_source:${i}`));
  }

  if (input.privacyReview.blockingIssues.length > 0) {
    blockingIssues.push(...input.privacyReview.blockingIssues.map(i => `privacy:${i}`));
  }

  if (!input.incidentBridgeReview.ok) {
    blockingIssues.push('incident_bridge_failed');
  }

  if (input.rollbackReadinessReview.blockingIssues.length > 0) {
    blockingIssues.push(...input.rollbackReadinessReview.blockingIssues.map(i => `rollback_readiness:${i}`));
  }

  if (!input.verificationCommandsPassed) {
    blockingIssues.push('verification_commands_not_passed');
  }

  let decision: Task033PostCanaryDecision;

  const hasHardSafetyBlocker = blockingIssues.some(i =>
    i.includes('budget_failed') ||
    i.includes('privacy:') ||
    i.includes('deen_governance:') ||
    i.includes('learning_quality:answer_key') ||
    i.includes('learning_quality:homework_shortcut') ||
    i.includes('curriculum_source:') ||
    i.includes('rollback_readiness:') ||
    i.includes('health_budget_failed') ||
    i.includes('task032_proof_invalid') ||
    i.includes('open_rollout') ||
    i.includes('school_wide_rollout')
  );

  if (hasHardSafetyBlocker) {
    decision = 'not_safe_to_expand';
  } else if (blockingIssues.length > 0) {
    if (blockingIssues.some(i => i.includes('health_budget'))) {
      decision = 'pause_canary';
    } else if (blockingIssues.some(i => i.includes('rollback'))) {
      decision = 'rollback_canary';
    } else if (blockingIssues.some(i => i.includes('teacher_feedback') || i.includes('student_safe_feedback'))) {
      decision = 'continue_observation';
    } else {
      decision = 'hold_canary';
    }
  } else {
    decision = 'safe_to_prepare_next_controlled_rollout_step';
  }

  const safeToStartTask034 = decision === 'safe_to_prepare_next_controlled_rollout_step' &&
    input.task032Proof.ok &&
    input.observationConfig.envFlagsValid &&
    input.healthBudgetReview.overallPassed &&
    input.learningQualityReview.blockingIssues.length === 0 &&
    input.deenGovernanceReview.blockingIssues.length === 0 &&
    input.curriculumSourceReview.blockingIssues.length === 0 &&
    input.privacyReview.blockingIssues.length === 0 &&
    input.incidentBridgeReview.ok &&
    input.rollbackReadinessReview.blockingIssues.length === 0 &&
    input.teacherFeedbackReviewOk &&
    input.studentSafeFeedbackReviewOk &&
    input.verificationCommandsPassed &&
    blockingIssues.length === 0;

  return {
    decision,
    safeToStartTask034,
    blockingIssues,
  };
}
