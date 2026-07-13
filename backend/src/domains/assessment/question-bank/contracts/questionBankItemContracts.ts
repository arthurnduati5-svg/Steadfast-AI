export type QuestionBankItemStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'superseded'
  | 'blocked';

export type QuestionSecurityClass =
  | 'practice_safe'
  | 'quiz_safe'
  | 'exam_secure'
  | 'teacher_only'
  | 'restricted';

export type QuestionSourceType =
  | 'teacher_created'
  | 'curriculum_import'
  | 'approved_source_import'
  | 'artifact_extract_manual'
  | 'ai_assisted_draft'
  | 'legacy_seed';

export interface QuestionBankItem {
  questionId: string;
  schoolId: string;
  status: QuestionBankItemStatus;
  subjectId: string;
  topicId: string;
  skillId: string;
  curriculumVersionId: string;
  primaryObjectiveId: string;
  currentVersionId: string;
  createdByActorId: string;
  createdByRole: string;
  sourceType: QuestionSourceType;
  securityClass: QuestionSecurityClass;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
