import type { TutorTurnIntent } from './tutorOrchestrationContracts';
import type { LearningResponsePlan } from './learningResponsePlannerContracts';

export type TutorResponseState =
  | 'awaiting_question'
  | 'clarifying_intent'
  | 'explaining_concept'
  | 'asking_guiding_question'
  | 'waiting_for_attempt'
  | 'checking_attempt'
  | 'correcting_mistake'
  | 'giving_hint'
  | 'generating_practice'
  | 'reviewing_progress'
  | 'safety_support'
  | 'deen_referral'
  | 'source_required_hold'
  | 'blocked_safe_response'
  | 'completed_turn';

const INTENT_TO_INITIAL_STATE: Record<TutorTurnIntent, TutorResponseState> = {
  ask_concept: 'explaining_concept',
  ask_for_hint: 'giving_hint',
  ask_for_final_answer: 'giving_hint',
  submit_attempt: 'checking_attempt',
  ask_for_practice: 'generating_practice',
  ask_for_revision: 'reviewing_progress',
  ask_deen_question: 'deen_referral',
  express_confusion: 'explaining_concept',
  express_frustration: 'giving_hint',
  serious_safety_risk: 'safety_support',
  unknown: 'clarifying_intent',
};

const MOVE_TO_FINAL_STATE: Record<string, TutorResponseState> = {
  clarify_question: 'completed_turn',
  concept_explanation: 'completed_turn',
  socratic_hint: 'asking_guiding_question',
  one_step_guidance: 'asking_guiding_question',
  attempt_feedback: 'waiting_for_attempt',
  mistake_correction: 'correcting_mistake',
  practice_question: 'generating_practice',
  worked_example_different_problem: 'asking_guiding_question',
  revision_prompt: 'reviewing_progress',
  safe_refusal: 'blocked_safe_response',
  deen_referral: 'deen_referral',
  source_check_message: 'source_required_hold',
  safety_support_message: 'safety_support',
  summary_and_next_step: 'completed_turn',
};

export interface StateTransitionInput {
  requestId: string;
  currentState?: string;
  intent: TutorTurnIntent;
  plan: LearningResponsePlan;
}

export interface StateTransitionResult {
  initialState: string;
  finalState: string;
  transitionReason: string;
}

export function transitionState(input: StateTransitionInput): StateTransitionResult {
  const initialState = input.currentState || INTENT_TO_INITIAL_STATE[input.intent] || 'awaiting_question';
  const finalState = MOVE_TO_FINAL_STATE[input.plan.responseMove] || 'completed_turn';

  const transitionReason = `intent=${input.intent}, move=${input.plan.responseMove}: ${input.plan.planReason}`;

  return {
    initialState,
    finalState,
    transitionReason,
  };
}
