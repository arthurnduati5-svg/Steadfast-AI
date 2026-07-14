export type SelectionRunStatus =
  | 'started' | 'completed' | 'partial' | 'blocked' | 'failed' | 'cancelled';

export interface QuestionSelectionRun {
  selectionRunId: string;
  schoolId: string;
  blueprintId: string;
  blueprintVersionId: string;
  draftSetId: string;
  status: SelectionRunStatus;
  strategy: string;
  candidatePoolSize: number;
  eligiblePoolSize: number;
  selectedCount: number;
  rejectedCount: number;
  gapCount: number;
  safeSummary: string;
  createdAt: string;
  completedAt: string | null;
}

export interface QuestionSelectionCandidate {
  selectionCandidateId: string;
  selectionRunId: string;
  schoolId: string;
  questionId: string;
  questionVersionId: string;
  eligible: boolean;
  selected: boolean;
  rejectionReasonCode: string;
  score: number;
  coverageContributionJson: string;
  riskFlagsJson: string;
  createdAt: string;
}
