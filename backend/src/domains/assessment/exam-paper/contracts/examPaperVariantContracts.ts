export type ExamVariantStatus =
  | 'draft'
  | 'generated'
  | 'review_ready'
  | 'approved'
  | 'blocked'
  | 'archived';

export type ExamVariantStrategy =
  | 'same_questions_reordered'
  | 'equivalent_questions_by_objective'
  | 'difficulty_balanced'
  | 'teacher_manual';

export interface ExamVariant {
  variantId: string;
  schoolId: string;
  paperVersionId: string;
  variantCode: string;
  status: ExamVariantStatus;
  variantStrategy: ExamVariantStrategy;
  questionCount: number;
  totalMarks: number;
  shuffleSections: boolean;
  shuffleQuestionsWithinSections: boolean;
  safeSummary: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
}

export interface ExamVariantQuestion {
  variantQuestionId: string;
  schoolId: string;
  variantId: string;
  paperQuestionId: string;
  questionId: string;
  questionVersionId: string;
  sectionKey: string;
  variantPosition: number;
  marksAllocated: number;
  mappingReason: string;
  createdAt: string;
}
