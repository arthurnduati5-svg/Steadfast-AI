import { v4 as uuid } from 'uuid';
import {
  ExamAttemptSubmissionSnapshot,
  ExamAttemptSubmissionSnapshotStatus,
} from '../contracts/examDeliverySnapshotContracts';
import { ExamDeliveryCommandContext, ExamDeliveryPolicyDecision } from '../contracts/examDeliveryContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';
import { assertSubmissionSnapshotPolicy } from '../policies/examDeliveryPolicyDefinitions';

export class ExamSubmissionSnapshotService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async createDraftSubmissionSnapshot(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<{ snapshot: ExamAttemptSubmissionSnapshot | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertSubmissionSnapshotPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { snapshot: null, policy };

    const attempt = await this.repos.attemptRepository.getById(attemptId);
    if (!attempt || attempt.schoolId !== ctx.schoolId) {
      return { snapshot: null, policy: { ...policy, allowed: false, reasonCode: 'ATTEMPT_NOT_FOUND', safeMessage: 'Attempt not found' } };
    }

    const snapshots = await this.repos.questionSnapshotRepository.listByAttemptId(attemptId);
    const answers = await this.repos.answerSubmissionRepository.listByAttemptId(attemptId);
    const submittedAnswers = answers.filter(a => a.answerStatus === 'submitted');

    const snapshot = await this.repos.submissionSnapshotRepository.create({
      submissionSnapshotId: uuid(),
      schoolId: ctx.schoolId,
      attemptId,
      deliverySessionId: attempt.deliverySessionId,
      paperId: attempt.paperId,
      paperVersionId: attempt.paperVersionId,
      variantId: attempt.variantId,
      studentRef: attempt.studentRef,
      snapshotStatus: 'draft',
      submittedAnswerCount: submittedAnswers.length,
      questionSnapshotCount: snapshots.length,
      totalMarksAvailable: snapshots.reduce((sum, s) => sum + s.marksAvailable, 0),
      submissionPayloadJson: {
        questionSnapshotCount: snapshots.length,
        submittedAnswerCount: submittedAnswers.length,
        totalMarksAvailable: snapshots.reduce((sum, s) => sum + s.marksAvailable, 0),
      },
      safeSnapshotSummary: `Draft submission snapshot for attempt ${attemptId}`,
      sealedAt: null,
    });

    return { snapshot, policy };
  }

  async sealSubmissionSnapshot(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<{ snapshot: ExamAttemptSubmissionSnapshot | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertSubmissionSnapshotPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { snapshot: null, policy };

    const existing = await this.repos.submissionSnapshotRepository.getByAttemptId(attemptId);
    if (!existing) {
      const draft = await this.createDraftSubmissionSnapshot(ctx, attemptId);
      if (!draft.snapshot) return { snapshot: null, policy: draft.policy };
      const now = new Date().toISOString();
      const snapshot = await this.repos.submissionSnapshotRepository.updateStatus(draft.snapshot.submissionSnapshotId, 'sealed', now);
      return { snapshot, policy };
    }

    if (existing.snapshotStatus === 'sealed') {
      return { snapshot: existing, policy };
    }

    const now = new Date().toISOString();
    const snapshot = await this.repos.submissionSnapshotRepository.updateStatus(existing.submissionSnapshotId, 'sealed', now);
    return { snapshot, policy };
  }

  async voidSubmissionSnapshot(
    ctx: ExamDeliveryCommandContext,
    submissionSnapshotId: string,
  ): Promise<{ snapshot: ExamAttemptSubmissionSnapshot | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertSubmissionSnapshotPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { snapshot: null, policy };

    const snapshot = await this.repos.submissionSnapshotRepository.updateStatus(submissionSnapshotId, 'void');
    return { snapshot, policy };
  }

  async getSubmissionSnapshot(attemptId: string): Promise<ExamAttemptSubmissionSnapshot | null> {
    return this.repos.submissionSnapshotRepository.getByAttemptId(attemptId);
  }

  async buildSnapshotForFutureMarking(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<{ snapshot: ExamAttemptSubmissionSnapshot | null; policy: ExamDeliveryPolicyDecision }> {
    return this.sealSubmissionSnapshot(ctx, attemptId);
  }

  async validateSnapshotCompleteness(
    ctx: ExamDeliveryCommandContext,
    submissionSnapshotId: string,
  ): Promise<{ complete: boolean; reason: string }> {
    const snapshot = await this.repos.submissionSnapshotRepository.getById(submissionSnapshotId);
    if (!snapshot) return { complete: false, reason: 'Snapshot not found' };
    if (snapshot.snapshotStatus !== 'sealed') return { complete: false, reason: `Snapshot is ${snapshot.snapshotStatus}, must be sealed` };
    if (snapshot.submittedAnswerCount === 0) return { complete: false, reason: 'No submitted answers' };
    if (snapshot.totalMarksAvailable === 0) return { complete: false, reason: 'Total marks available is zero' };
    return { complete: true, reason: 'Snapshot is complete for marking' };
  }
}
