export type ExamPaperVersionStatus =
  | 'draft'
  | 'assembled'
  | 'review_ready'
  | 'approved'
  | 'delivery_ready'
  | 'blocked'
  | 'superseded';

export interface ExamPaperVersion {
  paperVersionId: string;
  paperId: string;
  schoolId: string;
  versionNumber: number;
  status: ExamPaperVersionStatus;
  title: string;
  instructionsSafeText: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  sectionCount: number;
  variantCount: number;
  assemblyPolicyJson: Record<string, unknown> | null;
  securityClass: string;
  createdByActorId: string;
  createdAt: string;
  approvedAt: string | null;
  supersededAt: string | null;
}
