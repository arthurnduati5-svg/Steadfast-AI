import type { Task034ExpandedRuntimeGuardResult } from '../contracts/task034ControlledLimitedRolloutContracts';

export function evaluateTask034ExpandedRuntimeGuard(input?: Partial<Task034ExpandedRuntimeGuardResult>): Task034ExpandedRuntimeGuardResult {
  const defaults: Task034ExpandedRuntimeGuardResult = {
    ok: true,
    verifiedSchoolContextRequired: true,
    task033AcceptedProofRequired: true,
    approvedSchoolConfigRequired: true,
    approvedContentContextRequired: true,
    learnerMemoryBlockedBeforeSchoolContext: true,
    aiBlockedBeforeAllGates: true,
    liveAiBlocked: true,
    liveConnectorBlocked: true,
    liveNotificationsBlocked: true,
    crossSchoolAccessBlocked: true,
    crossLearnerVisibilityBlocked: true,
    parentRawDetailBlocked: true,
    teacherOnlyLeakageBlocked: true,
    unsafeDeenAuthorityBlocked: true,
    answerBotBehaviorBlocked: true,
    blockingIssues: [],
  };

  const resolved = { ...defaults, ...input };
  const blockingIssues: string[] = [];

  if (!resolved.verifiedSchoolContextRequired) blockingIssues.push('verified_school_context_not_required');
  if (!resolved.task033AcceptedProofRequired) blockingIssues.push('task033_accepted_proof_not_required');
  if (!resolved.approvedSchoolConfigRequired) blockingIssues.push('approved_school_config_not_required');
  if (!resolved.approvedContentContextRequired) blockingIssues.push('approved_content_context_not_required');
  if (!resolved.learnerMemoryBlockedBeforeSchoolContext) blockingIssues.push('learner_memory_not_blocked_before_school_context');
  if (!resolved.aiBlockedBeforeAllGates) blockingIssues.push('ai_not_blocked_before_all_gates');
  if (!resolved.liveAiBlocked) blockingIssues.push('live_ai_not_blocked');
  if (!resolved.liveConnectorBlocked) blockingIssues.push('live_connector_not_blocked');
  if (!resolved.liveNotificationsBlocked) blockingIssues.push('live_notifications_not_blocked');
  if (!resolved.crossSchoolAccessBlocked) blockingIssues.push('cross_school_access_not_blocked');
  if (!resolved.crossLearnerVisibilityBlocked) blockingIssues.push('cross_learner_visibility_not_blocked');
  if (!resolved.parentRawDetailBlocked) blockingIssues.push('parent_raw_detail_not_blocked');
  if (!resolved.teacherOnlyLeakageBlocked) blockingIssues.push('teacher_only_leakage_not_blocked');
  if (!resolved.unsafeDeenAuthorityBlocked) blockingIssues.push('unsafe_deen_authority_not_blocked');
  if (!resolved.answerBotBehaviorBlocked) blockingIssues.push('answer_bot_behavior_not_blocked');

  return {
    ...resolved,
    ok: blockingIssues.length === 0,
    blockingIssues,
  };
}
