import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts/recoveryExecutionReadinessBoardContracts';
import { RecoveryExecutionReadinessBoardLane, CreateBoardLaneRequest } from '../contracts/recoveryExecutionReadinessBoardLaneContracts';
import { RecoveryExecutionReadinessBoardLaneRepository } from '../contracts/recoveryExecutionReadinessBoardRepositoryContracts';
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

export class RecoveryExecutionReadinessBoardLaneService {
  constructor(private repo: RecoveryExecutionReadinessBoardLaneRepository) {}

  async createBoardLane(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, body: CreateBoardLaneRequest): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_LANE_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionReadinessBoardLane> = {
        boardLaneId: uuid(),
        boardSnapshotId: body.boardSnapshotId,
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        teacherRef: body.teacherRef,
        adminRef: body.adminRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        laneKey: body.laneKey,
        laneStatus: body.laneStatus ?? 'draft',
        lanePriority: body.lanePriority ?? 'normal',
        laneSummary: body.laneSummary,
        laneDetailsJson: body.laneDetailsJson ?? {},
        cardKeysJson: body.cardKeysJson ?? [],
        cardCount: 0,
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

  async getBoardLane(schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Board lane not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardLanesForSnapshot(snapshotId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane[]>> {
    try {
      const records = await this.repo.listBySnapshotId(snapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardLanesByLaneKey(laneKey: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane[]>> {
    try {
      const records = await this.repo.listByLaneKey(laneKey);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardLanesByStatus(status: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane[]>> {
    try {
      const records = await this.repo.listByStatus(status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markBoardLaneReady(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_LANE_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markBoardLaneStale(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_LANE_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markStale(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockBoardLane(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_LANE_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidBoardLane(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardLane>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_LANE_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
