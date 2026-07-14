export type BreakdownDecision = 'met' | 'partially_met' | 'not_met' | 'uncertain' | 'teacher_required' | 'blocked';
export type SuggestionSource = 'deterministic_rule' | 'rubric_rule' | 'mock_ai_placeholder' | 'teacher_seed';
export type SuggestionStatus = 'suggested' | 'accepted_by_teacher' | 'rejected_by_teacher' | 'expired' | 'blocked';

export interface MarkingBreakdownItem {
  breakdownItemId: string;
  schoolId: string;
  markingResultVersionId: string;
  criterionKey: string;
  criterionLabel: string;
  marksAwarded: number;
  marksAvailable: number;
  confidence: number;
  decision: string;
  safeReason: string;
  teacherOnlyNotes: string;
  createdAt: string;
}

export interface ScoringSuggestion {
  scoringSuggestionId: string;
  schoolId: string;
  markingResultVersionId: string;
  suggestionSource: string;
  status: string;
  suggestedMarks: number;
  confidence: number;
  safeRationale: string;
  reviewRequired: boolean;
  reasonCodesJson?: string[];
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  decidedByActorId?: string;
}

export interface MarkingInputSnapshot {
  snapshot: import('./markingContracts').SubmittedAnswerSnapshot;
  answerKeyRef?: string;
  rubricRef?: string;
  expectedOptionKey?: string;
  expectedNumericValue?: number;
  expectedMatchingPairs?: Record<string, string>;
  expectedFillBlankAnswers?: string[];
  allowedTolerance?: number;
}
