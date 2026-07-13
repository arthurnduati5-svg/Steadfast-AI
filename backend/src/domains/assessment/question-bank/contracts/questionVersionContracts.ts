export type QuestionVersionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'superseded';

export type QuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'structured_working'
  | 'essay'
  | 'oral'
  | 'practical'
  | 'matching'
  | 'true_false'
  | 'fill_blank'
  | 'multi_part';

export type DifficultyBand =
  | 'recall'
  | 'understanding'
  | 'application'
  | 'analysis'
  | 'evaluation'
  | 'creation';

export interface QuestionVersion {
  questionVersionId: string;
  questionId: string;
  versionNumber: number;
  status: QuestionVersionStatus;
  stemSafeText: string;
  questionType: QuestionType;
  difficultyBand: DifficultyBand;
  language: string;
  studentSafeExplanation: string;
  teacherExplanation: string;
  estimatedTimeSeconds: number;
  createdByActorId: string;
  createdAt: string;
  approvedAt: string | null;
  supersededAt: string | null;
  contentHash: string;
}

export type StudentInputMode =
  | 'text'
  | 'upload'
  | 'drawing'
  | 'voice_recording'
  | 'selection'
  | 'math_input';

export interface QuestionPartVersion {
  questionPartVersionId: string;
  questionVersionId: string;
  partKey: string;
  partOrder: number;
  promptSafeText: string;
  marksAvailable: number;
  expectedWorkingVisibility: boolean;
  studentInputMode: StudentInputMode;
  createdAt: string;
}

export type QuestionAssetType =
  | 'image'
  | 'diagram'
  | 'table'
  | 'audio'
  | 'video'
  | 'pdf_extract'
  | 'worksheet_extract'
  | 'other';

export interface QuestionAssetVersion {
  assetVersionId: string;
  questionVersionId: string;
  assetType: QuestionAssetType;
  assetRef: string;
  assetFingerprint: string;
  studentVisible: boolean;
  teacherOnly: boolean;
  altText: string;
  createdAt: string;
}
