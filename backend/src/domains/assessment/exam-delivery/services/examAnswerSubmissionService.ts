import { v4 as uuid } from 'uuid';
import {
  ExamAnswerSubmission,
  ExamAnswerSubmissionStatus,
} from '../contracts/examAnswerSubmissionContracts';
import { ExamDeliveryCommandContext, ExamDeliveryPolicyDecision } from '../contracts/examDeliveryContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';
import { assertAnswerCapturePolicy } from '../policies/examDeliveryPolicyDefinitions';

export class ExamAnswerSubmissionService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async saveDraftAnswer(
    ctx: ExamDeliveryCommandContext,
    params: {
      attemptId: string;
      attemptQuestionSnapshotId: string;
      deliverySessionId: string;
      studentRef: string;
      answerTextSafe: string;
      answerPayloadJson?: Record<string, unknown>;
      attachmentRefsJson?: Record<string, unknown>;
      clientSavedAt?: string;
    },
  ): Promise<{ submission: ExamAnswerSubmission | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertAnswerCapturePolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { submission: null, policy };

    const existing = await this.repos.answerSubmissionRepository.getByQuestionSnapshotId(params.attemptQuestionSnapshotId);
    if (existing && existing.answerStatus === 'submitted') {
      return { submission: null, policy: { ...policy, allowed: false, reasonCode: 'ANSWER_ALREADY_SUBMITTED', safeMessage: 'Answer already submitted as final' } };
    }

    if (existing) {
      const submission = await this.repos.answerSubmissionRepository.update({
        answerSubmissionId: existing.answerSubmissionId,
        answerStatus: 'draft_saved',
        answerTextSafe: params.answerTextSafe,
        answerPayloadJson: params.answerPayloadJson ?? null,
        attachmentRefsJson: params.attachmentRefsJson ?? null,
        clientSavedAt: params.clientSavedAt ?? null,
        revisionNumber: existing.revisionNumber + 1,
        isFinal: false,
        safeSubmissionSummary: `Draft saved, revision ${existing.revisionNumber + 1}`,
      });
      return { submission, policy };
    }

    const submission = await this.repos.answerSubmissionRepository.create({
      answerSubmissionId: uuid(),
      schoolId: ctx.schoolId,
      attemptId: params.attemptId,
      attemptQuestionSnapshotId: params.attemptQuestionSnapshotId,
      deliverySessionId: params.deliverySessionId,
      studentRef: params.studentRef,
      answerStatus: 'draft_saved',
      answerTextSafe: params.answerTextSafe,
      answerPayloadJson: params.answerPayloadJson ?? null,
      attachmentRefsJson: params.attachmentRefsJson ?? null,
      clientSavedAt: params.clientSavedAt ?? null,
      serverReceivedAt: new Date().toISOString(),
      revisionNumber: 1,
      isFinal: false,
      safeSubmissionSummary: 'Draft answer saved',
    });

    return { submission, policy };
  }

  async submitAnswer(
    ctx: ExamDeliveryCommandContext,
    params: {
      attemptId: string;
      attemptQuestionSnapshotId: string;
      deliverySessionId: string;
      studentRef: string;
      answerTextSafe: string;
      answerPayloadJson?: Record<string, unknown>;
      attachmentRefsJson?: Record<string, unknown>;
      clientSavedAt?: string;
    },
  ): Promise<{ submission: ExamAnswerSubmission | null; policy: ExamDeliveryPolicyDecision }> {
    const draft = await this.saveDraftAnswer(ctx, params);
    if (!draft.submission) return draft;

    const submission = await this.repos.answerSubmissionRepository.update({
      answerSubmissionId: draft.submission.answerSubmissionId,
      answerStatus: 'submitted',
      isFinal: true,
      safeSubmissionSummary: 'Answer submitted as final',
    });

    return { submission, policy: draft.policy };
  }

  async withdrawAnswer(
    ctx: ExamDeliveryCommandContext,
    answerSubmissionId: string,
  ): Promise<ExamAnswerSubmission | null> {
    return this.repos.answerSubmissionRepository.updateStatus(answerSubmissionId, 'withdrawn');
  }

  async listAnswersForAttempt(attemptId: string): Promise<ExamAnswerSubmission[]> {
    return this.repos.answerSubmissionRepository.listByAttemptId(attemptId);
  }

  async getLatestAnswerForQuestion(attemptQuestionSnapshotId: string): Promise<ExamAnswerSubmission | null> {
    return this.repos.answerSubmissionRepository.getByQuestionSnapshotId(attemptQuestionSnapshotId);
  }

  validateAnswerPayload(params: { answerTextSafe?: string; answerPayloadJson?: Record<string, unknown> }): string | null {
    if (!params.answerTextSafe && !params.answerPayloadJson) {
      return 'Answer text or payload is required';
    }
    if (params.answerTextSafe && params.answerTextSafe.length > 50000) {
      return 'Answer text exceeds maximum length';
    }
    return null;
  }
}
