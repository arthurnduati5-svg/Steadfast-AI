import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts/recoveryExecutionReadinessBoardContracts';
import { RecoveryExecutionReadinessBoardRoleProjection, CreateRoleProjectionRequest } from '../contracts/recoveryExecutionReadinessBoardProjectionContracts';
import { RecoveryExecutionReadinessBoardRoleProjectionRepository } from '../contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import { RECOVERY_EXECUTION_READINESS_BOARD_POLICIES } from '../policies/recoveryExecutionReadinessBoardPolicyDefinitions';
import { v4 as uuid } from 'uuid';

function checkPolicy(policyFamily: string, actorRole: string): { allowed: boolean; denied: boolean; reasonCodes: string[] } {
  const policy = RECOVERY_EXECUTION_READINESS_BOARD_POLICIES[policyFamily];
  if (!policy) return { allowed: false, denied: true, reasonCodes: ['POLICY_NOT_FOUND'] };
  if (policy.blockedRoles.includes(actorRole)) return { allowed: false, denied: true, reasonCodes: [`ROLE_BLOCKED:${actorRole}`] };
  if (policy.allowedRoles.includes(actorRole)) return { allowed: true, denied: false, reasonCodes: [] };
  if (policy.failClosed) return { allowed: false, denied: true, reasonCodes: [`ROLE_NOT_ALLOWED:${actorRole}`] };
  return { allowed: false, denied: true, reasonCodes: [`ROLE_NOT_AUTHORIZED:${actorRole}`] };
}

export class RecoveryExecutionReadinessBoardProjectionService {
  constructor(private repo: RecoveryExecutionReadinessBoardRoleProjectionRepository) {}

  async createRoleProjection(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, body: CreateRoleProjectionRequest): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_ROLE_PROJECTION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionReadinessBoardRoleProjection> = {
        boardRoleProjectionId: uuid(),
        boardSnapshotId: body.boardSnapshotId,
        schoolId: ctx.schoolId,
        targetRole: body.targetRole,
        actorId: body.actorId,
        actorRef: body.actorRef,
        projectionStatus: body.projectionStatus ?? 'draft',
        projectionSummary: body.projectionSummary,
        projectionDetailsJson: body.projectionDetailsJson ?? {},
        visibleLaneKeysJson: body.visibleLaneKeysJson ?? [],
        visibleCardKeysJson: body.visibleCardKeysJson ?? [],
        blockedReasonCodesJson: [],
        sourceRefsJson: body.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };
      const created = await this.repo.create(record);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getRoleProjection(schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Role projection not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRoleProjectionsForSnapshot(snapshotId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection[]>> {
    try {
      const records = await this.repo.listBySnapshotId(snapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRoleProjectionsByRole(role: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection[]>> {
    try {
      const records = await this.repo.listByRole(role);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRoleProjectionsByActor(actorId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection[]>> {
    try {
      const records = await this.repo.listByActor(actorId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markRoleProjectionReviewReady(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_ROLE_PROJECTION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressRoleProjection(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_ROLE_PROJECTION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.suppress(id);
      return { success: true, data: updated, status: 'suppressed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockRoleProjection(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_ROLE_PROJECTION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidRoleProjection(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardRoleProjection>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_ROLE_PROJECTION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
