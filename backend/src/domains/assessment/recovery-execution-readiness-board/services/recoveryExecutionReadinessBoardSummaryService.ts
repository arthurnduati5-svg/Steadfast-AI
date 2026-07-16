import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts';
import { RecoveryExecutionReadinessBoardSummary, CreateBoardSummaryRequest } from '../contracts/recoveryExecutionReadinessBoardSummaryContracts';
import { InMemoryRecoveryExecutionReadinessBoardSummaryRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
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

export class RecoveryExecutionReadinessBoardSummaryService {
  private repo: InMemoryRecoveryExecutionReadinessBoardSummaryRepository;

  constructor() {
    this.repo = new InMemoryRecoveryExecutionReadinessBoardSummaryRepository();
  }

  async createBoardSummary(
    context: RecoveryExecutionReadinessBoardCommandContext,
    request: CreateBoardSummaryRequest,
  ): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary>> {
    const policy = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_SUMMARY_MUTATION', context.actorRole);
    if (!policy.allowed) return errorEnvelope(policy.reason, context);
    if (!request.schoolId) return errorEnvelope('schoolId is required', context);
    if (!request.safeSummary) return errorEnvelope('safeSummary is required', context);
    const record = await this.repo.create({
      ...request,
      createdByActorId: context.actorId,
      createdByRole: context.actorRole,
      sourceRefsJson: context.sourceRefsJson || request.sourceRefsJson || {},
    });
    return safeEnvelope(record, 'created', context);
  }

  async getBoardSummary(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary | null>> {
    const record = await this.repo.getById(id);
    if (!record) return errorEnvelope('Board summary not found', context);
    return safeEnvelope(record, 'success', context);
  }

  async listBoardSummariesForSchool(schoolId: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary[]>> {
    const records = await this.repo.listBySchool(schoolId);
    return safeEnvelope(records, 'success', context);
  }

  async listBoardSummariesForStudent(schoolId: string, studentRef: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary[]>> {
    const records = await this.repo.listByStudentRef(schoolId, studentRef);
    return safeEnvelope(records, 'success', context);
  }

  async listBoardSummariesForPlan(planId: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary[]>> {
    const records = await this.repo.listByPlanId(planId);
    return safeEnvelope(records, 'success', context);
  }

  async refreshBoardSummary(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary>> {
    const record = await this.repo.update(id, { summaryStatus: 'active' } as any);
    return safeEnvelope(record, 'refreshed', context);
  }

  async markBoardSummaryStale(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary>> {
    const record = await this.repo.markStale(id);
    return safeEnvelope(record, 'stale', context);
  }

  async markBoardSummaryReviewReady(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary>> {
    const record = await this.repo.markReviewReady(id);
    return safeEnvelope(record, 'review_ready', context);
  }

  async blockBoardSummary(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary>> {
    const record = await this.repo.block(id);
    return safeEnvelope(record, 'blocked', context);
  }

  async voidBoardSummary(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardSummary>> {
    const record = await this.repo.void(id);
    return safeEnvelope(record, 'voided', context);
  }
}
