import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  ExamPaperAssemblyPersistence,
  PersistExamPaperAssemblyGraphInput,
  PersistExamPaperAssemblyGraphResult,
} from '../contracts/examPaperAssemblyPersistenceContracts';

export class PrismaExamPaperAssemblyPersistence implements ExamPaperAssemblyPersistence {
  constructor(private prisma: PrismaClient) {}

  async persistAssemblyGraph(input: PersistExamPaperAssemblyGraphInput): Promise<PersistExamPaperAssemblyGraphResult> {
    const paperId = randomUUID();
    const paperVersionId = randomUUID();
    const assemblyRunId = randomUUID();
    const sectionCount = input.sections.length;
    const now = new Date();

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.examPaperRecord.create({
          data: {
            paperId,
            schoolId: input.schoolId,
            title: input.title,
            subjectId: input.subjectId,
            curriculumVersionId: input.curriculumVersionId,
            gradeBand: input.gradeBand,
            examType: input.examType,
            status: 'draft',
            sourceDraftSetId: input.sourceDraftSetId,
            sourceDraftId: input.sourceDraftId,
            blueprintId: input.blueprintId,
            blueprintVersionId: input.blueprintVersionId,
            createdByActorId: input.createdByActorId,
            createdByRole: input.createdByRole,
            safeSummary: input.safeSummary,
          },
        });

        await tx.examPaperVersionRecord.create({
          data: {
            paperVersionId,
            paperId,
            schoolId: input.schoolId,
            versionNumber: 1,
            status: 'draft',
            title: input.title,
            instructionsSafeText: input.instructionsSafeText,
            durationMinutes: input.durationMinutes,
            totalMarks: input.totalMarks,
            questionCount: input.assembledQuestionCount,
            sectionCount,
            securityClass: input.securityClass,
            createdByActorId: input.createdByActorId,
          },
        });

        const sectionKeyToId = new Map<string, string>();

        for (const sec of input.sections) {
          const sectionId = randomUUID();
          sectionKeyToId.set(sec.sectionKey, sectionId);

          await tx.examPaperSectionRecord.create({
            data: {
              sectionId,
              paperVersionId,
              schoolId: input.schoolId,
              sectionKey: sec.sectionKey,
              sectionTitle: sec.title,
              sectionOrder: sec.order,
              instructionsSafeText: '',
              marksAvailable: sec.marksAllocated,
              questionCount: sec.questionCount,
            },
          });
        }

        for (const q of input.questions) {
          const sectionId = sectionKeyToId.get(q.sectionKey);
          if (!sectionId) {
            throw new Error(`ASSEMBLY_PERSISTENCE_FAILED: Section key '${q.sectionKey}' not found`);
          }

          await tx.examPaperQuestionRecord.create({
            data: {
              paperQuestionId: randomUUID(),
              paperVersionId,
              schoolId: input.schoolId,
              sectionId,
              questionId: q.questionId,
              questionVersionId: q.questionVersionId,
              sourceDraftQuestionId: q.draftQuestionId,
              position: q.position,
              marksAllocated: q.marksAllocated,
              selectionReason: q.selectionReason,
              safeTeacherSummary: q.safeTeacherSummary,
            },
          });
        }

        await tx.examPaperAssemblyRunRecord.create({
          data: {
            assemblyRunId,
            paperId,
            paperVersionId,
            schoolId: input.schoolId,
            sourceDraftSetId: input.sourceDraftSetId,
            sourceDraftId: input.sourceDraftId,
            assemblyStrategy: input.assemblyStrategy,
            status: input.assembledQuestionCount > 0 ? 'completed' : 'partial',
            inputQuestionCount: input.inputQuestionCount,
            assembledQuestionCount: input.assembledQuestionCount,
            warningCount: input.warningCount,
            blockedCount: input.blockedCount,
            safeSummary: input.safeSummary,
            createdByActorId: input.createdByActorId,
            createdByRole: input.createdByRole,
            completedAt: input.assembledQuestionCount > 0 ? now : null,
          },
        });
      });

      return {
        paperId,
        paperVersionId,
        assemblyRunId,
        status: input.assembledQuestionCount > 0 ? 'completed' : 'partial',
        questionCount: input.assembledQuestionCount,
        sectionCount,
        totalMarks: input.totalMarks,
        warnings: input.warningCount > 0 ? ['Assembly completed with warnings'] : [],
        safeSummary: input.safeSummary,
      };
    } catch (err: any) {
      throw new Error(`ASSEMBLY_PERSISTENCE_FAILED: Transaction failed - ${err.message}`);
    }
  }
}
