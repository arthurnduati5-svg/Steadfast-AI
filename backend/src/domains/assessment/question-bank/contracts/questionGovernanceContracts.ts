export interface QuestionCurriculumValidity {
  questionVersionId: string;
  schoolId: string;
  curriculumVersionId: string;
  objectiveIds: string[];
  valid: boolean;
  reasonCodes: string[];
  checkedAt: string;
}

export type UsageMode =
  | 'practice'
  | 'quiz'
  | 'exam'
  | 'revision'
  | 'teacher_review'
  | 'diagnostic'
  | 'oral';

export interface QuestionUsageEligibility {
  questionVersionId: string;
  usageMode: UsageMode;
  eligible: boolean;
  reasonCodes: string[];
  checkedAt: string;
}

export type ContentSafetyReviewState =
  | 'not_reviewed'
  | 'approved'
  | 'flagged'
  | 'rejected';

export interface ContentSafetyReview {
  reviewId: string;
  questionVersionId: string;
  reviewState: ContentSafetyReviewState;
  reviewedByActorId: string | null;
  reviewedByRole: string | null;
  reviewedAt: string | null;
  decision: string;
  reasonCodes: string[];
  safeNotes: string | null;
  createdAt: string;
}
