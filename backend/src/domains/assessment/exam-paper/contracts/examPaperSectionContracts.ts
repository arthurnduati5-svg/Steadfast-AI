export interface ExamPaperSection {
  sectionId: string;
  schoolId: string;
  paperVersionId: string;
  sectionKey: string;
  sectionTitle: string;
  sectionOrder: number;
  instructionsSafeText: string;
  marksAvailable: number;
  questionCount: number;
  timingGuidanceMinutes: number;
  createdAt: string;
}

export interface ExamPaperQuestion {
  paperQuestionId: string;
  schoolId: string;
  paperVersionId: string;
  sectionId: string;
  questionId: string;
  questionVersionId: string;
  sourceDraftQuestionId: string;
  position: number;
  marksAllocated: number;
  required: boolean;
  studentVisible: boolean;
  answerKeyLinked: boolean;
  rubricLinked: boolean;
  selectionReason: string;
  safeTeacherSummary: string;
  createdAt: string;
}
