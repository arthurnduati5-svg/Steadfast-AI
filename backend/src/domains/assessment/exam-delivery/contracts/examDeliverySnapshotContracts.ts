export type ExamAttemptSubmissionSnapshotStatus =
  | 'draft'
  | 'sealed'
  | 'blocked'
  | 'void';

export interface ExamAttemptSubmissionSnapshot {
  submissionSnapshotId: string;
  schoolId: string;
  attemptId: string;
  deliverySessionId: string;
  paperId: string;
  paperVersionId: string;
  variantId: string;
  studentRef: string;
  snapshotStatus: ExamAttemptSubmissionSnapshotStatus;
  submittedAnswerCount: number;
  questionSnapshotCount: number;
  totalMarksAvailable: number;
  submissionPayloadJson: Record<string, unknown> | null;
  safeSnapshotSummary: string;
  createdAt: string;
  sealedAt: string | null;
}

export interface ExamDeliveryAuditEvent {
  deliveryAuditId: string;
  schoolId: string;
  deliverySessionId: string | null;
  attemptId: string | null;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  requestId: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface ExamDeliveryIdempotencyEntry {
  deliveryIdempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType: string | null;
  resourceId: string | null;
  safeResultSummary: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface ExamDeliverySnapshotForMarking {
  submissionSnapshotId: string;
  schoolId: string;
  attemptId: string;
  paperId: string;
  paperVersionId: string;
  variantId: string;
  studentRef: string;
  questionSnapshots: ExamAttemptQuestionSnapshotForMarking[];
  answers: ExamAnswerForMarking[];
  totalMarksAvailable: number;
  sealedAt: string;
}

export interface ExamAttemptQuestionSnapshotForMarking {
  attemptQuestionSnapshotId: string;
  paperQuestionId: string;
  variantQuestionId: string;
  questionId: string;
  questionVersionId: string;
  sectionKey: string;
  displayOrder: number;
  marksAvailable: number;
  studentVisiblePromptSafe: string;
  answerInputType: string;
}

export interface ExamAnswerForMarking {
  answerSubmissionId: string;
  attemptQuestionSnapshotId: string;
  answerTextSafe: string | null;
  answerPayloadJson: Record<string, unknown> | null;
  revisionNumber: number;
  isFinal: boolean;
  serverReceivedAt: string;
}
