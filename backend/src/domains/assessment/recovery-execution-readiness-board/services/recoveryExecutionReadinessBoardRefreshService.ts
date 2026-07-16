import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts';
import { RecoveryExecutionReadinessBoardRefreshJob, CreateRefreshJobRequest } from '../contracts/recoveryExecutionReadinessBoardRefreshContracts';
import { InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository } from '../repositories/inMemoryRecoveryExecutionReadinessBoardRepositories';
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

export class RecoveryExecutionReadinessBoardRefreshService {
  private repo: InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository;

  constructor() {
    this.repo = new InMemoryRecoveryExecutionReadinessBoardRefreshJobRepository();
  }

  async createRefreshJob(
    context: RecoveryExecutionReadinessBoardCommandContext,
    request: CreateRefreshJobRequest,
  ): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob>> {
    const policy = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_REFRESH_JOB_CREATION', context.actorRole);
    if (!policy.allowed) return errorEnvelope(policy.reason, context);
    if (!request.schoolId) return errorEnvelope('schoolId is required', context);
    if (!request.jobType) return errorEnvelope('jobType is required', context);
    if (!request.jobSummary) return errorEnvelope('jobSummary is required', context);
    const record = await this.repo.create({
      ...request,
      createdByActorId: context.actorId,
      createdByRole: context.actorRole,
      sourceRefsJson: context.sourceRefsJson || request.sourceRefsJson || {},
    });
    return safeEnvelope(record, 'created', context);
  }

  async getRefreshJob(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob | null>> {
    const record = await this.repo.getById(id);
    if (!record) return errorEnvelope('Refresh job not found', context);
    return safeEnvelope(record, 'success', context);
  }

  async listRefreshJobsForSchool(schoolId: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob[]>> {
    const records = await this.repo.listBySchool(schoolId);
    return safeEnvelope(records, 'success', context);
  }

  async listRefreshJobsForSnapshot(snapshotId: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob[]>> {
    const records = await this.repo.listBySnapshotId(snapshotId);
    return safeEnvelope(records, 'success', context);
  }

  async listRefreshJobsByStatus(status: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob[]>> {
    const records = await this.repo.listByStatus(status);
    return safeEnvelope(records, 'success', context);
  }

  async markRefreshJobRunning(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob>> {
    const record = await this.repo.markRunning(id);
    return safeEnvelope(record, 'running', context);
  }

  async markRefreshJobCompleted(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob>> {
    const record = await this.repo.markCompleted(id);
    return safeEnvelope(record, 'completed', context);
  }

  async markRefreshJobFailed(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob>> {
    const record = await this.repo.markFailed(id);
    return safeEnvelope(record, 'failed', context);
  }

  async voidRefreshJob(id: string, context?: RecoveryExecutionReadinessBoardCommandContext): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRefreshJob>> {
    const record = await this.repo.void(id);
    return safeEnvelope(record, 'voided', context);
  }
}
