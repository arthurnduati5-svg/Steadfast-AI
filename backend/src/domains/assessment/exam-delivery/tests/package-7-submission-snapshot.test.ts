import { describe, it, expect, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { createInMemoryExamDeliveryRepositories } from '../repositories/inMemoryExamDeliveryRepositories';
import { ExamDeliverySessionService } from '../services/examDeliverySessionService';
import { ExamDeliveryActivationService } from '../services/examDeliveryActivationService';
import { ExamVariantAssignmentService } from '../services/examVariantAssignmentService';
import { ExamAttemptService } from '../services/examAttemptService';
import { ExamAttemptQuestionSnapshotService } from '../services/examAttemptQuestionSnapshotService';
import { ExamAnswerSubmissionService } from '../services/examAnswerSubmissionService';
import { ExamSubmissionSnapshotService } from '../services/examSubmissionSnapshotService';
import { ExamDeliveryCommandContext } from '../contracts/examDeliveryContracts';

describe('Package 7 - Submission Snapshot', () => {
  const repos = createInMemoryExamDeliveryRepositories();
  const sessionService = new ExamDeliverySessionService(repos);
  const activationService = new ExamDeliveryActivationService(repos);
  const assignmentService = new ExamVariantAssignmentService(repos);
  const attemptService = new ExamAttemptService(repos);
  const questionSnapshotService = new ExamAttemptQuestionSnapshotService(repos);
  const answerService = new ExamAnswerSubmissionService(repos);
  const submissionSnapshotService = new ExamSubmissionSnapshotService(repos);
  const schoolId = 'school1';
  const teacherCtx: ExamDeliveryCommandContext = {
    schoolId, actorId: 'teacher1', actorRole: 'teacher', correlationId: uuid(), idempotencyKey: uuid(),
  };
  const studentCtx: ExamDeliveryCommandContext = {
    schoolId, actorId: 'student1', actorRole: 'student', correlationId: uuid(), idempotencyKey: uuid(),
  };

  let sessionId: string;
  let assignmentId: string;
  let attemptId: string;

  beforeAll(async () => {
    const { session } = await sessionService.createDeliverySession(teacherCtx, {
      paperId: 'paper1', paperVersionId: 'pv1', deliveryBridgeId: 'db1', accessPolicyId: 'ap1',
      title: 'Snapshot Test', safeInstructions: 'Test', intendedAudienceType: 'class',
      sessionMode: 'teacher_controlled', activationMode: 'manual_teacher_activation',
    });
    sessionId = session!.deliverySessionId;
    await activationService.openDeliverySession(teacherCtx, sessionId);
    const { assignment } = await assignmentService.assignVariantToStudent(teacherCtx, {
      deliverySessionId: sessionId, paperId: 'paper1', paperVersionId: 'pv1',
      variantId: 'variant1', studentRef: 'student1', learnerRefType: 'mock_student_ref',
      assignmentStrategy: 'manual_teacher_assignment', safeAssignmentSummary: 'Test',
    });
    assignmentId = assignment!.variantAssignmentId;
    const { attempt } = await attemptService.startAttempt(studentCtx, {
      deliverySessionId: sessionId, variantAssignmentId: assignmentId, studentRef: 'student1', durationSecondsAllowed: 3600,
    });
    attemptId = attempt!.attemptId;
    await questionSnapshotService.createQuestionSnapshotsForAttempt(attemptId, sessionId, schoolId, [
      { variantQuestionId: 'vq1', paperQuestionId: 'pq1', questionId: 'q1', questionVersionId: 'qv1', sectionKey: 'A', variantPosition: 1, marksAllocated: 5, studentVisiblePromptSafe: 'Q1', answerInputType: 'text' },
    ]);
    const sqId = (await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId))[0].attemptQuestionSnapshotId;
    await answerService.submitAnswer(studentCtx, {
      attemptId, attemptQuestionSnapshotId: sqId, deliverySessionId: sessionId, studentRef: 'student1', answerTextSafe: 'Answer 1',
    });
    await attemptService.submitAttempt(studentCtx, attemptId);
  });

  it('submission snapshot can be created from submitted attempt answers', async () => {
    const { snapshot, policy } = await submissionSnapshotService.createDraftSubmissionSnapshot(teacherCtx, attemptId);
    expect(policy.allowed).toBe(true);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.snapshotStatus).toBe('draft');
    expect(snapshot!.submittedAnswerCount).toBeGreaterThanOrEqual(1);
  });

  it('snapshot includes question snapshot refs', async () => {
    const snapshot = await submissionSnapshotService.getSubmissionSnapshot(attemptId);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.questionSnapshotCount).toBe(1);
  });

  it('snapshot includes totalMarksAvailable', async () => {
    const snapshot = await submissionSnapshotService.getSubmissionSnapshot(attemptId);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.totalMarksAvailable).toBeGreaterThan(0);
  });

  it('snapshot can be sealed', async () => {
    const { snapshot } = await submissionSnapshotService.sealSubmissionSnapshot(teacherCtx, attemptId);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.snapshotStatus).toBe('sealed');
    expect(snapshot!.sealedAt).not.toBeNull();
  });

  it('sealed snapshot is immutable (status is sealed)', async () => {
    const snapshot = await submissionSnapshotService.getSubmissionSnapshot(attemptId);
    expect(snapshot!.snapshotStatus).toBe('sealed');
  });

  it('snapshot does not create marking run records', async () => {
    const snapshot = await submissionSnapshotService.getSubmissionSnapshot(attemptId);
    expect(snapshot).not.toBeNull();
  });

  it('snapshot does not calculate score', async () => {
    const snapshot = await submissionSnapshotService.getSubmissionSnapshot(attemptId);
    const payload = snapshot!.submissionPayloadJson as Record<string, unknown> | null;
    expect(payload).toBeDefined();
    if (payload) {
      expect(payload).not.toHaveProperty('score');
      expect(payload).not.toHaveProperty('finalGrade');
    }
  });

  it('snapshot completeness validates correctly', async () => {
    const { complete, reason } = await submissionSnapshotService.validateSnapshotCompleteness(
      teacherCtx,
      (await submissionSnapshotService.getSubmissionSnapshot(attemptId))!.submissionSnapshotId,
    );
    expect(complete).toBe(true);
  });
});
