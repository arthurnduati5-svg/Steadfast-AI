import {
  ExamDeliveryTeacherProjection,
  ExamDeliveryStudentAttemptProjection,
  ExamVariantAssignmentTeacherView,
  ExamAttemptQuestionStudentView,
  ExamDeliveryAdminProjection,
  STUDENT_PROJECTION_FORBIDDEN_FIELDS,
} from '../contracts/examDeliveryContracts';
import {
  ExamDeliverySession,
  ExamDeliverySessionState,
} from '../contracts/examDeliverySessionContracts';
import {
  ExamVariantAssignment,
} from '../contracts/examVariantAssignmentContracts';
import {
  ExamAttempt,
  ExamAttemptQuestionSnapshot,
} from '../contracts/examAttemptContracts';
import {
  ExamAnswerSubmission,
} from '../contracts/examAnswerSubmissionContracts';
import {
  ExamAttemptSubmissionSnapshot,
} from '../contracts/examDeliverySnapshotContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';

export class ExamDeliveryProjectionSafetyService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async toTeacherProjection(deliverySessionId: string, schoolId: string): Promise<ExamDeliveryTeacherProjection | null> {
    const session = await this.repos.sessionRepository.getById(deliverySessionId);
    if (!session || session.schoolId !== schoolId) return null;

    const state = await this.repos.sessionStateRepository.getByDeliverySessionId(deliverySessionId);
    const assignments = await this.repos.variantAssignmentRepository.listByDeliverySessionId(deliverySessionId);

