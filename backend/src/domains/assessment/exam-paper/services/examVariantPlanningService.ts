import { randomUUID } from 'crypto';
import { ExamVariant, ExamVariantQuestion, ExamVariantStatus, ExamVariantStrategy } from '../contracts/examPaperVariantContracts';
import { ExamPaperQuestion } from '../contracts/examPaperSectionContracts';
import { ExamPaperCommandContext, ExamPaperPolicyDecision } from '../contracts/examPaperContracts';

const FORBIDDEN_ROLES = ['student', 'parent', 'guest', 'unknown'];

export class ExamVariantPlanningService {
  public validateContext(ctx: ExamPaperCommandContext): ExamPaperPolicyDecision {
    if (!ctx.schoolId) return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School ID required', blockedOperation: 'createVariantPlan' };
    if (FORBIDDEN_ROLES.includes(ctx.actorRole)) return { allowed: false, reasonCode: 'ROLE_NOT_ALLOWED', safeMessage: `Role ${ctx.actorRole} cannot plan variants`, blockedOperation: 'createVariantPlan' };
    return { allowed: true, reasonCode: 'OK', safeMessage: 'Context validated', blockedOperation: '' };
  }

  public async createVariantPlan(
    data: {
      schoolId: string;
      paperVersionId: string;
      variantCode: string;
      variantStrategy: ExamVariantStrategy;
      shuffleSections: boolean;
      shuffleQuestionsWithinSections: boolean;
      safeSummary: string;
    },
  ): Promise<ExamVariant> {
    return {
      variantId: randomUUID(),
      ...data,
      status: 'draft' as ExamVariantStatus,
      questionCount: 0,
      totalMarks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: null,
    };
  }

  public async createSameQuestionReorderedVariant(
    variant: ExamVariant,
    questions: ExamPaperQuestion[],
  ): Promise<{ variant: ExamVariant; variantQuestions: ExamVariantQuestion[] }> {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const variantQuestions: ExamVariantQuestion[] = shuffled.map((q, i) => ({
      variantQuestionId: randomUUID(),
      schoolId: variant.schoolId,
      variantId: variant.variantId,
      paperQuestionId: q.paperQuestionId,
      questionId: q.questionId,
      questionVersionId: q.questionVersionId,
      sectionKey: '',
      variantPosition: i + 1,
      marksAllocated: q.marksAllocated,
      mappingReason: 'same_questions_reordered',
      createdAt: new Date().toISOString(),
    }));

    const totalMarks = variantQuestions.reduce((sum, q) => sum + q.marksAllocated, 0);
    return {
      variant: {
        ...variant,
        status: 'generated' as ExamVariantStatus,
        questionCount: variantQuestions.length,
        totalMarks,
        updatedAt: new Date().toISOString(),
      },
      variantQuestions,
    };
  }

  public async createEquivalentObjectiveVariantStub(
    variant: ExamVariant,
  ): Promise<{ variant: ExamVariant; variantQuestions: ExamVariantQuestion[]; blocked: boolean; reason: string }> {
    return {
      variant: { ...variant, status: 'blocked' as ExamVariantStatus, updatedAt: new Date().toISOString() },
      variantQuestions: [],
      blocked: true,
      reason: 'Equivalent objective variant generation is deferred; insufficient replacement question pool data',
    };
  }

  public async validateVariantCoverage(variantQuestions: ExamVariantQuestion[]): Promise<string[]> {
    const warnings: string[] = [];
    if (variantQuestions.length === 0) warnings.push('Variant has no questions');
    const markMap = new Map<string, number>();
    for (const q of variantQuestions) {
      markMap.set(q.variantQuestionId, (markMap.get(q.variantQuestionId) || 0) + q.marksAllocated);
    }
    return warnings;
  }

  public async listVariantsForPaperVersion(paperVersionId: string, variants: ExamVariant[]): Promise<ExamVariant[]> {
    return variants.filter((v) => v.paperVersionId === paperVersionId);
  }

  public async blockVariant(variantId: string, variants: ExamVariant[]): Promise<ExamVariant | null> {
    const v = variants.find((x) => x.variantId === variantId);
    if (!v) return null;
    return { ...v, status: 'blocked' as ExamVariantStatus, updatedAt: new Date().toISOString() };
  }

  public async approveVariant(variantId: string, variants: ExamVariant[]): Promise<ExamVariant | null> {
    const v = variants.find((x) => x.variantId === variantId);
    if (!v) return null;
    return { ...v, status: 'approved' as ExamVariantStatus, approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}
