import { describe, it, expect, beforeAll } from 'vitest';
import { v4 as uuid } from 'uuid';
import { createInMemoryExamDeliveryRepositories } from '../repositories/inMemoryExamDeliveryRepositories';
import { ExamDeliverySessionService } from '../services/examDeliverySessionService';
import { ExamDeliveryActivationService } from '../services/examDeliveryActivationService';
import { ExamVariantAssignmentService } from '../services/examVariantAssignmentService';
import { ExamAttemptService } from '../services/examAttemptService';
import { ExamAttemptQuestionSnapshotService } from '../services/examAttemptQuestionSnapshotService';
import { ExamAnswerSubmissionService } from '../services/examAnswerSubmissionService';
import { ExamTimingService } from '../services/examTimingService';
import { ExamDeliveryCommandContext } from '../contracts/examDeliveryContracts';

describe('Package 7 - Attempt Capture', () => {
  const repos = createInMemoryExamDeliveryRepositories();
  const sessionService = new ExamDeliverySessionService(repos);
  const activationService = new ExamDeliveryActivationService(repos);
  const assignmentService = new ExamVariantAssignmentService(repos);
  const attemptService = new ExamAttemptService(repos);
  const questionSnapshotService = new ExamAttemptQuestionSnapshotService(repos);
  const answerService = new ExamAnswerSubmissionService(repos);
  const timingService = new ExamTimingService(repos);
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
      title: 'Attempt Test', safeInstructions: 'Test', intendedAudienceType: 'class',
      sessionMode: 'teacher_controlled', activationMode: 'manual_teacher_activation',
    });
    sessionId = session!.deliverySessionId;
    await activationService.openDeliverySession(teacherCtx, sessionId);
    const { assignment } = await assignmentService.assignVariantToStudent(teacherCtx, {
      deliverySessionId: sessionId, paperId: 'paper1', paperVersionId: 'pv1',
      variantId: 'variant1', studentRef: 'student1', learnerRefType: 'mock_student_ref',
      assignmentStrategy: 'manual_teacher_assignment', safeAssignmentSummary: 'Test assign',
    });
    assignmentId = assignment!.variantAssignmentId;
  });

  it('attempt can start only from valid assignment', async () => {
    const invalidCtx: ExamDeliveryCommandContext = {
      schoolId, actorId: 'student1', actorRole: 'student', correlationId: uuid(), idempotencyKey: uuid(),
    };
    const { attempt: invalid } = await attemptService.startAttempt(invalidCtx, {
      deliverySessionId: sessionId, variantAssignmentId: 'nonexistent', studentRef: 'student1', durationSecondsAllowed: 3600,
    });
    expect(invalid).toBeNull();
  });

  it('attempt creates runtime shell', async () => {
    const { attempt, policy } = await attemptService.startAttempt(studentCtx, {
      deliverySessionId: sessionId, variantAssignmentId: assignmentId, studentRef: 'student1', durationSecondsAllowed: 3600,
    });
    expect(policy.allowed).toBe(true);
    expect(attempt).not.toBeNull();
    expect(attempt!.status).toBe('in_progress');
    expect(attempt!.startedAt).not.toBeNull();
    expect(attempt!.durationSecondsAllowed).toBe(3600);
    attemptId = attempt!.attemptId;
  });

  it('attempt creates question snapshots', async () => {
    const snapshots = await questionSnapshotService.createQuestionSnapshotsForAttempt(attemptId, sessionId, schoolId, [
      {
        variantQuestionId: 'vq1', paperQuestionId: 'pq1', questionId: 'q1', questionVersionId: 'qv1',
        sectionKey: 'A', variantPosition: 1, marksAllocated: 5,
        studentVisiblePromptSafe: 'What is 2+2?', answerInputType: 'text',
      },
      {
        variantQuestionId: 'vq2', paperQuestionId: 'pq2', questionId: 'q2', questionVersionId: 'qv2',
        sectionKey: 'A', variantPosition: 2, marksAllocated: 10,
        studentVisiblePromptSafe: 'Explain gravity', answerInputType: 'text',
      },
    ]);
    expect(snapshots.length).toBe(2);
  });

  it('question snapshots preserve questionVersionId', async () => {
    const snapshots = await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId);
    expect(snapshots[0].questionVersionId).toBe('qv1');
    expect(snapshots[1].questionVersionId).toBe('qv2');
  });

  it('question snapshots preserve variantQuestionId', async () => {
    const snapshots = await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId);
    expect(snapshots[0].variantQuestionId).toBe('vq1');
    expect(snapshots[1].variantQuestionId).toBe('vq2');
  });

  it('question snapshots preserve paperQuestionId', async () => {
    const snapshots = await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId);
    expect(snapshots[0].paperQuestionId).toBe('pq1');
    expect(snapshots[1].paperQuestionId).toBe('pq2');
  });

  it('question snapshots do not include answer key text', async () => {
    const snapshots = await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId);
    for (const s of snapshots) {
      expect(s.studentVisiblePromptSafe).not.toContain('ANSWER:');
      expect(s.answerInputType).toBeDefined();
    }
  });

  it('draft answer can be saved', async () => {
    const snapshotId = (await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId))[0].attemptQuestionSnapshotId;
    const { submission } = await answerService.saveDraftAnswer(studentCtx, {
      attemptId, attemptQuestionSnapshotId: snapshotId, deliverySessionId: sessionId,
      studentRef: 'student1', answerTextSafe: '4',
    });
    expect(submission).not.toBeNull();
    expect(submission!.answerStatus).toBe('draft_saved');
    expect(submission!.revisionNumber).toBe(1);
  });

  it('submitted answer can be stored', async () => {
    const snapshotId = (await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId))[1].attemptQuestionSnapshotId;
    const { submission } = await answerService.submitAnswer(studentCtx, {
      attemptId, attemptQuestionSnapshotId: snapshotId, deliverySessionId: sessionId,
      studentRef: 'student1', answerTextSafe: 'Gravity pulls objects toward Earth',
    });
    expect(submission).not.toBeNull();
    expect(submission!.answerStatus).toBe('submitted');
    expect(submission!.isFinal).toBe(true);
  });

  it('answer revision numbers increment', async () => {
    const snapshotId = (await questionSnapshotService.listQuestionSnapshotsForAttempt(attemptId))[0].attemptQuestionSnapshotId;
    await answerService.saveDraftAnswer(studentCtx, {
      attemptId, attemptQuestionSnapshotId: snapshotId, deliverySessionId: sessionId,
      studentRef: 'student1', answerTextSafe: '4 (four)',
    });
    const latest = await answerService.getLatestAnswerForQuestion(snapshotId);
    expect(latest).not.toBeNull();
    expect(latest!.revisionNumber).toBeGreaterThanOrEqual(2);
  });

  it('attempt can submit', async () => {
    const attempt = await attemptService.submitAttempt(studentCtx, attemptId);
    expect(attempt).not.toBeNull();
    expect(attempt!.status).toBe('submitted');
  });

  it('timing events can be recorded', async () => {
    const event = await timingService.recordAttemptStarted(schoolId, attemptId, sessionId, 3600);
    expect(event).not.toBeNull();
    expect(event.eventType).toBe('started');
  });
});
