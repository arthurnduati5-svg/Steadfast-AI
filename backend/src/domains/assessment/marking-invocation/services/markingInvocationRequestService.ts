import { MarkingInvocationRequest, MarkingInvocationCommandContext } from '../contracts/markingInvocationContracts';
import { MarkingInvocationRequestRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemoryMarkingInvocationRequestRepository } from '../repositories/inMemoryMarkingInvocationRepositories';
import { MARKING_INVOCATION_POLICY_DEFAULTS, ALLOWED_INVOCATION_MUTATION_ROLES, BLOCKED_INVOCATION_MUTATION_ROLES } from '../policies/markingInvocationPolicyDefinitions';

export interface CreateInvocationRequestParams {
  schoolId: string;
  deliverySessionId: string;
  paperId: string;
  paperVersionId: string;
  requestedByActorId: string;
  requestedByRole: string;
  invocationMode: string;
  sourceType: string;
  submittedSnapshotRefs: string[];
  safeRequestSummary: string;
}

export class MarkingInvocationRequestService {
  constructor(
    private requestRepo: MarkingInvocationRequestRepository = new InMemoryMarkingInvocationRequestRepository(),
  ) {}

  async createInvocationRequest(params: CreateInvocationRequestParams): Promise<MarkingInvocationRequest> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!params.requestedByActorId) throw new Error('VALIDATION_FAILED: requestedByActorId is required');
    if (BLOCKED_INVOCATION_MUTATION_ROLES.includes(params.requestedByRole)) {
      throw new Error('FORBIDDEN: Student, parent, guest, or unknown roles cannot create marking invocation requests');
    }
    if (!ALLOWED_INVOCATION_MUTATION_ROLES.includes(params.requestedByRole)) {
      throw new Error('FORBIDDEN: Only teacher, lead_teacher, department_head, admin, or system_job may create invocation requests');
    }
    const policyDefault = MARKING_INVOCATION_POLICY_DEFAULTS.MARKING_INVOCATION_REQUEST;
    if (policyDefault) {
      const decision = policyDefault.missingDecision;
      if (!decision.allowed) {
        throw new Error(`POLICY_BLOCKED: ${decision.reasonCode} - ${decision.safeMessage}`);
      }
    }
    const now = new Date().toISOString();
    const request: MarkingInvocationRequest = {
      markingInvocationRequestId: crypto.randomUUID(),
      schoolId: params.schoolId,
      deliverySessionId: params.deliverySessionId,
      paperId: params.paperId,
      paperVersionId: params.paperVersionId,
      requestedByActorId: params.requestedByActorId,
      requestedByRole: params.requestedByRole,
      invocationStatus: 'draft',
      invocationMode: params.invocationMode as any || 'deterministic_plus_teacher_review',
      sourceType: params.sourceType as any || 'delivery_session_snapshot_batch',
      submittedSnapshotRefsJson: { snapshotRefs: params.submittedSnapshotRefs },
      safeRequestSummary: params.safeRequestSummary,
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
    };
    return this.requestRepo.create(request);
  }

  async getInvocationRequest(markingInvocationRequestId: string): Promise<MarkingInvocationRequest | null> {
    return this.requestRepo.findById(markingInvocationRequestId);
  }

  async listInvocationRequestsForSchool(schoolId: string): Promise<MarkingInvocationRequest[]> {
    return this.requestRepo.findBySchoolId(schoolId);
  }

  async validateInvocationRequest(markingInvocationRequestId: string): Promise<MarkingInvocationRequest> {
    const request = await this.requestRepo.findById(markingInvocationRequestId);
    if (!request) throw new Error('NOT_FOUND: Marking invocation request not found');
    if (request.invocationStatus === 'cancelled') throw new Error('VALIDATION_FAILED: Cannot validate a cancelled request');
    request.invocationStatus = 'validated';
    request.updatedAt = new Date().toISOString();
    return this.requestRepo.update(request);
  }

  async queueInvocationRequest(markingInvocationRequestId: string): Promise<MarkingInvocationRequest> {
    const request = await this.requestRepo.findById(markingInvocationRequestId);
    if (!request) throw new Error('NOT_FOUND: Marking invocation request not found');
    if (request.invocationStatus === 'cancelled') throw new Error('VALIDATION_FAILED: Cannot queue a cancelled request');
    request.invocationStatus = 'queued';
    request.updatedAt = new Date().toISOString();
    return this.requestRepo.update(request);
  }

  async cancelInvocationRequest(markingInvocationRequestId: string): Promise<MarkingInvocationRequest> {
    const request = await this.requestRepo.findById(markingInvocationRequestId);
    if (!request) throw new Error('NOT_FOUND: Marking invocation request not found');
    if (request.invocationStatus === 'completed' || request.invocationStatus === 'running') {
      throw new Error('VALIDATION_FAILED: Cannot cancel a completed or running request');
    }
    request.invocationStatus = 'cancelled';
    request.cancelledAt = new Date().toISOString();
    request.updatedAt = request.cancelledAt;
    return this.requestRepo.update(request);
  }

  async blockInvocationRequest(markingInvocationRequestId: string, reason: string): Promise<MarkingInvocationRequest> {
    const request = await this.requestRepo.findById(markingInvocationRequestId);
    if (!request) throw new Error('NOT_FOUND: Marking invocation request not found');
    request.invocationStatus = 'blocked';
    request.safeRequestSummary = reason;
    request.updatedAt = new Date().toISOString();
    return this.requestRepo.update(request);
  }
}
