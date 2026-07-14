import { randomUUID } from 'crypto';
import type { ResultRegradeRequestRepository, ResultRegradeIntakeRepository } from '../contracts/resultGovernanceRepositoryContracts';
import type { ResultRegradeRequest, ResultRegradeIntake, CreateRegradeRequestRequest } from '../contracts/index';
import { ResultGovernancePolicyRegistry, isAllowedMutationRole } from '../policies/resultGovernancePolicyDefinitions';

export class ResultRegradeRequestService {
  constructor(
    private requestRepo: ResultRegradeRequestRepository,
    private policyRegistry: ResultGovernancePolicyRegistry,
  ) {}

  async createRegradeRequest(req: CreateRegradeRequestRequest): Promise<ResultRegradeRequest> {
    if (!req.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!req.markingResultVersionId) throw new Error('VALIDATION_FAILED: markingResultVersionId is required');

    if (req.requesterRole === 'student' && req.studentRef !== req.requesterActorId) {
      throw new Error('FORBIDDEN: students can only create regrade requests for their own studentRef');
    }

    const policy = this.policyRegistry.checkPolicy('RESULT_REGRADE_REQUEST', req.requesterRole);
    if (!policy.allowed) throw new Error(`POLICY_BLOCKED: ${policy.safeMessage}`);

    const request: ResultRegradeRequest = {
      resultRegradeRequestId: randomUUID(),
      schoolId: req.schoolId,
      resultFinalizationDecisionId: req.resultFinalizationDecisionId,
      markingResultVersionId: req.markingResultVersionId,
      markingRunId: req.markingRunId,
      studentRef: req.studentRef,
      requesterActorId: req.requesterActorId,
      requesterRole: req.requesterRole,
      requestStatus: 'submitted',
      requestType: req.requestType || 'student_challenge_escalation',
      safeRequestSummary: req.safeRequestSummary,
      reasonCodesJson: req.reasonCodes as Record<string, unknown>,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.requestRepo.create(request);
  }

  async getRegradeRequest(requestId: string): Promise<ResultRegradeRequest | null> {
    return this.requestRepo.getById(requestId);
  }

  async listRegradeRequestsForSchool(schoolId: string): Promise<ResultRegradeRequest[]> {
    return this.requestRepo.listBySchool(schoolId);
  }

  async listRegradeRequestsForStudent(schoolId: string, studentRef: string): Promise<ResultRegradeRequest[]> {
    return this.requestRepo.listByStudent(schoolId, studentRef);
  }

  async listRegradeRequestsForResultVersion(markingResultVersionId: string): Promise<ResultRegradeRequest[]> {
    return this.requestRepo.listByResultVersion(markingResultVersionId);
  }

  async cancelRegradeRequest(requestId: string, actorRole: string, safeSummary?: string): Promise<ResultRegradeRequest | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot cancel regrade requests`);
    return this.requestRepo.updateStatus(requestId, 'cancelled', safeSummary || 'Regrade request cancelled');
  }

  async rejectRegradeRequest(requestId: string, actorRole: string, safeSummary?: string): Promise<ResultRegradeRequest | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot reject regrade requests`);
    return this.requestRepo.updateStatus(requestId, 'rejected', safeSummary || 'Regrade request rejected');
  }

  async acceptRegradeRequestForReview(requestId: string, actorRole: string, safeSummary?: string): Promise<ResultRegradeRequest | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot accept regrade requests`);
    return this.requestRepo.updateStatus(requestId, 'accepted_for_review', safeSummary || 'Regrade request accepted for review');
  }

  async resolveWithoutChange(requestId: string, actorRole: string, safeSummary?: string): Promise<ResultRegradeRequest | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot resolve regrade requests`);
    return this.requestRepo.updateStatus(requestId, 'resolved_without_change', safeSummary || 'Resolved without score change');
  }

  async deferRegradeRequest(requestId: string, actorRole: string, safeSummary?: string): Promise<ResultRegradeRequest | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot defer regrade requests`);
    return this.requestRepo.updateStatus(requestId, 'deferred', safeSummary || 'Regrade request deferred');
  }
}

export class ResultRegradeIntakeService {
  constructor(
    private intakeRepo: ResultRegradeIntakeRepository,
    private requestRepo: ResultRegradeRequestRepository,
    private policyRegistry: ResultGovernancePolicyRegistry,
  ) {}

  async createRegradeIntake(params: {
    schoolId: string;
    resultRegradeRequestId: string;
    safeIntakeSummary: string;
    triageReasonCodes?: Record<string, unknown>;
  }): Promise<ResultRegradeIntake> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    const policy = this.policyRegistry.checkPolicy('RESULT_REGRADE_INTAKE', 'system_job');
    if (!policy.allowed) throw new Error(`POLICY_BLOCKED: ${policy.safeMessage}`);

    const request = await this.requestRepo.getById(params.resultRegradeRequestId);
    if (!request) throw new Error('NOT_FOUND: regrade request not found');

    const intake: ResultRegradeIntake = {
      resultRegradeIntakeId: randomUUID(),
      schoolId: params.schoolId,
      resultRegradeRequestId: params.resultRegradeRequestId,
      intakeStatus: 'received',
      safeIntakeSummary: params.safeIntakeSummary,
      triageReasonCodesJson: params.triageReasonCodes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.intakeRepo.create(intake);
  }

  async assignRegradeReviewer(intakeId: string, reviewerActorId: string, reviewerRole: string, actorRole: string): Promise<ResultRegradeIntake | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot assign reviewers`);
    return this.intakeRepo.assignReviewer(intakeId, reviewerActorId, reviewerRole);
  }

  async acceptRegradeIntake(intakeId: string, actorRole: string): Promise<ResultRegradeIntake | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot accept intakes`);
    return this.intakeRepo.updateStatus(intakeId, 'accepted', 'Intake accepted for review');
  }

  async rejectRegradeIntake(intakeId: string, actorRole: string, safeSummary?: string): Promise<ResultRegradeIntake | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot reject intakes`);
    return this.intakeRepo.updateStatus(intakeId, 'rejected', safeSummary || 'Intake rejected');
  }

  async blockRegradeIntake(intakeId: string, actorRole: string, safeSummary?: string): Promise<ResultRegradeIntake | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot block intakes`);
    return this.intakeRepo.updateStatus(intakeId, 'blocked', safeSummary || 'Intake blocked');
  }

  async completeRegradeIntake(intakeId: string, actorRole: string, safeSummary?: string): Promise<ResultRegradeIntake | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot complete intakes`);
    return this.intakeRepo.updateStatus(intakeId, 'completed', safeSummary || 'Intake completed');
  }

  async getRegradeIntake(intakeId: string): Promise<ResultRegradeIntake | null> {
    return this.intakeRepo.getById(intakeId);
  }

  async listIntakesForRequest(requestId: string): Promise<ResultRegradeIntake[]> {
    return this.intakeRepo.listByRequest(requestId);
  }
}
