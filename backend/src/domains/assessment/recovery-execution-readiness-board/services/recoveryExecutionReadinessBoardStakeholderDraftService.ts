import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts';
import { RecoveryExecutionReadinessBoardStudentSafeStatusDraft, RecoveryExecutionReadinessBoardParentSafeStatusDraft, CreateStudentSafeStatusDraftRequest, CreateParentSafeStatusDraftRequest } from '../contracts/recoveryExecutionReadinessBoardStakeholderDraftContracts';
import type { RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository, RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository } from '../contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import { RECOVERY_EXECUTION_READINESS_BOARD_POLICIES } from '../policies/recoveryExecutionReadinessBoardPolicyDefinitions';

function checkPolicy(policyName: string, actorRole: string): { allowed: boolean; reason: string } {
  const policy = RECOVERY_EXECUTION_READINESS_BOARD_POLICIES[policyName];
  if (!policy) return { allowed: false, reason: 'Policy not found' };
  if (policy.allowedRoles.includes(actorRole)) return { allowed: true, reason: 'Allowed by policy' };
  if (policy.blockedRoles.includes(actorRole)) return { allowed: false, reason: `Role ${actorRole} is blocked by policy` };
  return { allowed: false, reason: `Role ${actorRole} is not allowed by policy` };
}

function safeEnvelope<T>(data: T, status = 'success', context?: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardSafeEnvelope<T> {
  return { success: true, status, data, correlationId: context?.correlationId };
}

function errorEnvelope<T = never>(message: string, context?: RecoveryExecutionReadinessBoardCommandContext): RecoveryExecutionReadinessBoardSafeEnvelope<T> {
  return { success: false, status: 'error', error: message, correlationId: context?.correlationId };
}

export class RecoveryExecutionReadinessBoardStakeholderDraftService {
  private studentRepo: RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository;
  private parentRepo: RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository;

  constructor(
    studentRepo: RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository,
    parentRepo: RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository,
  ) {
    this.studentRepo = studentRepo;
    this.parentRepo = parentRepo;
  }

  async createStudentSafeStatusDraft(
    context: RecoveryExecutionReadinessBoardCommandContext,
    request: CreateStudentSafeStatusDraftRequest,
  ): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>> {
    const policy = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_STUDENT_SAFE_STATUS_DRAFT_CREATION', context.actorRole);
    if (!policy.allowed) return errorEnvelope(policy.reason, context);
    if (!request.schoolId) return errorEnvelope('schoolId is required', context);
    if (!request.studentRef) return errorEnvelope('studentRef is required', context);
    if (!request.safeStatusSummary) return errorEnvelope('safeStatusSummary is required', context);
    const record = await this.studentRepo.create({
      ...request,
      createdByActorId: context.actorId,
      createdByRole: context.actorRole,
      sourceRefsJson: context.sourceRefsJson || request.sourceRefsJson || {},
    });
    return safeEnvelope(record, 'created', context);
  }

  async createParentSafeStatusDraft(
    context: RecoveryExecutionReadinessBoardCommandContext,
    request: CreateParentSafeStatusDraftRequest,
  ): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardParentSafeStatusDraft>> {
    const policy = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_PARENT_SAFE_STATUS_DRAFT_CREATION', context.actorRole);
    if (!policy.allowed) return errorEnvelope(policy.reason, context);
    if (!request.schoolId) return errorEnvelope('schoolId is required', context);
    if (!request.studentRef) return errorEnvelope('studentRef is required', context);
    if (!request.safeStatusSummary) return errorEnvelope('safeStatusSummary is required', context);
    const record = await this.parentRepo.create({
      ...request,
      createdByActorId: context.actorId,
      createdByRole: context.actorRole,
      sourceRefsJson: context.sourceRefsJson || request.sourceRefsJson || {},
    });
    return safeEnvelope(record, 'created', context);
  }

  async getStudentSafeStatusDraft(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardStudentSafeStatusDraft | null>> {
    const record = await this.studentRepo.getById(id);
    if (!record) return errorEnvelope('Student safe status draft not found', context);
    return safeEnvelope(record, 'success', context);
  }

  async getParentSafeStatusDraft(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardParentSafeStatusDraft | null>> {
    const record = await this.parentRepo.getById(id);
    if (!record) return errorEnvelope('Parent safe status draft not found', context);
    return safeEnvelope(record, 'success', context);
  }

  async listStudentSafeStatusDraftsForPlan(planId: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardStudentSafeStatusDraft[]>> {
    const records = await this.studentRepo.listByPlanId(planId);
    return safeEnvelope(records, 'success', context);
  }

  async listParentSafeStatusDraftsForPlan(planId: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardParentSafeStatusDraft[]>> {
    const records = await this.parentRepo.listByPlanId(planId);
    return safeEnvelope(records, 'success', context);
  }

  async markStudentSafeStatusDraftReviewReady(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>> {
    const record = await this.studentRepo.markReviewReady(id);
    return safeEnvelope(record, 'review_ready', context);
  }

  async markParentSafeStatusDraftReviewReady(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardParentSafeStatusDraft>> {
    const record = await this.parentRepo.markReviewReady(id);
    return safeEnvelope(record, 'review_ready', context);
  }

  async suppressStudentSafeStatusDraft(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>> {
    const record = await this.studentRepo.suppress(id);
    return safeEnvelope(record, 'suppressed', context);
  }

  async suppressParentSafeStatusDraft(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardParentSafeStatusDraft>> {
    const record = await this.parentRepo.suppress(id);
    return safeEnvelope(record, 'suppressed', context);
  }

  async blockStudentSafeStatusDraft(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>> {
    const record = await this.studentRepo.block(id);
    return safeEnvelope(record, 'blocked', context);
  }

  async blockParentSafeStatusDraft(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardParentSafeStatusDraft>> {
    const record = await this.parentRepo.block(id);
    return safeEnvelope(record, 'blocked', context);
  }

  async voidStudentSafeStatusDraft(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardStudentSafeStatusDraft>> {
    const record = await this.studentRepo.void(id);
    return safeEnvelope(record, 'voided', context);
  }

  async voidParentSafeStatusDraft(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardParentSafeStatusDraft>> {
    const record = await this.parentRepo.void(id);
    return safeEnvelope(record, 'voided', context);
  }
}
