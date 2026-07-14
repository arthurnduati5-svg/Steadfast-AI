import { ExamPaperVersion } from '../contracts/examPaperVersionContracts';
import { ExamPaperSection } from '../contracts/examPaperSectionContracts';
import { ExamAccessPolicy } from '../contracts/examPaperAccessContracts';
import { ExamPaperSafeProjection, ExamPaperStudentPreviewProjection, ExamPaperParentPreviewProjection, ExamPaperTeacherProjection, ExamPaperAdminProjection } from '../contracts/examPaperProjectionContracts';

const FORBIDDEN_FIELDS = [
  'answerKeySafeRef',
  'answerKeyText',
  'correctAnswerSummary',
  'rubricInternal',
  'rubricText',
  'markingNotesTeacherOnly',
  'teacherOnlyNotes',
  'selectionReasonInternal',
  'variantAlgorithmInternals',
  'sourceDraftScoringInternals',
  'hiddenReasoning',
  'chainOfThought',
  'rawQuestionMetadata',
  'rawStudentWork',
  'deliveryActivationToken',
  'releaseWindowInternal',
];

export class ExamPaperProjectionSafetyService {
  private assertNoForbiddenFields(obj: Record<string, unknown>, context: string): void {
    for (const field of FORBIDDEN_FIELDS) {
      if (field in obj) {
        throw new Error(`Forbidden field "${field}" found in ${context} projection`);
      }
    }
  }

  public async assertNoAnswerKeyLeakage(data: Record<string, unknown>): Promise<void> {
    this.assertNoForbiddenFields(data, 'answer key check');
  }

  public async assertNoTeacherOnlyLeakage(data: Record<string, unknown>): Promise<void> {
    this.assertNoForbiddenFields(data, 'teacher-only check');
  }

  public async assertNoHiddenReasoningLeakage(data: Record<string, unknown>): Promise<void> {
    this.assertNoForbiddenFields(data, 'hidden reasoning check');
  }

  public async assertNoDeliveryActivationLeakage(data: Record<string, unknown>): Promise<void> {
    this.assertNoForbiddenFields(data, 'delivery activation check');
  }

  public toSafeProjection(version: ExamPaperVersion): ExamPaperSafeProjection {
    return {
      paperId: version.paperId,
      status: version.status,
      title: version.title,
      instructionsSafeText: version.instructionsSafeText,
      durationMinutes: version.durationMinutes,
      totalMarks: version.totalMarks,
      questionCount: version.questionCount,
      sectionCount: version.sectionCount,
      securityClass: version.securityClass,
      createdAt: version.createdAt,
      updatedAt: version.createdAt,
    };
  }

  public toStudentPreviewProjection(
    version: ExamPaperVersion,
    sections: ExamPaperSection[],
    policy: ExamAccessPolicy | null,
  ): ExamPaperStudentPreviewProjection {
    return {
      paperId: version.paperId,
      title: version.title,
      instructionsSafeText: version.instructionsSafeText,
      durationMinutes: version.durationMinutes,
      totalMarks: version.totalMarks,
      sectionTitles: sections.map((s) => s.sectionTitle),
      safeQuestionCount: version.questionCount,
      safePolicySummary: policy?.safePolicySummary || 'Not configured',
      safeAvailabilityMode: policy?.availabilityMode || 'manual_teacher_activation',
      paperStatus: version.status,
      deliveryReadinessLabel: version.status === 'delivery_ready' ? 'Ready for delivery' : 'Not yet ready',
    };
  }

  public toParentPreviewProjection(
    version: ExamPaperVersion,
    policy: ExamAccessPolicy | null,
  ): ExamPaperParentPreviewProjection {
    return {
      paperId: version.paperId,
      title: version.title,
      durationMinutes: version.durationMinutes,
      totalMarks: version.totalMarks,
      sectionCount: version.sectionCount,
      safePolicySummary: policy?.safePolicySummary || 'Not configured',
      deliveryReadinessLabel: version.status === 'delivery_ready' ? 'Ready for delivery' : 'Not yet ready',
    };
  }

  public async toTeacherProjection(
    version: ExamPaperVersion,
  ): Promise<ExamPaperTeacherProjection> {
    return {
      paperId: version.paperId,
      schoolId: version.schoolId,
      status: version.status,
      sourceDraftSetId: '',
      sourceDraftId: '',
      blueprintId: '',
      blueprintVersionId: '',
      title: version.title,
      subjectId: '',
      curriculumVersionId: '',
      gradeBand: '',
      examType: '',
      currentVersionId: version.paperVersionId,
      safeSummary: '',
      versions: [this.toSafeProjection(version)],
      createdAt: version.createdAt,
      updatedAt: version.createdAt,
    };
  }

  public async toAdminProjection(
    version: ExamPaperVersion,
  ): Promise<ExamPaperAdminProjection> {
    return {
      paperId: version.paperId,
      schoolId: version.schoolId,
      status: version.status,
      sourceDraftSetId: '',
      sourceDraftId: '',
      blueprintId: '',
      blueprintVersionId: '',
      title: version.title,
      subjectId: '',
      curriculumVersionId: '',
      gradeBand: '',
      examType: '',
      createdByActorId: version.createdByActorId,
      createdByRole: '',
      currentVersionId: version.paperVersionId,
      safeSummary: '',
      versions: [this.toSafeProjection(version)],
      approvals: [],
      assemblyRuns: [],
      deliveryBridges: [],
      createdAt: version.createdAt,
      updatedAt: version.createdAt,
      archivedAt: null,
    };
  }
}
