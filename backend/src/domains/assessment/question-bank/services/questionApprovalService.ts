import { randomUUID } from 'crypto';
import type { AssessmentCommandEnforcementService } from '../../../assessment/assessmentCommandEnforcementService';
import type { QuestionApprovalRequest, QuestionApprovalRecord, ApprovalRequestStatus, ApprovalDecision } from '../contracts/questionApprovalContracts';
import type { QuestionApprovalRequestRepository, QuestionApprovalRecordRepository } from '../contracts/questionApprovalContracts';
import type { QuestionBankItemRepository, QuestionVersionRepository } from '../contracts/questionBankRepositoryContracts';
import type { AssessmentCommandContext } from '../../../assessment/contracts/assessmentCommandContext';
import type { AssessmentPolicyFamily } from '../../../assessment/contracts/assessmentPolicyContracts';

export class QuestionApprovalService {
  constructor(
    private enforcementService: AssessmentCommandEnforcementService,
    private approvalRequestRepository: QuestionApprovalRequestRepository,
    private approvalRecordRepository: QuestionApprovalRecordRepository,
    private questionBankItemRepository: QuestionBankItemRepository,
    private questionVersionRepository: QuestionVersionRepository,
  ) {}

  async createApprovalRequest(params: {
    schoolId: string;
    questionId: string;
    questionVersionId: string;
    requestReason: string;
    context: AssessmentCommandContext;
  }): Promise<QuestionApprovalRequest> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context: params.context,
      commandType: 'question:approval:create_request',
      commandFingerprint: `approval:request:${params.questionVersionId}:${Date.now()}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_APPROVAL' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const version = await this.questionVersionRepository.findById(params.questionVersionId);
    if (!version) throw new Error('NOT_FOUND: question version not found');
    if (version.status !== 'pending_approval') {
      throw new Error('INVALID_STATE: question version must be pending_approval');
    }

    const request: QuestionApprovalRequest = {
      approvalRequestId: randomUUID(),
      schoolId: params.schoolId,
      questionId: params.questionId,
      questionVersionId: params.questionVersionId,
      requestedByActorId: params.context.actorId,
      requestedByRole: params.context.actorRole,
      status: 'pending',
      requestReason: params.requestReason,
      policyVersionRefsJson: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closedAt: null,
    };

    return this.approvalRequestRepository.create(request);
  }

  async listPendingApprovalRequests(schoolId: string): Promise<QuestionApprovalRequest[]> {
    return this.approvalRequestRepository.findPendingBySchoolId(schoolId);
  }

  async recordApprovalDecision(params: {
    approvalRequestId: string;
    schoolId: string;
    questionId: string;
    questionVersionId: string;
    decision: ApprovalDecision;
    decisionReason: string;
    reasonCodes?: string[];
    context: AssessmentCommandContext;
  }): Promise<QuestionApprovalRecord> {
    const studentRoles = ['student', 'parent'];
    if (studentRoles.includes(params.context.actorRole)) {
      throw new Error('POLICY_BLOCKED: student/parent cannot approve');
    }

    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context: params.context,
      commandType: 'question:approval:record_decision',
      commandFingerprint: `approval:decision:${params.approvalRequestId}:${Date.now()}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_APPROVAL' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const record: QuestionApprovalRecord = {
      approvalRecordId: randomUUID(),
      schoolId: params.schoolId,
      approvalRequestId: params.approvalRequestId,
      questionId: params.questionId,
      questionVersionId: params.questionVersionId,
      decision: params.decision,
      decidedByActorId: params.context.actorId,
      decidedByRole: params.context.actorRole,
      decisionReason: params.decisionReason,
      reasonCodesJson: params.reasonCodes ?? [],
      createdAt: new Date().toISOString(),
    };

    const saved = await this.approvalRecordRepository.create(record);

    if (params.decision === 'approved') {
      const closedAt = new Date().toISOString();
      await this.approvalRequestRepository.updateStatus(params.approvalRequestId, 'approved', closedAt);
      await this.questionVersionRepository.updateStatus(params.questionVersionId, 'approved');
      await this.questionBankItemRepository.updateStatus(params.questionId, 'approved', closedAt);
    } else if (params.decision === 'rejected' || params.decision === 'blocked') {
      const closedAt = new Date().toISOString();
      await this.approvalRequestRepository.updateStatus(params.approvalRequestId, params.decision === 'rejected' ? 'rejected' : 'blocked', closedAt);
      await this.questionVersionRepository.updateStatus(params.questionVersionId, 'rejected');
      await this.questionBankItemRepository.updateStatus(params.questionId, 'rejected', closedAt);
    } else if (params.decision === 'changes_requested') {
      await this.approvalRequestRepository.updateStatus(params.approvalRequestId, 'changes_requested', null);
    }

    return saved;
  }

  async requestChanges(params: {
    approvalRequestId: string;
    decisionReason: string;
    context: AssessmentCommandContext;
  }): Promise<QuestionApprovalRecord> {
    const request = await this.approvalRequestRepository.findById(params.approvalRequestId);
    if (!request) throw new Error('NOT_FOUND: approval request not found');

    return this.recordApprovalDecision({
      approvalRequestId: params.approvalRequestId,
      schoolId: request.schoolId,
      questionId: request.questionId,
      questionVersionId: request.questionVersionId,
      decision: 'changes_requested',
      decisionReason: params.decisionReason,
      context: params.context,
    });
  }

  async rejectQuestionVersion(params: {
    approvalRequestId: string;
    decisionReason: string;
    context: AssessmentCommandContext;
  }): Promise<QuestionApprovalRecord> {
    const request = await this.approvalRequestRepository.findById(params.approvalRequestId);
    if (!request) throw new Error('NOT_FOUND: approval request not found');

    return this.recordApprovalDecision({
      approvalRequestId: params.approvalRequestId,
      schoolId: request.schoolId,
      questionId: request.questionId,
      questionVersionId: request.questionVersionId,
      decision: 'rejected',
      decisionReason: params.decisionReason,
      context: params.context,
    });
  }
}
