export type HintLevel =
  | 'level_0_clarify_problem'
  | 'level_1_remind_concept'
  | 'level_2_point_to_first_step'
  | 'level_3_give_partial_structure'
  | 'level_4_check_attempt'
  | 'level_5_explain_mistake_without_final_answer';

export interface SocraticHint {
  requestId: string;
  hintLevel: HintLevel;
  hintText: string;
  guidingQuestion: string;
  revealsFinalAnswer: boolean;
  nextLearnerAction: string;
}
