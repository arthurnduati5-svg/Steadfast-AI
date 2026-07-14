export interface SafeMarkingProjection {
  markingResultVersionId: string;
  status: string;
  marksAwarded: number;
  marksAvailable: number;
  safeStudentFeedback: string;
  questionType: string;
  createdAt: string;
}

export interface TeacherMarkingProjection {
  markingResultVersionId: string;
  markingRunId: string;
  questionId: string;
  questionVersionId: string;
  status: string;
  questionType: string;
  markingMethod: string;
  marksAwarded: number;
  marksAvailable: number;
  confidence: number;
  requiresTeacherReview: boolean;
  reviewReasonCode: string;
  safeStudentFeedback: string;
  safeTeacherSummary: string;
  rubricVersionId?: string;
  answerKeyVersionId?: string;
  createdByActorId: string;
  createdAt: string;
}

export interface StudentMarkingProjection {
  markingResultVersionId: string;
  status: string;
  marksAwarded: number;
  marksAvailable: number;
  safeStudentFeedback: string;
  requiresTeacherReview: boolean;
  createdAt: string;
}

export interface ParentMarkingProjection {
  markingResultVersionId: string;
  status: string;
  marksAwarded: number;
  marksAvailable: number;
  safeStudentFeedback: string;
  createdAt: string;
}
