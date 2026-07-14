export interface ExamPaperSafeProjection {
  paperId: string;
  status: string;
  title: string;
  instructionsSafeText: string;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  sectionCount: number;
  securityClass: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamPaperStudentPreviewProjection {
  paperId: string;
  title: string;
  instructionsSafeText: string;
  durationMinutes: number;
  totalMarks: number;
  sectionTitles: string[];
  safeQuestionCount: number;
  safePolicySummary: string;
  safeAvailabilityMode: string;
  paperStatus: string;
  deliveryReadinessLabel: string;
}

export interface ExamPaperParentPreviewProjection {
  paperId: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  sectionCount: number;
  safePolicySummary: string;
  deliveryReadinessLabel: string;
}

export interface ExamPaperTeacherProjection {
  paperId: string;
  schoolId: string;
  status: string;
  sourceDraftSetId: string;
  sourceDraftId: string;
  blueprintId: string;
  blueprintVersionId: string;
  title: string;
  subjectId: string;
  curriculumVersionId: string;
  gradeBand: string;
  examType: string;
  currentVersionId: string | null;
  safeSummary: string;
  versions: ExamPaperSafeProjection[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamPaperAdminProjection {
  paperId: string;
  schoolId: string;
  status: string;
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
  versions: ExamPaperSafeProjection[];
  approvals: string[];
  assemblyRuns: string[];
  deliveryBridges: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
