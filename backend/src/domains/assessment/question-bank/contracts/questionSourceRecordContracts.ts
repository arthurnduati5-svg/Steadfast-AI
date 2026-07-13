export type QuestionSourceRecordType =
  | 'teacher_created'
  | 'curriculum_import'
  | 'approved_source_import'
  | 'artifact_extract_manual'
  | 'ai_assisted_draft'
  | 'legacy_seed';

export interface QuestionSourceRecord {
  sourceRecordId: string;
  questionId: string;
  questionVersionId: string;
  sourceType: QuestionSourceRecordType;
  sourceRef: string;
  approvedSourceId: string | null;
  importBatchId: string | null;
  createdByActorId: string;
  createdAt: string;
  safeSummary: string;
}
