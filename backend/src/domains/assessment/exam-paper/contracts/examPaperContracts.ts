export type ExamPaperStatus =
  | 'draft'
  | 'assembly_in_progress'
  | 'assembled'
  | 'review_ready'
  | 'approved'
  | 'delivery_ready'
  | 'blocked'
  | 'archived';

export interface ExamPaper {
  paperId: string;
  schoolId: string;
  status: ExamPaperStatus;
  sourceDraftSetId: string;
  sourceDraftId: string;
  blueprintId: string;
  blueprintVersionId: string;
  title: string;
  subjectId: string;
  curriculumVersionId: string;
  gradeBand: string;
  examType: string;
  createdByActorId: string;
  createdByRole: string;
  currentVersionId: string | null;
  safeSummary: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ExamPaperCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
}

export interface ExamPaperPolicyDecision {
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  blockedOperation: string;
}
