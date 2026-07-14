export type ExamAnswerSubmissionStatus =
  | 'draft_saved'
  | 'submitted'
  | 'withdrawn'
  | 'blocked';

export interface ExamAnswerSubmission {
  answerSubmissionId: string;
  schoolId: string;
  attemptId: string;
  attemptQuestionSnapshotId: string;
  deliverySessionId: string;
  studentRef: string;
  answerStatus: ExamAnswerSubmissionStatus;
  answerTextSafe: string | null;
  answerPayloadJson: Record<string, unknown> | null;
  attachmentRefsJson: Record<string, unknown> | null;
  clientSavedAt: string | null;
  serverReceivedAt: string;
  revisionNumber: number;
  isFinal: boolean;
  safeSubmissionSummary: string;
  createdAt: string;
  updatedAt: string;
}
