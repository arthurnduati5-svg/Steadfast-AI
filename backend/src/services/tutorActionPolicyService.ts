import type { TutorActionContext } from './tutorActionContextBuilder';
import type {
  TutorActionType,
  LearnerNeedCategory,
  ActionReasonCode,
} from '../contracts/tutorActionContracts';
import { TUTOR_ACTION_TYPES } from '../contracts/tutorActionContracts';

export interface HardPolicyResult {
  override: boolean;
  selectedAction?: TutorActionType;
  blocked: boolean;
  reasonCodes: string[];
}

export function applyHardPolicyOverrides(ctx: TutorActionContext): HardPolicyResult {
  if (ctx.requestCategory === 'unsafe' || ctx.requestCategory === 'unsafe_request') {
    return { override: true, selectedAction: 'block_unsafe_request', blocked: true, reasonCodes: ['unsafe_content_detected', 'policy_override'] };
  }

  if (ctx.requestCategory === 'answer_key' || ctx.requestCategory === 'answer_key_seeking') {
    return { override: true, selectedAction: 'block_answer_key_request', blocked: true, reasonCodes: ['answer_key_request_detected', 'policy_override'] };
  }

  if (!ctx.approvedContextAvailable) {
    return { override: true, selectedAction: 'safe_content_gap_referral', blocked: false, reasonCodes: ['content_context_missing', 'policy_override'] };
  }

  if (ctx.deenSensitive && !ctx.modeSessionId) {
    return { override: true, selectedAction: 'safe_deen_referral', blocked: false, reasonCodes: ['deen_sensitive_uncertain', 'policy_override'] };
  }

  return { override: false, blocked: false, reasonCodes: [] };
}

export function applyModeRestrictions(ctx: TutorActionContext): {
  allowedActions: TutorActionType[];
  preferredActions: TutorActionType[];
  blockedActions: TutorActionType[];
} {
  const allActions = [...TUTOR_ACTION_TYPES] as TutorActionType[];

  if (!ctx.mode) {
    return { allowedActions: allActions, preferredActions: allActions, blockedActions: [] };
  }

  switch (ctx.mode) {
    case 'focus':
      return {
        allowedActions: allActions.filter(a =>
          !['recommend_video', 'recommend_course_step', 'exit_mode_summary'].includes(a)
        ),
        preferredActions: ['break_into_micro_step', 'give_attention_hint', 'give_direction_hint', 'ask_student_to_try_first'],
        blockedActions: ['recommend_video', 'recommend_course_step'],
      };
    case 'exam':
      return {
        allowedActions: allActions.filter(a =>
          !['ask_next_question', 'continue_current_mode'].includes(a)
        ),
        preferredActions: ['check_foundation', 'repair_misconception', 'check_readiness', 'recommend_revision'],
        blockedActions: ['ask_next_question', 'continue_current_mode', 'recommend_video'],
      };
    case 'quiz':
      return {
        allowedActions: allActions.filter(a =>
          !['give_attention_hint', 'give_direction_hint', 'guided_completion'].includes(a)
        ),
        preferredActions: ['ask_student_to_try_first', 'check_readiness', 'ask_reflection_question'],
        blockedActions: ['guided_completion', 'give_direction_hint', 'recommend_video'],
      };
    case 'teach_back':
      return {
        allowedActions: allActions.filter(a => !['ask_next_question', 'continue_current_mode'].includes(a)),
        preferredActions: ['ask_teach_back', 'ask_clarifying_question', 'repair_misconception', 'summarize_progress'],
        blockedActions: ['ask_next_question', 'recommend_video'],
      };
    case 'revision':
      return {
        allowedActions: allActions,
        preferredActions: ['recommend_revision', 'ask_reflection_question', 'repair_misconception', 'recommend_practice'],
        blockedActions: [],
      };
    default:
      return {
        allowedActions: allActions,
        preferredActions: ['ask_next_question', 'rephrase_question', 'give_direction_hint', 'recommend_revision'],
        blockedActions: [],
      };
  }
}
