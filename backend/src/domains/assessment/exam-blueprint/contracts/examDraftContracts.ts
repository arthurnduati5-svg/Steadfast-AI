export type DraftSetStatus =
  | 'draft' | 'generating' | 'ready_for_teacher_review' | 'partially_ready'
  | 'blocked' | 'failed' | 'cancelled';

export type DraftStatus =
  | 'candidate' | 'recommended' | 'needs_review' | 'blocked' | 'rejected' | 'selected';

export interface ExamDraftSet {
  draftSetId: string;
  schoolId: string;
  blueprintId: string;
  blueprintVersionId: string;
  status: DraftSetStatus;
  requestedDraftCount: number;
  generatedDraftCount: number;
  selectionStrategy: string;
  createdByActorId: string;
  createdByRole: string;
  safeSummary: string;
  coverageGapSummary: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ExamDraft {
  draftId: string;
  draftSetId: string;
  schoolId: string;
  blueprintId: string;
  blueprintVersionId: string;
  rank: number;
  status: DraftStatus;
  draftTitle: string;
  totalMarks: number;
  estimatedDurationMinutes: number;
  questionCount: number;
  coverageScore: number;
  difficultyBalanceScore: number;
  securityScore: number;
  freshnessScore: number;
  overallScore: number;
  recommendationReason: string;
  safeTeacherSummary: string;
  differenceFromPreviousDraft: string;
  warningCodesJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamDraftQuestion {
  draftQuestionId: string;
  draftId: string;
  schoolId: string;
  questionId: string;
  questionVersionId: string;
  position: number;
  sectionKey: string;
  marksAllocated: number;
  selectionReason: string;
  requirementId: string;
  coverageTagsJson: string;
  warningCodesJson: string;
  createdAt: string;
}

export interface DraftGenerationResult {
  draftSet: ExamDraftSet;
  drafts: ExamDraft[];
  questions: ExamDraftQuestion[];
  coverageGaps: import('./examBlueprintContracts').BlueprintCoverageGap[];
}

export interface DraftRecommendationSummary {
  draftId: string;
  rank: number;
  overallScore: number;
  coverageScore: number;
  difficultyBalanceScore: number;
  securityScore: number;
  freshnessScore: number;
  recommendationReason: string;
  safeTeacherSummary: string;
  differenceFromPreviousDraft: string;
  warningCodes: string[];
}
