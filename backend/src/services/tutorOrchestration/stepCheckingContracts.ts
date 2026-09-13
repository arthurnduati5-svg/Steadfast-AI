export type StepCheckStatus =
  | 'correct'
  | 'partially_correct'
  | 'incorrect'
  | 'unclear'
  | 'needs_source_check'
  | 'needs_teacher_or_scholar';

export interface StepCheckResult {
  requestId: string;
  status: StepCheckStatus;
  checkedAspect: string;
  reasoning: string;
  nextStepSuggestion: string;
  shouldRevealFinalAnswer: boolean;
  validationModesUsed: string[];
}
