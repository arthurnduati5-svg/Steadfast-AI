export interface ExamPaperAssemblySectionInput {
  sectionKey: string;
  title: string;
  order: number;
  marksAllocated: number;
  questionCount: number;
}

export interface ExamPaperAssemblyQuestionInput {
  draftQuestionId: string;
  questionId: string;
  questionVersionId: string;
  position: number;
  sectionKey: string;
  marksAllocated: number;
  selectionReason: string;
  safeTeacherSummary: string;
}

export interface PersistExamPaperAssemblyGraphInput {
  schoolId: string;
  sourceDraftSetId: string;
  sourceDraftId: string;
  blueprintId: string;
  blueprintVersionId: string;
  title: string;
  subjectId: string;
  curriculumVersionId: string;
  gradeBand: string;
  examType: string;
  instructionsSafeText: string;
  durationMinutes: number;
  securityClass: string;
  assemblyStrategy: string;
  createdByActorId: string;
  createdByRole: string;
  correlationId: string;
  idempotencyKey: string;
  inputQuestionCount: number;
  assembledQuestionCount: number;
  totalMarks: number;
  warningCount: number;
  blockedCount: number;
  safeSummary: string;
  sections: ExamPaperAssemblySectionInput[];
  questions: ExamPaperAssemblyQuestionInput[];
}

export interface PersistExamPaperAssemblyGraphResult {
  paperId: string;
  paperVersionId: string;
  assemblyRunId: string;
  status: string;
  questionCount: number;
  sectionCount: number;
  totalMarks: number;
  warnings: string[];
  safeSummary: string;
}

export interface ExamPaperAssemblyPersistence {
  persistAssemblyGraph(input: PersistExamPaperAssemblyGraphInput): Promise<PersistExamPaperAssemblyGraphResult>;
}

export interface ExamPaperAssemblyIdempotencyChecker {
  checkIdempotency(schoolId: string, idempotencyKey: string): Promise<{ exists: boolean; result?: PersistExamPaperAssemblyGraphResult }>;
  recordIdempotency(schoolId: string, idempotencyKey: string, requestFingerprint: string): Promise<void>;
  completeIdempotency(schoolId: string, idempotencyKey: string, result: PersistExamPaperAssemblyGraphResult): Promise<void>;
}
