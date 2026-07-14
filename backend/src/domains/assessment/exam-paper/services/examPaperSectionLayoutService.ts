import { ExamPaperSection, ExamPaperQuestion } from '../contracts/examPaperSectionContracts';

export interface SectionLayoutInput {
  sectionKey: string;
  sectionTitle: string;
  sectionOrder: number;
  instructionsSafeText: string;
  timingGuidanceMinutes: number;
  questions: Array<{
    questionId: string;
    questionVersionId: string;
    draftQuestionId: string;
    position: number;
    marksAllocated: number;
    selectionReason: string;
    safeTeacherSummary: string;
  }>;
}

export class ExamPaperSectionLayoutService {
  public async createSectionsFromDraftQuestions(
    inputs: SectionLayoutInput[],
    paperVersionId: string,
    schoolId: string,
  ): Promise<{ sections: Omit<ExamPaperSection, 'createdAt'>[]; questions: Omit<ExamPaperQuestion, 'createdAt'>[] }> {
    const sections: Omit<ExamPaperSection, 'createdAt'>[] = [];
    const questions: Omit<ExamPaperQuestion, 'createdAt'>[] = [];
    const now = new Date().toISOString();

    for (const input of inputs) {
      const section: Omit<ExamPaperSection, 'createdAt'> = {
        sectionId: crypto.randomUUID(),
        schoolId,
        paperVersionId,
        sectionKey: input.sectionKey,
        sectionTitle: input.sectionTitle,
        sectionOrder: input.sectionOrder,
        instructionsSafeText: input.instructionsSafeText,
        marksAvailable: input.questions.reduce((sum, q) => sum + q.marksAllocated, 0),
        questionCount: input.questions.length,
        timingGuidanceMinutes: input.timingGuidanceMinutes,
      };
      sections.push(section);

      for (const q of input.questions) {
        questions.push({
          paperQuestionId: crypto.randomUUID(),
          schoolId,
          paperVersionId,
          sectionId: section.sectionId,
          questionId: q.questionId,
          questionVersionId: q.questionVersionId,
          sourceDraftQuestionId: q.draftQuestionId,
          position: q.position,
          marksAllocated: q.marksAllocated,
          required: true,
          studentVisible: true,
          answerKeyLinked: false,
          rubricLinked: false,
          selectionReason: q.selectionReason,
          safeTeacherSummary: q.safeTeacherSummary,
        });
      }
    }

    return { sections, questions };
  }

  public async normalizeSectionOrder(sections: Omit<ExamPaperSection, 'createdAt'>[]): Promise<Omit<ExamPaperSection, 'createdAt'>[]> {
    return sections
      .sort((a, b) => a.sectionOrder - b.sectionOrder)
      .map((s, i) => ({ ...s, sectionOrder: i + 1 }));
  }

  public async validateSectionMarks(sections: Omit<ExamPaperSection, 'createdAt'>[], totalMarks: number): Promise<string[]> {
    const warnings: string[] = [];
    const sectionTotal = sections.reduce((sum, s) => sum + s.marksAvailable, 0);
    if (sectionTotal !== totalMarks) {
      warnings.push(`Section marks total (${sectionTotal}) does not match paper total marks (${totalMarks})`);
    }
    return warnings;
  }

  public async validateQuestionPositions(questions: Omit<ExamPaperQuestion, 'createdAt'>[]): Promise<string[]> {
    const warnings: string[] = [];
    const positionMap = new Map<string, number[]>();
    for (const q of questions) {
      const key = q.sectionId;
      if (!positionMap.has(key)) positionMap.set(key, []);
      positionMap.get(key)!.push(q.position);
    }
    for (const [sectionId, positions] of positionMap) {
      const seen = new Set<number>();
      for (const p of positions) {
        if (seen.has(p)) {
          warnings.push(`Duplicate position ${p} in section ${sectionId}`);
        }
        seen.add(p);
      }
    }
    return warnings;
  }

  public async deriveDefaultSection(
    paperVersionId: string,
    schoolId: string,
  ): Promise<Omit<ExamPaperSection, 'createdAt'>> {
    return {
      sectionId: crypto.randomUUID(),
      schoolId,
      paperVersionId,
      sectionKey: 'default',
      sectionTitle: 'Default Section',
      sectionOrder: 1,
      instructionsSafeText: '',
      marksAvailable: 0,
      questionCount: 0,
      timingGuidanceMinutes: 0,
    };
  }
}
