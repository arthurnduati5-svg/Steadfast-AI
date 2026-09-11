import { v4 as uuid } from 'uuid';
import {
  ExamAttempt,
  ExamAttemptStatus,
  ExamAttemptQuestionSnapshot,
} from '../contracts/examAttemptContracts';
import { ExamDeliveryCommandContext, ExamDeliveryPolicyDecision } from '../contracts/examDeliveryContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';
import { assertAttemptStartPolicy } from '../policies/examDeliveryPolicyDefinitions';

export type AttemptSubmitOutcome =
  | { outcome: 'submitted'; attempt: ExamAttempt }
  | { outcome: 'already_submitted'; attempt: ExamAttempt }
  | { outcome: 'not_found' }
  | { outcome: 'conflict'; currentStatus: string };

export class ExamAttemptService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async startAttempt(
    ctx: ExamDeliveryCommandContext,
    params: {
      deliverySessionId: string;
      variantAssignmentId: string;
      studentRef: string;
      durationSecondsAllowed: number;
    },
  ): Promise<{ attempt: ExamAttempt | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertAttemptStartPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { attempt: null, policy };

    const session = await this.repos.sessionRepository.getById(params.deliverySessionId);
    if (!session || session.schoolId !== ctx.schoolId) {
      return { attempt: null, policy: { ...policy, allowed: false, reasonCode: 'SESSION_NOT_FOUND', safeMessage: 'Delivery session not found' } };
    }

    const assignment = await this.repos.variantAssignmentRepository.getById(params.variantAssignmentId);
    if (!assignment || assignment.schoolId !== ctx.schoolId) {
      return { attempt: null, policy: { ...policy, allowed: false, reasonCode: 'ASSIGNMENT_NOT_FOUND', safeMessage: 'Variant assignment not found' } };
    }
    if (assignment.assignmentStatus === 'revoked') {
      return { attempt: null, policy: { ...policy, allowed: false, reasonCode: 'ASSIGNMENT_REVOKED', safeMessage: 'Assignment has been revoked' } };
    }
    if (assignment.studentRef !== params.studentRef) {
      return { attempt: null, policy: { ...policy, allowed: false, reasonCode: 'STUDENT_MISMATCH', safeMessage: 'Student ref does not match assignment' } };
    }

    const existing = await this.repos.attemptRepository.getByAssignmentAndStudent(params.variantAssignmentId, params.studentRef);
    if (existing && existing.status !== 'cancelled' && existing.status !== 'blocked' && existing.status !== 'expired') {
      return { attempt: null, policy: { ...policy, allowed: false, reasonCode: 'ATTEMPT_ALREADY_STARTED', safeMessage: 'An active attempt already exists for this assignment' } };
    }

    const now = new Date().toISOString();
    const attempt = await this.repos.attemptRepository.create({
      attemptId: uuid(),
      schoolId: ctx.schoolId,
      deliverySessionId: params.deliverySessionId,
      variantAssignmentId: params.variantAssignmentId,
      paperId: assignment.paperId,
      paperVersionId: assignment.paperVersionId,
      variantId: assignment.variantId,
      studentRef: params.studentRef,
      status: 'in_progress',
      attemptNumber: (existing?.attemptNumber ?? 0) + 1,
      startedAt: now,
      lastSeenAt: now,
      submittedAt: null,
      autoSubmittedAt: null,
      cancelledAt: null,
      blockedAt: null,
      durationSecondsAllowed: params.durationSecondsAllowed,
      durationSecondsUsed: 0,
      safeAttemptSummary: `Attempt started for student ${params.studentRef}`,
    });

    await this.repos.auditRepository.create({
      deliveryAuditId: uuid(),
      schoolId: ctx.schoolId,
      deliverySessionId: params.deliverySessionId,
      attemptId: attempt.attemptId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'attempt_started',
      decision: 'allowed',
      safeSummary: `Attempt ${attempt.attemptId} started`,
      reasonCodesJson: null,
      metadataJson: null,
      requestId: null,
      correlationId: ctx.correlationId ?? null,
    });

    return { attempt, policy };
  }

  async getAttempt(attemptId: string): Promise<ExamAttempt | null> {
    return this.repos.attemptRepository.getById(attemptId);
  }

  async pauseAttempt(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<ExamAttempt | null> {
    return this.repos.attemptRepository.updateStatus(attemptId, 'paused');
  }

  async resumeAttempt(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<ExamAttempt | null> {
    return this.repos.attemptRepository.updateStatus(attemptId, 'in_progress');
  }

  async cancelAttempt(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<ExamAttempt | null> {
    return this.repos.attemptRepository.updateStatus(attemptId, 'cancelled');
  }

  async blockAttempt(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<ExamAttempt | null> {
    return this.repos.attemptRepository.updateStatus(attemptId, 'blocked');
  }

  async submitAttempt(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<AttemptSubmitOutcome> {
    // R8-G: one-shot guarded transition. Exactly one concurrent submitter
    // wins; retries after success are idempotent; any other state is an
    // explicit conflict — never a silent double submit.
    const transitioned = await this.repos.attemptRepository.transitionSubmittedFrom(
      attemptId,
      new Date().toISOString(),
      'in_progress',
    );
    if (transitioned) return { outcome: 'submitted', attempt: transitioned };
    const current = await this.repos.attemptRepository.getById(attemptId);
    if (!current) return { outcome: 'not_found' };
    if (current.status === 'submitted' || current.status === 'auto_submitted') {
      return { outcome: 'already_submitted', attempt: current };
    }
    return { outcome: 'conflict', currentStatus: current.status };
  }

  async autoSubmitAttempt(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<ExamAttempt | null> {
    const attempt = await this.repos.attemptRepository.getById(attemptId);
    if (!attempt) return null;
    const updated = await this.repos.attemptRepository.updateStatus(attemptId, 'auto_submitted');
    return updated;
  }

  async expireAttempt(
    ctx: ExamDeliveryCommandContext,
    attemptId: string,
  ): Promise<ExamAttempt | null> {
    return this.repos.attemptRepository.updateStatus(attemptId, 'expired');
  }

  async listAttemptsForSession(deliverySessionId: string): Promise<ExamAttempt[]> {
    return this.repos.attemptRepository.listByDeliverySessionId(deliverySessionId);
  }

  async listAttemptsForStudent(schoolId: string, studentRef: string): Promise<ExamAttempt[]> {
    return this.repos.attemptRepository.listByStudentRef(schoolId, studentRef);
  }
}
