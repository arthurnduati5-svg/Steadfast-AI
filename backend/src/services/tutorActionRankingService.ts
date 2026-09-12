import type { TutorActionContext } from './tutorActionContextBuilder';
import type { TutorActionType, LearnerNeedCategory, ActionReasonCode } from '../contracts/tutorActionContracts';
import { TUTOR_ACTION_TYPES } from '../contracts/tutorActionContracts';
import { applyHardPolicyOverrides, applyModeRestrictions } from './tutorActionPolicyService';
import { selectHintLevelForAction } from './hintLadderEngineService';

export interface ScoredAction {
  action: TutorActionType;
  score: number;
  reasonCodes: string[];
}

export interface RankingOutput {
  selectedAction: TutorActionType;
  rankedActions: ScoredAction[];
  hintLevel?: string;
  supportLevel: string;
  reasonCodes: string[];
  confidenceScore: number;
}

const LEARNER_ACTION_MAP: Partial<Record<LearnerNeedCategory, TutorActionType[]>> = {
  no_attempt_yet: ['ask_student_to_try_first', 'ask_next_question', 'ask_clarifying_question'],
  first_attempt_needed: ['ask_student_to_try_first', 'ask_next_question'],
  partially_correct: ['ask_reflection_question', 'give_direction_hint', 'rephrase_question'],
  incorrect_conceptual: ['repair_misconception', 'give_micro_example', 'break_into_micro_step'],
  incorrect_procedural: ['break_into_micro_step', 'give_direction_hint', 'give_attention_hint'],
  careless_error: ['give_attention_hint', 'ask_reflection_question'],
  prerequisite_gap: ['check_foundation', 'give_micro_example', 'recommend_revision'],
  language_confusion: ['rephrase_question', 'simplify_concept', 'ask_clarifying_question'],
  repeated_same_mistake: ['rephrase_question', 'break_into_micro_step', 'repair_misconception'],
  high_hint_dependency: ['ask_teach_back', 'break_into_micro_step', 'ask_reflection_question'],
  stuck_without_recovery: ['give_direction_hint', 'break_into_micro_step', 'give_micro_example'],
  recovering_after_hint: ['ask_reflection_question', 'ask_student_to_try_first'],
  ready_for_challenge: ['recommend_practice', 'check_readiness', 'ask_next_question'],
  ready_for_teach_back: ['ask_teach_back', 'summarize_progress'],
  needs_revision: ['recommend_revision', 'recommend_practice', 'check_foundation'],
  needs_practice: ['recommend_practice', 'check_readiness'],
  needs_teacher_support: ['recommend_teacher_support'],
  answer_key_seeking: ['block_answer_key_request'],
  unsafe_request: ['block_unsafe_request'],
  content_context_missing: ['safe_content_gap_referral'],
  deen_sensitive_uncertain: ['safe_deen_referral'],
  off_topic: ['ask_clarifying_question', 'rephrase_question'],
  low_confidence_profile: ['ask_next_question', 'ask_student_to_try_first', 'summarize_progress'],
  no_data_yet: ['ask_next_question', 'ask_student_to_try_first', 'ask_clarifying_question'],
};

export function rankActions(ctx: TutorActionContext, learnerNeed: LearnerNeedCategory): RankingOutput {
  const hardOverride = applyHardPolicyOverrides(ctx);
  if (hardOverride.override && hardOverride.selectedAction) {
    const selected = hardOverride.selectedAction;
    return {
      selectedAction: selected,
      rankedActions: [{ action: selected, score: 100, reasonCodes: hardOverride.reasonCodes }],
      hintLevel: undefined,
      supportLevel: hardOverride.blocked ? 'minimal' : 'moderate',
      reasonCodes: hardOverride.reasonCodes,
      confidenceScore: 1.0,
    };
  }

  const { allowedActions, preferredActions } = applyModeRestrictions(ctx);

  const candidateActions = LEARNER_ACTION_MAP[learnerNeed] ?? ['ask_next_question', 'ask_clarifying_question'];

  const scored: ScoredAction[] = candidateActions
    .filter(a => allowedActions.includes(a))
    .map(action => {
      let score = 0.5;

      if (preferredActions.includes(action)) score += 0.3;

      if (action === 'block_answer_key_request' || action === 'block_unsafe_request') score -= 0.5;

      if (action === 'ask_student_to_try_first' && ctx.attemptCount > 0) score -= 0.2;
      if ((action === 'give_direction_hint' || action === 'give_attention_hint') && ctx.hintCount > 3) score -= 0.2;

      if (action === 'recommend_revision' && ctx.masteryLevel === 'strong') score -= 0.3;
      if (action === 'recommend_practice' && ctx.masteryLevel === 'emerging') score -= 0.1;
      if (action === 'repair_misconception' && ctx.mistakeCategory === 'conceptual') score += 0.2;
      if (action === 'break_into_micro_step' && ctx.mistakeCategory === 'procedural') score += 0.2;
      if (action === 'give_attention_hint' && ctx.mistakeCategory === 'careless') score += 0.2;
      if (action === 'ask_teach_back' && ctx.highHintDependency) score += 0.2;

      if (action === 'rephrase_question' && ctx.mistakeCategory === 'language_barrier') score += 0.2;
      if (action === 'recommend_teacher_support' && ctx.stuckCount > 5) score += 0.3;

      const reasonCodes: string[] = ['socratic_support'];
      if (preferredActions.includes(action)) reasonCodes.push('mode_aware_preference');
      if (action.startsWith('block_')) reasonCodes.push('policy_override');

      return { action, score, reasonCodes };
    });

  scored.sort((a, b) => b.score - a.score);

  const selected = scored.length > 0 ? scored[0].action : 'ask_next_question';

  const hintLevel = selected.startsWith('give_') || selected.startsWith('break_') || selected === 'guided_completion'
    ? selectHintLevelForAction(ctx, learnerNeed)
    : undefined;

  const supportLevel = deriveSupportLevel(selected, learnerNeed, ctx);

  return {
    selectedAction: selected,
    rankedActions: scored,
    hintLevel,
    supportLevel,
    reasonCodes: scored.length > 0 ? scored[0].reasonCodes : ['empty_state_default'],
    confidenceScore: scored.length > 0 ? Math.min(0.5 + scored[0].score, 1.0) : 0.3,
  };
}

function deriveSupportLevel(
  action: TutorActionType,
  learnerNeed: LearnerNeedCategory,
  ctx: TutorActionContext,
): string {
  if (action === 'block_answer_key_request' || action === 'block_unsafe_request') return 'minimal';
  if (action === 'safe_content_gap_referral' || action === 'safe_deen_referral') return 'low';
  if (action === 'recommend_teacher_support') return 'teacher_referral';
  if (action === 'guided_completion') return 'high';
  if (action === 'give_micro_example' || action === 'repair_misconception') return 'moderate';
  if (action === 'break_into_micro_step') return 'moderate';
  if (action.startsWith('give_') || action.startsWith('ask_')) return 'low';
  if (action.startsWith('recommend_')) return 'low';
  return 'low';
}
