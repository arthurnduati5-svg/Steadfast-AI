export type MistakeCategory =
  | 'concept_misunderstanding'
  | 'calculation_error'
  | 'reading_misinterpretation'
  | 'vocabulary_gap'
  | 'procedure_step_missed'
  | 'reasoning_gap'
  | 'careless_error'
  | 'source_confusion'
  | 'overgeneralization'
  | 'memorization_without_understanding'
  | 'language_expression_issue'
  | 'deen_source_sensitive_issue'
  | 'unknown';

export interface MistakeAnalysis {
  requestId: string;
  category: MistakeCategory;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  evidence: string[];
  feedbackStrategy: string;
  revisionTag: string;
  practiceRecommendation: string;
}
