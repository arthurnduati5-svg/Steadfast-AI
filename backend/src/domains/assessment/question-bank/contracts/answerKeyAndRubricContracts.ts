export type AnswerKeyStatus =
  | 'draft'
  | 'approved'
  | 'superseded';

export interface AnswerKeyVersion {
  answerKeyVersionId: string;
  questionVersionId: string;
  status: AnswerKeyStatus;
  answerKeySafeRef: string;
  correctAnswerSummary: string;
  markingNotesTeacherOnly: string;
  createdByActorId: string;
  createdAt: string;
  approvedAt: string | null;
}

export type RubricStatus =
  | 'draft'
  | 'approved'
  | 'superseded';

export interface RubricVersion {
  rubricVersionId: string;
  questionVersionId: string;
  status: RubricStatus;
  rubricPublicSummary: string;
  rubricInternal: string;
  marksTotal: number;
  criteriaJson: string;
  createdByActorId: string;
  createdAt: string;
  approvedAt: string | null;
}
