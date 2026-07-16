import { RecoveryExecutionReadinessBoardCommandContext, RecoveryExecutionReadinessBoardSafeEnvelope } from '../contracts/recoveryExecutionReadinessBoardContracts';
import { RecoveryExecutionReadinessBoardBlocker, CreateBoardBlockerRequest } from '../contracts/recoveryExecutionReadinessBoardBlockerContracts';
import { RecoveryExecutionReadinessBoardBlockerRepository } from '../contracts/recoveryExecutionReadinessBoardRepositoryContracts';
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

export class RecoveryExecutionReadinessBoardBlockerService {
  constructor(private repo: RecoveryExecutionReadinessBoardBlockerRepository) {}

  async createBoardBlocker(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, body: CreateBoardBlockerRequest): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_BLOCKER_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionReadinessBoardBlocker> = {
        boardBlockerId: uuid(),
        boardSnapshotId: body.boardSnapshotId,
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        teacherRef: body.teacherRef,
        adminRef: body.adminRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        laneKey: body.laneKey,
        cardKey: body.cardKey,
        blockerStatus: body.blockerStatus ?? 'active',
        blockerPriority: body.blockerPriority ?? 'normal',
        blockerCategory: body.blockerCategory,
        blockerSummary: body.blockerSummary,
        blockerDetailsJson: body.blockerDetailsJson ?? {},
        resolutionNotesJson: body.resolutionNotesJson ?? {},
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

  async getBoardBlocker(schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Board blocker not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardBlockersForSnapshot(snapshotId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker[]>> {
    try {
      const records = await this.repo.listBySnapshotId(snapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardBlockersForStudent(schoolId: string, studentRef: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardBlockersForPlan(schoolId: string, planId: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker[]>> {
    try {
      const records = await this.repo.listByPlanId(planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listBoardBlockersByStatus(status: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker[]>> {
    try {
      const records = await this.repo.listByStatus(status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markBoardBlockerReviewReady(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_BLOCKER_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async resolveBoardBlockerForFutureReviewOnly(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_BLOCKER_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.resolve(id);
      return { success: true, data: updated, status: 'resolved', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressBoardBlocker(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_BLOCKER_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.suppress(id);
      return { success: true, data: updated, status: 'suppressed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidBoardBlocker(ctx: RecoveryExecutionReadinessBoardCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionReadinessBoardSafeEnvelope<RecoveryExecutionReadinessBoardBlocker>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_EXECUTION_READINESS_BOARD_BLOCKER_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