    return {
      deliverySessionId: session.deliverySessionId,
      schoolId: session.schoolId,
      paperId: session.paperId,
      paperVersionId: session.paperVersionId,
      sessionStatus: session.status,
      sessionMode: session.sessionMode,
      title: session.title,
      safeInstructions: session.safeInstructions,
      intendedAudienceType: session.intendedAudienceType,
      activationMode: session.activationMode,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      stateSummary: state?.safeStateSummary ?? '',
      activeAttemptCount: state?.activeAttemptCount ?? 0,
      submittedAttemptCount: state?.submittedAttemptCount ?? 0,
      assignments: assignments.map(a => this.toAssignmentTeacherView(a)),
    };
  }

  async toAdminProjection(deliverySessionId: string, schoolId: string): Promise<ExamDeliveryAdminProjection | null> {
    const session = await this.repos.sessionRepository.getById(deliverySessionId);
    if (!session || session.schoolId !== schoolId) return null;

    const state = await this.repos.sessionStateRepository.getByDeliverySessionId(deliverySessionId);

    return {
      deliverySessionId: session.deliverySessionId,
      schoolId: session.schoolId,
      paperId: session.paperId,
      paperVersionId: session.paperVersionId,
      deliveryBridgeId: session.deliveryBridgeId,
      accessPolicyId: session.accessPolicyId,
      sessionStatus: session.status,
      sessionMode: session.sessionMode,
      activationMode: session.activationMode,
      title: session.title,
      state: {
        activeAttemptCount: state?.activeAttemptCount ?? 0,
        submittedAttemptCount: state?.submittedAttemptCount ?? 0,
        pausedAttemptCount: state?.pausedAttemptCount ?? 0,
        blockedAttemptCount: state?.blockedAttemptCount ?? 0,
        version: state?.version ?? 1,
        safeStateSummary: state?.safeStateSummary ?? '',
      },
      createdByActorId: session.createdByActorId,
      createdByRole: session.createdByRole,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  async toStudentAttemptProjection(
    attemptId: string,
    schoolId: string,
    studentRef: string,
  ): Promise<ExamDeliveryStudentAttemptProjection | null> {
    const attempt = await this.repos.attemptRepository.getById(attemptId);
    if (!attempt || attempt.schoolId !== schoolId) return null;
    if (attempt.studentRef !== studentRef) return null;

    const snapshots = await this.repos.questionSnapshotRepository.listByAttemptId(attemptId);
    const answers = await this.repos.answerSubmissionRepository.listByAttemptId(attemptId);
    const submissionSnapshot = await this.repos.submissionSnapshotRepository.getByAttemptId(attemptId);

    const submittedAnswer = answers.find(a => a.answerStatus === 'submitted' || a.answerStatus === 'draft_saved');

    return {
      attemptId: attempt.attemptId,
      deliverySessionId: attempt.deliverySessionId,
      paperVersionId: attempt.paperVersionId,
      variantId: attempt.variantId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      lastSeenAt: attempt.lastSeenAt,
      durationSecondsAllowed: attempt.durationSecondsAllowed,
      durationSecondsUsed: attempt.durationSecondsUsed,
      safeAttemptSummary: attempt.safeAttemptSummary,
      questions: snapshots.map(s => this.toQuestionStudentView(s)),
      savedAnswerStatus: submittedAnswer?.answerStatus ?? null,
      submissionStatus: submissionSnapshot?.snapshotStatus ?? null,
    };
  }

  async toMarkingInputPreviewProjection(
    attemptId: string,
    schoolId: string,
  ): Promise<Record<string, unknown> | null> {
    const attempt = await this.repos.attemptRepository.getById(attemptId);
    if (!attempt || attempt.schoolId !== schoolId) return null;

    const snapshots = await this.repos.questionSnapshotRepository.listByAttemptId(attemptId);
    const answers = await this.repos.answerSubmissionRepository.listByAttemptId(attemptId);

    return {
      attemptId: attempt.attemptId,
      paperVersionId: attempt.paperVersionId,
      variantId: attempt.variantId,
      studentRef: attempt.studentRef,
      questionCount: snapshots.length,
      submittedAnswerCount: answers.filter(a => a.answerStatus === 'submitted').length,
      totalMarksAvailable: snapshots.reduce((sum, s) => sum + s.marksAvailable, 0),
      summary: 'Marking input preview (no marks calculated)',
    };
  }

  private toAssignmentTeacherView(a: ExamVariantAssignment): ExamVariantAssignmentTeacherView {
    return {
      variantAssignmentId: a.variantAssignmentId,
      studentRef: a.studentRef,
      learnerRefType: a.learnerRefType,
      assignmentStatus: a.assignmentStatus,
      assignmentStrategy: a.assignmentStrategy,
      variantId: a.variantId,
      safeAssignmentSummary: a.safeAssignmentSummary,
    };
  }

  private toQuestionStudentView(s: ExamAttemptQuestionSnapshot): ExamAttemptQuestionStudentView {
    return {
      attemptQuestionSnapshotId: s.attemptQuestionSnapshotId,
      displayOrder: s.displayOrder,
      marksAvailable: s.marksAvailable,
      studentVisiblePromptSafe: s.studentVisiblePromptSafe,
      answerInputType: s.answerInputType,
      snapshotStatus: s.snapshotStatus,
    };
  }

  assertNoAnswerKeyLeakage(data: Record<string, unknown>): boolean {
    return !STUDENT_PROJECTION_FORBIDDEN_FIELDS.some(f => f in data);
  }

  assertNoRubricLeakage(data: Record<string, unknown>): boolean {
    return !STUDENT_PROJECTION_FORBIDDEN_FIELDS.some(f => f === 'rubricInternal' || f === 'rubricText' && f in data);
  }

  assertNoTeacherOnlyLeakage(data: Record<string, unknown>): boolean {
    return !STUDENT_PROJECTION_FORBIDDEN_FIELDS.some(f => f === 'markingNotesTeacherOnly' || f === 'teacherOnlyNotes' && f in data);
  }

  assertNoHiddenReasoningLeakage(data: Record<string, unknown>): boolean {
    return !STUDENT_PROJECTION_FORBIDDEN_FIELDS.some(f => f === 'hiddenReasoning' || f === 'chainOfThought' && f in data);
  }

  assertNoFinalResultLeakage(data: Record<string, unknown>): boolean {
    return !STUDENT_PROJECTION_FORBIDDEN_FIELDS.some(f => f === 'markingResult' || f === 'score' || f === 'finalGrade' && f in data);
  }

  assertNoParentReleaseLeakage(data: Record<string, unknown>): boolean {
    return !STUDENT_PROJECTION_FORBIDDEN_FIELDS.some(f => f === 'parentReleaseStatus' && f in data);
  }
}
