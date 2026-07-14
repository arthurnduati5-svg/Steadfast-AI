import { describe, it, expect } from 'vitest';
import { StudentChallengeService } from '../services/studentChallengeService';
import { MarkingRunService } from '../services/markingRunService';
import { InMemoryStudentMarkChallengeRepository, InMemoryMarkingResultVersionRepository } from '../repositories/inMemoryMarkingRepositories';
import { SubmittedAnswerSnapshot } from '../contracts/markingContracts';
import { MarkingInputSnapshot } from '../contracts/markingResultContracts';

describe('Package 5 - Student Challenge', () => {
  it('student can submit challenge against own marking result when ownership snapshot allows', async () => {
    const challengeRepo = new InMemoryStudentMarkChallengeRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-challenge-1', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: 'Incorrect.', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const service = new StudentChallengeService(challengeRepo, resultRepo);
    const challenge = await service.submitChallenge({
      schoolId: 'school-1', studentId: 'student-1',
      markingResultVersionId: 'rv-challenge-1',
      challengeReasonCode: 'answer_disputed',
      safeStudentStatement: 'My answer was correct.',
    });
    expect(challenge.status).toBe('submitted');
    expect(challenge.studentId).toBe('student-1');
    expect(challenge.safeStudentStatement).toBe('My answer was correct.');
  });

  it('challenge does not expose answer key', async () => {
    const challengeRepo = new InMemoryStudentMarkChallengeRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-challenge-2', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const service = new StudentChallengeService(challengeRepo, resultRepo);
    const challenge = await service.submitChallenge({
      schoolId: 'school-1', studentId: 'student-1',
      markingResultVersionId: 'rv-challenge-2',
      challengeReasonCode: 'answer_disputed',
      safeStudentStatement: 'Please review my answer.',
    });
    expect((challenge as any).answerKeySafeRef).toBeUndefined();
    expect((challenge as any).correctAnswerSummary).toBeUndefined();
  });

  it('challenge can route to moderation', async () => {
    const challengeRepo = new InMemoryStudentMarkChallengeRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-challenge-3', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const service = new StudentChallengeService(challengeRepo, resultRepo);
    const challenge = await service.submitChallenge({
      schoolId: 'school-1', studentId: 'student-1',
      markingResultVersionId: 'rv-challenge-3',
      challengeReasonCode: 'answer_disputed',
      safeStudentStatement: 'Dispute.',
    });
    const reviewed = await service.reviewChallenge(challenge.studentMarkChallengeId, 'moderator-1', 'lead_teacher');
    expect(reviewed.status).toBe('under_review');
    expect(reviewed.reviewedByActorId).toBe('moderator-1');
  });

  it('challenge resolution does not finalize result', async () => {
    const challengeRepo = new InMemoryStudentMarkChallengeRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-challenge-4', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const service = new StudentChallengeService(challengeRepo, resultRepo);
    const challenge = await service.submitChallenge({
      schoolId: 'school-1', studentId: 'student-1',
      markingResultVersionId: 'rv-challenge-4',
      challengeReasonCode: 'answer_disputed',
      safeStudentStatement: 'Please review.',
    });
    const resolved = await service.resolveChallenge(challenge.studentMarkChallengeId, 'upheld_original', 'Original marks stand.');
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolution).toBe('upheld_original');
    const result = await resultRepo.findById('rv-challenge-4');
    expect(result!.status).toBe('challenged');
  });

  it('challenge resolution does not mutate mastery', async () => {
    const challengeRepo = new InMemoryStudentMarkChallengeRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-mastery-test', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const service = new StudentChallengeService(challengeRepo, resultRepo);
    const challenge = await service.submitChallenge({
      schoolId: 'school-1', studentId: 'student-1',
      markingResultVersionId: 'rv-mastery-test',
      challengeReasonCode: 'answer_disputed',
      safeStudentStatement: 'Review.',
    });
    const resolved = await service.resolveChallenge(challenge.studentMarkChallengeId, 'adjusted', 'Marks adjusted');
    expect(resolved.status).toBe('resolved');
  });

  it('student can withdraw own challenge', async () => {
    const challengeRepo = new InMemoryStudentMarkChallengeRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-withdraw', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const service = new StudentChallengeService(challengeRepo, resultRepo);
    const challenge = await service.submitChallenge({
      schoolId: 'school-1', studentId: 'student-1',
      markingResultVersionId: 'rv-withdraw',
      challengeReasonCode: 'answer_disputed',
      safeStudentStatement: 'Test.',
    });
    const withdrawn = await service.withdrawChallenge(challenge.studentMarkChallengeId, 'student-1');
    expect(withdrawn.status).toBe('withdrawn');
  });

  it('student cannot withdraw another student\'s challenge', async () => {
    const challengeRepo = new InMemoryStudentMarkChallengeRepository();
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-withdraw-2', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const service = new StudentChallengeService(challengeRepo, resultRepo);
    const challenge = await service.submitChallenge({
      schoolId: 'school-1', studentId: 'student-1',
      markingResultVersionId: 'rv-withdraw-2',
      challengeReasonCode: 'answer_disputed',
      safeStudentStatement: 'Test.',
    });
    await expect(service.withdrawChallenge(challenge.studentMarkChallengeId, 'student-2')).rejects.toThrow('FORBIDDEN');
  });
});
