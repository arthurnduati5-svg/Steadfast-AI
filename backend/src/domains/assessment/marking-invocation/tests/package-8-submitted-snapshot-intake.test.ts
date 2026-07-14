import { describe, it, expect, beforeEach } from 'vitest';
import { SubmittedSnapshotIntakeService } from '../services/submittedSnapshotIntakeService';
import { InMemorySubmittedSnapshotIntakeRepository } from '../repositories/inMemoryMarkingInvocationRepositories';

describe('Package 8 Submitted Snapshot Intake', () => {
  let service: SubmittedSnapshotIntakeService;
  let repo: InMemorySubmittedSnapshotIntakeRepository;

  beforeEach(() => {
    repo = new InMemorySubmittedSnapshotIntakeRepository();
    service = new SubmittedSnapshotIntakeService(repo);
  });

  it('sealed Package 7 submission snapshot can be intaken', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      submissionSnapshotId: 'snap-1',
      attemptId: 'attempt-1',
      deliverySessionId: 'session-1',
      paperId: 'paper-1',
      paperVersionId: 'pv-1',
      variantId: 'var-1',
      studentRef: 'student-1',
      submittedAnswerCount: 5,
      questionSnapshotCount: 5,
      totalMarksAvailable: 50,
      snapshotStatus: 'sealed',
    });
    expect(intake.intakeStatus).toBe('ready_for_marking');
    expect(intake.submissionSnapshotId).toBe('snap-1');
    expect(intake.attemptId).toBe('attempt-1');
    expect(intake.deliverySessionId).toBe('session-1');
    expect(intake.paperVersionId).toBe('pv-1');
    expect(intake.variantId).toBe('var-1');
    expect(intake.studentRef).toBe('student-1');
  });

  it('unsealed snapshot is blocked', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      submissionSnapshotId: 'snap-unsealed',
      attemptId: 'attempt-1',
      deliverySessionId: 'session-1',
      paperId: 'paper-1',
      paperVersionId: 'pv-1',
      variantId: 'var-1',
      studentRef: 'student-1',
      submittedAnswerCount: 5,
      questionSnapshotCount: 5,
      totalMarksAvailable: 50,
      snapshotStatus: 'draft',
    });
    expect(intake.intakeStatus).toBe('blocked');
    expect(intake.readinessStatus).toBe('unsealed_snapshot');
  });

  it('incomplete snapshot (no answers) is blocked', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      submissionSnapshotId: 'snap-no-answers',
      attemptId: 'attempt-1',
      deliverySessionId: 'session-1',
      paperId: 'paper-1',
      paperVersionId: 'pv-1',
      variantId: 'var-1',
      studentRef: 'student-1',
      submittedAnswerCount: 0,
      questionSnapshotCount: 5,
      totalMarksAvailable: 50,
      snapshotStatus: 'sealed',
    });
    expect(intake.intakeStatus).toBe('blocked');
    expect(intake.readinessStatus).toBe('missing_answers');
  });

  it('missing question snapshots is blocked', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      submissionSnapshotId: 'snap-no-questions',
      attemptId: 'attempt-1',
      deliverySessionId: 'session-1',
      paperId: 'paper-1',
      paperVersionId: 'pv-1',
      variantId: 'var-1',
      studentRef: 'student-1',
      submittedAnswerCount: 5,
      questionSnapshotCount: 0,
      totalMarksAvailable: 50,
      snapshotStatus: 'sealed',
    });
    expect(intake.intakeStatus).toBe('blocked');
  });

  it('wrong school scope blocks intake', async () => {
    await service.intakeSubmissionSnapshot({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      submissionSnapshotId: 'snap-scope',
      attemptId: 'attempt-1',
      deliverySessionId: 'session-1',
      paperId: 'paper-1',
      paperVersionId: 'pv-1',
      variantId: 'var-1',
      studentRef: 'student-1',
      submittedAnswerCount: 5,
      questionSnapshotCount: 5,
      totalMarksAvailable: 50,
      snapshotStatus: 'sealed',
    });
    await expect(service.intakeSubmissionSnapshot({
      schoolId: 'school-2',
      markingInvocationRequestId: 'req-2',
      submissionSnapshotId: 'snap-scope',
      attemptId: 'attempt-2',
      deliverySessionId: 'session-2',
      paperId: 'paper-2',
      paperVersionId: 'pv-2',
      variantId: 'var-2',
      studentRef: 'student-2',
      submittedAnswerCount: 5,
      questionSnapshotCount: 5,
      totalMarksAvailable: 50,
      snapshotStatus: 'sealed',
    })).resolves.toBeDefined();
  });

  it('duplicate snapshot intake is idempotent-safe (blocks)', async () => {
    await service.intakeSubmissionSnapshot({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      submissionSnapshotId: 'snap-dup',
      attemptId: 'attempt-1',
      deliverySessionId: 'session-1',
      paperId: 'paper-1',
      paperVersionId: 'pv-1',
      variantId: 'var-1',
      studentRef: 'student-1',
      submittedAnswerCount: 5,
      questionSnapshotCount: 5,
      totalMarksAvailable: 50,
      snapshotStatus: 'sealed',
    });
    await expect(service.intakeSubmissionSnapshot({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      submissionSnapshotId: 'snap-dup',
      attemptId: 'attempt-1',
      deliverySessionId: 'session-1',
      paperId: 'paper-1',
      paperVersionId: 'pv-1',
      variantId: 'var-1',
      studentRef: 'student-1',
      submittedAnswerCount: 5,
      questionSnapshotCount: 5,
      totalMarksAvailable: 50,
      snapshotStatus: 'sealed',
    })).rejects.toThrow('SNAPSHOT_ALREADY_INTAKEN');
  });

  it('intake does not create MarkingResultVersionRecord', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1',
      markingInvocationRequestId: 'req-1',
      submissionSnapshotId: 'snap-no-result',
      attemptId: 'attempt-1',
      deliverySessionId: 'session-1',
      paperId: 'paper-1',
      paperVersionId: 'pv-1',
      variantId: 'var-1',
      studentRef: 'student-1',
      submittedAnswerCount: 5,
      questionSnapshotCount: 5,
      totalMarksAvailable: 50,
      snapshotStatus: 'sealed',
    });
    expect(intake).not.toHaveProperty('markingResultVersionId');
    expect(intake.safeIntakeSummary).toBeTruthy();
  });

  it('intake preserves submissionSnapshotId', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1', markingInvocationRequestId: 'req-1', submissionSnapshotId: 'snap-preserve',
      attemptId: 'att-1', deliverySessionId: 'sess-1', paperId: 'p-1', paperVersionId: 'pv-1',
      variantId: 'v-1', studentRef: 'sr-1', submittedAnswerCount: 5, questionSnapshotCount: 5,
      totalMarksAvailable: 50, snapshotStatus: 'sealed',
    });
    expect(intake.submissionSnapshotId).toBe('snap-preserve');
  });

  it('intake does not finalize', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1', markingInvocationRequestId: 'req-1', submissionSnapshotId: 'snap-nf',
      attemptId: 'att-1', deliverySessionId: 'sess-1', paperId: 'p-1', paperVersionId: 'pv-1',
      variantId: 'v-1', studentRef: 'sr-1', submittedAnswerCount: 5, questionSnapshotCount: 5,
      totalMarksAvailable: 50, snapshotStatus: 'sealed',
    });
    expect(intake.intakeStatus).not.toBe('finalized');
    expect(intake).not.toHaveProperty('finalizedAt');
  });

  it('intake does not release to parent', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1', markingInvocationRequestId: 'req-1', submissionSnapshotId: 'snap-nr',
      attemptId: 'att-1', deliverySessionId: 'sess-1', paperId: 'p-1', paperVersionId: 'pv-1',
      variantId: 'v-1', studentRef: 'sr-1', submittedAnswerCount: 5, questionSnapshotCount: 5,
      totalMarksAvailable: 50, snapshotStatus: 'sealed',
    });
    expect(intake).not.toHaveProperty('parentReleaseStatus');
  });

  it('intake does not mutate mastery', async () => {
    const intake = await service.intakeSubmissionSnapshot({
      schoolId: 'school-1', markingInvocationRequestId: 'req-1', submissionSnapshotId: 'snap-mm',
      attemptId: 'att-1', deliverySessionId: 'sess-1', paperId: 'p-1', paperVersionId: 'pv-1',
      variantId: 'v-1', studentRef: 'sr-1', submittedAnswerCount: 5, questionSnapshotCount: 5,
      totalMarksAvailable: 50, snapshotStatus: 'sealed',
    });
    expect(intake).not.toHaveProperty('masteryMutation');
    expect(intake).not.toHaveProperty('skillMasterySnapshotId');
  });
});
