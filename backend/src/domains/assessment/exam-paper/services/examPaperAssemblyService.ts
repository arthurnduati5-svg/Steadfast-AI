import { randomUUID } from 'crypto';
import { ExamPaperCommandContext, ExamPaperPolicyDecision } from '../contracts/examPaperContracts';
import { ExamPaperVersionStatus } from '../contracts/examPaperVersionContracts';
import { ExamPaperAssemblyPersistence } from '../contracts/examPaperAssemblyPersistenceContracts';

export type ExamPaperAssemblyStatus = 'started' | 'completed' | 'partial' | 'blocked' | 'failed' | 'cancelled';

export type ExamPaperAssemblyStrategy =
  | 'from_selected_draft'
  | 'teacher_manual_from_draft'
  | 'regenerate_layout_from_draft'
  | 'mock_seed';

export interface ExamPaperAssemblyRun {
  assemblyRunId: string;
  schoolId: string;
  sourceDraftSetId: string;
  sourceDraftId: string;
  paperId: string;
  paperVersionId: string;
  status: ExamPaperAssemblyStatus;
  assemblyStrategy: ExamPaperAssemblyStrategy;
  inputQuestionCount: number;
  assembledQuestionCount: number;
  warningCount: number;
  blockedCount: number;
  safeSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  completedAt: string | null;
}

export interface ExamPaperAssemblyInput {
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
  draftQuestions: Array<{
    draftQuestionId: string;
    questionId: string;
    questionVersionId: string;
    position: number;
    sectionKey: string;
    marksAllocated: number;
    selectionReason: string;
    safeTeacherSummary: string;
  }>;
}

export interface ExamPaperAssemblyResult {
  paperId: string;
  paperVersionId: string;
  assemblyRunId: string;
  status: ExamPaperAssemblyStatus;
  questionCount: number;
  sectionCount: number;
  totalMarks: number;
  warnings: string[];
  safeSummary: string;
}

const ALLOWED_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
const FORBIDDEN_ROLES = ['student', 'parent', 'guest', 'unknown'];

function extractRoleScope(role: string): { allowed: boolean; reasonCode: string } {
  if (FORBIDDEN_ROLES.includes(role)) {
    return { allowed: false, reasonCode: 'ROLE_NOT_ALLOWED' };
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return { allowed: false, reasonCode: 'ROLE_NOT_RECOGNIZED' };
  }
  return { allowed: true, reasonCode: '' };
}

export class ExamPaperAssemblyService {
  constructor(
    private persistence: ExamPaperAssemblyPersistence,
  ) {}

  public validateCommandContext(ctx: ExamPaperCommandContext): ExamPaperPolicyDecision {
    if (!ctx.schoolId) {
      return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School ID is required', blockedOperation: 'assemblePaperFromDraft' };
    }
    const roleCheck = extractRoleScope(ctx.actorRole);
    if (!roleCheck.allowed) {
      return { allowed: false, reasonCode: roleCheck.reasonCode, safeMessage: `Actor role ${ctx.actorRole} not allowed to assemble papers`, blockedOperation: 'assemblePaperFromDraft' };
    }
    if (!ctx.idempotencyKey) {
      return { allowed: false, reasonCode: 'IDEMPOTENCY_REQUIRED', safeMessage: 'Idempotency key is required', blockedOperation: 'assemblePaperFromDraft' };
    }
    return { allowed: true, reasonCode: 'OK', safeMessage: 'Command context validated', blockedOperation: '' };
  }

  public async assemblePaperFromDraft(
    input: ExamPaperAssemblyInput,
    ctx: ExamPaperCommandContext,
  ): Promise<ExamPaperAssemblyResult> {
    const validation = this.validateCommandContext(ctx);
    if (!validation.allowed) {
      return {
        paperId: '',
        paperVersionId: '',
        assemblyRunId: '',
        status: 'blocked',
        questionCount: 0,
        sectionCount: 0,
        totalMarks: 0,
        warnings: [validation.safeMessage],
        safeSummary: validation.safeMessage,
      };
    }

    const sections = new Map<string, { order: number; marks: number; count: number; title: string }>();
    let totalMarks = 0;
    const warnings: string[] = [];

    for (const q of input.draftQuestions) {
      totalMarks += q.marksAllocated;
      if (!sections.has(q.sectionKey)) {
        sections.set(q.sectionKey, { order: sections.size, marks: 0, count: 0, title: q.sectionKey });
      }
      const section = sections.get(q.sectionKey)!;
      section.marks += q.marksAllocated;
      section.count += 1;
    }

    if (input.draftQuestions.length === 0) {
      warnings.push('No draft questions provided; assembly produced empty paper');
    }

    const sectionCount = sections.size;
    const questionCount = input.draftQuestions.length;

    const persistInput = {
      schoolId: ctx.schoolId,
      sourceDraftSetId: input.sourceDraftSetId,
      sourceDraftId: input.sourceDraftId,
      blueprintId: input.blueprintId,
      blueprintVersionId: input.blueprintVersionId,
      title: input.title,
      subjectId: input.subjectId,
      curriculumVersionId: input.curriculumVersionId,
      gradeBand: input.gradeBand,
      examType: input.examType,
      instructionsSafeText: input.instructionsSafeText,
      durationMinutes: input.durationMinutes,
      securityClass: input.securityClass,
      assemblyStrategy: 'from_selected_draft',
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      idempotencyKey: ctx.idempotencyKey,
      inputQuestionCount: input.draftQuestions.length,
      assembledQuestionCount: questionCount,
      totalMarks,
      warningCount: warnings.length,
      blockedCount: 0,
      safeSummary: `Assembled paper from draft ${input.sourceDraftId}: ${questionCount} questions across ${sectionCount} sections, ${totalMarks} total marks`,
      sections: Array.from(sections.entries()).map(([key, sec]) => ({
        sectionKey: key,
        title: sec.title,
        order: sec.order,
        marksAllocated: sec.marks,
        questionCount: sec.count,
      })),
      questions: input.draftQuestions.map((q) => ({
        draftQuestionId: q.draftQuestionId,
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        position: q.position,
        sectionKey: q.sectionKey,
        marksAllocated: q.marksAllocated,
        selectionReason: q.selectionReason,
        safeTeacherSummary: q.safeTeacherSummary,
      })),
    };

    const persisted = await this.persistence.persistAssemblyGraph(persistInput);
    return { ...persisted, status: persisted.status as ExamPaperAssemblyStatus };
  }

  public async createAssemblyRun(
    data: Omit<ExamPaperAssemblyRun, 'assemblyRunId' | 'createdAt'>,
  ): Promise<ExamPaperAssemblyRun> {
    return {
      assemblyRunId: randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
    };
  }

  public async getAssemblyRun(assemblyRunId: string, runs: ExamPaperAssemblyRun[]): Promise<ExamPaperAssemblyRun | null> {
    return runs.find((r) => r.assemblyRunId === assemblyRunId) || null;
  }

  public async blockAssemblyRun(assemblyRunId: string, runs: ExamPaperAssemblyRun[]): Promise<ExamPaperAssemblyRun | null> {
    const run = runs.find((r) => r.assemblyRunId === assemblyRunId);
    if (!run) return null;
    return { ...run, status: 'blocked' as ExamPaperAssemblyStatus };
  }
}
