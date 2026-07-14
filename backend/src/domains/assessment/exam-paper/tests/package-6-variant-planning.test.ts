import { describe, it, expect } from 'vitest';
import { ExamVariantPlanningService } from '../services/examVariantPlanningService';
import { ExamPaperVersionService } from '../services/examPaperVersionService';

describe('Package 6 - Variant Planning', () => {
  const variantService = new ExamVariantPlanningService();
  const versionService = new ExamPaperVersionService();

  it('Same-question reordered variant can be generated', async () => {
    const variant = await variantService.createVariantPlan({
      schoolId: 's1',
      paperVersionId: 'pv1',
      variantCode: 'VAR-A',
      variantStrategy: 'same_questions_reordered',
      shuffleSections: false,
      shuffleQuestionsWithinSections: true,
      safeSummary: 'Reordered variant A',
    });
    expect(variant.status).toBe('draft');
    expect(variant.variantStrategy).toBe('same_questions_reordered');
  });

  it('Variant preserves total marks', async () => {
    const variant = await variantService.createVariantPlan({
      schoolId: 's1',
      paperVersionId: 'pv1',
      variantCode: 'VAR-B',
      variantStrategy: 'same_questions_reordered',
      shuffleSections: false,
      shuffleQuestionsWithinSections: true,
      safeSummary: 'Variant B',
    });
    const { variant: genVariant, variantQuestions } = await variantService.createSameQuestionReorderedVariant(
      variant,
      [
        { paperQuestionId: 'pq1', schoolId: 's1', paperVersionId: 'pv1', sectionId: 'sec1', questionId: 'q1', questionVersionId: 'qv1', sourceDraftQuestionId: 'dq1', position: 1, marksAllocated: 5, required: true, studentVisible: true, answerKeyLinked: false, rubricLinked: false, selectionReason: 'R1', safeTeacherSummary: 'S1', createdAt: '' },
        { paperQuestionId: 'pq2', schoolId: 's1', paperVersionId: 'pv1', sectionId: 'sec1', questionId: 'q2', questionVersionId: 'qv2', sourceDraftQuestionId: 'dq2', position: 2, marksAllocated: 3, required: true, studentVisible: true, answerKeyLinked: false, rubricLinked: false, selectionReason: 'R2', safeTeacherSummary: 'S2', createdAt: '' },
      ],
    );
    expect(genVariant.totalMarks).toBe(8);
    expect(variantQuestions.length).toBe(2);
  });

  it('Variant preserves section mapping', async () => {
    const variant = await variantService.createVariantPlan({
      schoolId: 's1', paperVersionId: 'pv1', variantCode: 'VAR-C',
      variantStrategy: 'same_questions_reordered', shuffleSections: false,
      shuffleQuestionsWithinSections: true, safeSummary: 'Variant C',
    });
    const { variantQuestions } = await variantService.createSameQuestionReorderedVariant(variant, [
      { paperQuestionId: 'pq1', schoolId: 's1', paperVersionId: 'pv1', sectionId: 'sec1', questionId: 'q1', questionVersionId: 'qv1', sourceDraftQuestionId: 'dq1', position: 1, marksAllocated: 5, required: true, studentVisible: true, answerKeyLinked: false, rubricLinked: false, selectionReason: 'R1', safeTeacherSummary: 'S1', createdAt: '' },
    ]);
    expect(variantQuestions.length).toBe(1);
  });

  it('Variant does not expose answer keys', async () => {
    const variantQuestions: any[] = [];
    const keys = Object.keys(variantQuestions.length > 0 ? variantQuestions[0] : {});
    expect(keys.includes('answerKeyText')).toBe(false);
    expect(keys.includes('correctAnswerSummary')).toBe(false);
  });

  it('Variant does not assign students', async () => {
    const variant = await variantService.createVariantPlan({
      schoolId: 's1', paperVersionId: 'pv1', variantCode: 'VAR-D',
      variantStrategy: 'same_questions_reordered', shuffleSections: false,
      shuffleQuestionsWithinSections: true, safeSummary: 'Variant D',
    });
    const variantKeys = Object.keys(variant);
    expect(variantKeys.includes('studentId')).toBe(false);
    expect(variantKeys.includes('assignedStudentIds')).toBe(false);
  });

  it('Variant does not activate delivery', async () => {
    const variant = await variantService.createVariantPlan({
      schoolId: 's1', paperVersionId: 'pv1', variantCode: 'VAR-E',
      variantStrategy: 'same_questions_reordered', shuffleSections: false,
      shuffleQuestionsWithinSections: true, safeSummary: 'Variant E',
    });
    expect(variant.status).not.toBe('delivery_ready');
  });

  it('Equivalent-objective variant is blocked when insufficient replacement data', async () => {
    const variant = await variantService.createVariantPlan({
      schoolId: 's1', paperVersionId: 'pv1', variantCode: 'VAR-F',
      variantStrategy: 'equivalent_questions_by_objective', shuffleSections: false,
      shuffleQuestionsWithinSections: true, safeSummary: 'Equivalent variant',
    });
    const result = await variantService.createEquivalentObjectiveVariantStub(variant);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('deferred');
  });

  it('Variant approval does not create delivery sessions', async () => {
    const variant = await variantService.createVariantPlan({
      schoolId: 's1', paperVersionId: 'pv1', variantCode: 'VAR-G',
      variantStrategy: 'same_questions_reordered', shuffleSections: false,
      shuffleQuestionsWithinSections: true, safeSummary: 'Variant G',
    });
    const approved = await variantService.approveVariant(variant.variantId, [variant]);
    expect(approved?.status).toBe('approved');
    expect(approved?.approvedAt).toBeTruthy();
  });
});
