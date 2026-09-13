export type PracticeQuestionType =
  | 'similar_question'
  | 'easier_question'
  | 'harder_question'
  | 'mixed_review_question'
  | 'concept_check'
  | 'retrieval_practice'
  | 'deen_reflection_question'
  | 'language_expression_question';

export interface PracticeQuestionPlan {
  requestId: string;
  questionType: PracticeQuestionType;
  questionText: string;
  targetSkill: string;
  expectedValidationMode: string;
  answerHidden: boolean;
  followUpPrompt: string;
}
