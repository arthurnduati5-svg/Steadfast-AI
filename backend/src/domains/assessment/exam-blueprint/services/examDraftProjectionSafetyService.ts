import { ExamDraft, ExamDraftQuestion, ExamDraftSet } from '../contracts';

export interface TeacherDraftSummary {
  draftId: string;
  draftTitle: string;
  rank: number;
  questionCount: number;
  totalMarks: number;
  estimatedDurationMinutes: number;
  overallScore: number;
  coverageScore: number;
  difficultyBalanceScore: number;
  recommendationReason: string;
  safeTeacherSummary: string;
  differenceFromPreviousDraft: string;
  warningCodes: string[];
  questions: TeacherQuestionRef[];
}

export interface TeacherQuestionRef {
  position: number;
  questionId: string;
  questionVersionId: string;
  sectionKey: string;
  marksAllocated: number;
  selectionReason: string;
}

export interface AdminDraftSummary {
  draftId: string;
  draftTitle: string;
  rank: number;
  status: string;
  questionCount: number;
  totalMarks: number;
  estimatedDurationMinutes: number;
  overallScore: number;
  coverageScore: number;
  difficultyBalanceScore: number;
  securityScore: number;
  freshnessScore: number;
  recommendationReason: string;
  safeTeacherSummary: string;
  differenceFromPreviousDraft: string;
  warningCodes: string[];
  createdByActorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentForbiddenDraftView {
  error: string;
  message: string;
}

export class ExamDraftProjectionSafetyService {
  toTeacherDraftSummary(
    draft: ExamDraft,
    questions: ExamDraftQuestion[],
  ): TeacherDraftSummary {
    return {
      draftId: draft.draftId,
      draftTitle: draft.draftTitle,
      rank: draft.rank,
      questionCount: draft.questionCount,
      totalMarks: draft.totalMarks,
      estimatedDurationMinutes: draft.estimatedDurationMinutes,
      overallScore: draft.overallScore,
      coverageScore: draft.coverageScore,
      difficultyBalanceScore: draft.difficultyBalanceScore,
      recommendationReason: draft.recommendationReason,
      safeTeacherSummary: draft.safeTeacherSummary,
      differenceFromPreviousDraft: draft.differenceFromPreviousDraft,
      warningCodes: this.parseJsonArray(draft.warningCodesJson),
      questions: questions.map(q => ({
        position: q.position,
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        sectionKey: q.sectionKey,
        marksAllocated: q.marksAllocated,
        selectionReason: q.selectionReason,
      })),
    };
  }

  toAdminDraftSummary(
    draft: ExamDraft,
    questions: ExamDraftQuestion[],
  ): AdminDraftSummary {
    return {
      ...this.toTeacherDraftSummary(draft, questions),
      status: draft.status,
      securityScore: draft.securityScore,
      freshnessScore: draft.freshnessScore,
      createdByActorId: '',
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  }

  toStudentForbiddenDraftView(): StudentForbiddenDraftView {
    return {
      error: 'FORBIDDEN',
      message: 'Draft exam content is not available to students or parents until officially published.',
    };
  }

  assertNoAnswerKeyLeakage<T extends Record<string, any>>(data: T): T {
    const forbiddenKeys = ['answerKeySafeRef', 'correctAnswerSummary', 'markingNotesTeacherOnly', 'rubricInternal'];
    const safe = { ...data };
    for (const key of forbiddenKeys) {
      if (key in safe) {
        delete (safe as any)[key];
      }
    }
    return safe;
  }

  private parseJsonArray(json: string): string[] {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
